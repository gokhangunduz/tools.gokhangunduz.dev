import { parseJson } from "@/lib/json";

export type Kind =
  "object" | "array" | "string" | "number" | "boolean" | "null";

/**
 * One value of the document. Scalars keep their text as written, so a
 * 20-digit id or 0.10000000000000001 is shown and copied exactly, not as the
 * double JSON.parse would round it to. Plain data, so a worker can send it.
 */
export type TreeNode = {
  key: string | number | null;
  kind: Kind;
  /** A string's decoded value, a number's source text, or true/false/null. */
  value: string;
  parent: number;
  depth: number;
  children: number[];
};

export type Tree = TreeNode[];

/** Validates with JSON.parse (for its speed and a positioned error), then indexes the text. */
export function buildTree(input: string): Tree {
  parseJson(input);
  return index(input);
}

const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

function index(s: string): Tree {
  const nodes: Tree = [];
  const stack: number[] = [];
  let i = 0;

  const ws = () => {
    while (i < s.length) {
      const c = s.charCodeAt(i);
      if (c === 32 || c === 10 || c === 13 || c === 9) i++;
      else break;
    }
  };

  const stringEnd = (start: number) => {
    let j = start + 1;
    while (j < s.length) {
      const c = s[j];
      if (c === "\\") j += 2;
      else if (c === '"') return j + 1;
      else j++;
    }
    return j;
  };

  const add = (kind: Kind, key: string | number | null, value = "") => {
    const parent = stack.length ? stack[stack.length - 1] : -1;
    const id = nodes.length;
    nodes.push({
      key,
      kind,
      value,
      parent,
      depth: parent < 0 ? 0 : nodes[parent].depth + 1,
      children: [],
    });
    if (parent >= 0) nodes[parent].children.push(id);
    return id;
  };

  const value = (key: string | number | null) => {
    ws();
    const c = s[i];
    if (c === "{" || c === "[") {
      stack.push(add(c === "{" ? "object" : "array", key));
      i++;
    } else if (c === '"') {
      const end = stringEnd(i);
      add("string", key, JSON.parse(s.slice(i, end)) as string);
      i = end;
    } else if (c === "t" || c === "f" || c === "n") {
      const word = c === "t" ? "true" : c === "f" ? "false" : "null";
      add(c === "n" ? "null" : "boolean", key, word);
      i += word.length;
    } else {
      NUMBER.lastIndex = i;
      const match = NUMBER.exec(s);
      const text = match ? match[0] : "";
      add("number", key, text);
      i += Math.max(text.length, 1);
    }
  };

  value(null);
  while (stack.length && i < s.length) {
    ws();
    const c = s[i];
    if (c === "}" || c === "]") {
      stack.pop();
      i++;
      continue;
    }
    if (c === ",") {
      i++;
      ws();
    }
    const top = nodes[stack[stack.length - 1]];
    if (top.kind === "object") {
      const end = stringEnd(i);
      const key = JSON.parse(s.slice(i, end)) as string;
      i = end;
      ws();
      i++;
      value(key);
    } else {
      value(top.children.length);
    }
  }
  return nodes;
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** One step of a JSONPath: `.name`, `[3]`, or `['first name']` when the key is not an identifier. */
export function pathSegment(key: string | number): string {
  if (typeof key === "number") return `[${key}]`;
  if (IDENTIFIER.test(key)) return `.${key}`;
  return `['${key.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}']`;
}

export function pathOf(tree: Tree, id: number): string {
  const parts: string[] = [];
  for (let at = id; tree[at].parent >= 0; at = tree[at].parent) {
    parts.push(pathSegment(tree[at].key ?? ""));
  }
  return `$${parts.reverse().join("")}`;
}

function scalarJson(node: TreeNode): string {
  return node.kind === "string" ? JSON.stringify(node.value) : node.value;
}

/** A subtree back as JSON, with numbers exactly as they were written. */
export function nodeJson(tree: Tree, id: number, indent = 2): string {
  const pad = (depth: number) => " ".repeat(indent * depth);
  const out: string[] = [];
  const write = (at: number, depth: number) => {
    const node = tree[at];
    if (node.kind !== "object" && node.kind !== "array") {
      out.push(scalarJson(node));
      return;
    }
    const [open, close] = node.kind === "object" ? ["{", "}"] : ["[", "]"];
    if (node.children.length === 0) {
      out.push(open + close);
      return;
    }
    out.push(`${open}\n`);
    node.children.forEach((child, index) => {
      out.push(pad(depth + 1));
      if (node.kind === "object") {
        out.push(`${JSON.stringify(tree[child].key)}: `);
      }
      write(child, depth + 1);
      out.push(index < node.children.length - 1 ? ",\n" : "\n");
    });
    out.push(`${pad(depth)}${close}`);
  };
  write(id, 0);
  return out.join("");
}

export function isContainer(node: TreeNode): boolean {
  return node.kind === "object" || node.kind === "array";
}

/** "id, total, paid…" for a collapsed object. */
export function keysPreview(tree: Tree, id: number, max = 3): string {
  const keys = tree[id].children.slice(0, max).map((c) => String(tree[c].key));
  return keys.join(", ") + (tree[id].children.length > max ? ", …" : "");
}

export const GROUP = 100;

export type Row =
  | { type: "node"; id: number; depth: number }
  | { type: "close"; id: number; depth: number }
  | { type: "group"; id: number; start: number; end: number; depth: number };

export function groupKey(id: number, start: number): string {
  return `${id}:${start}`;
}

/**
 * The rows on screen: open containers list their children and end with a
 * closing row; arrays over a hundred items list ranges instead.
 */
export function flatten(tree: Tree, open: ReadonlySet<string>): Row[] {
  if (tree.length === 0) return [];
  const rows: Row[] = [];
  const work: Row[] = [{ type: "node", id: 0, depth: 0 }];

  const pushChildren = (
    id: number,
    start: number,
    end: number,
    depth: number,
  ) => {
    const children = tree[id].children;
    for (let i = end - 1; i >= start; i--) {
      work.push({ type: "node", id: children[i], depth });
    }
  };

  while (work.length) {
    const item = work.pop()!;
    if (item.type === "close") {
      rows.push(item);
      continue;
    }
    if (item.type === "group") {
      rows.push(item);
      if (open.has(groupKey(item.id, item.start))) {
        pushChildren(item.id, item.start, item.end, item.depth + 1);
      }
      continue;
    }
    rows.push(item);
    const node = tree[item.id];
    if (!isContainer(node) || node.children.length === 0) continue;
    if (!open.has(String(item.id))) continue;

    work.push({ type: "close", id: item.id, depth: item.depth });
    const count = node.children.length;
    if (node.kind === "array" && count > GROUP) {
      for (
        let start = Math.floor((count - 1) / GROUP) * GROUP;
        start >= 0;
        start -= GROUP
      ) {
        work.push({
          type: "group",
          id: item.id,
          start,
          end: Math.min(start + GROUP, count),
          depth: item.depth + 1,
        });
      }
    } else {
      pushChildren(item.id, 0, count, item.depth + 1);
    }
  }
  return rows;
}

/** Keys that open a node and every ancestor, including the range it sits in. */
export function revealKeys(tree: Tree, id: number): string[] {
  const keys: string[] = [];
  for (
    let at = tree[id].parent, child = id;
    at >= 0;
    child = at, at = tree[at].parent
  ) {
    keys.push(String(at));
    const parent = tree[at];
    if (parent.kind === "array" && parent.children.length > GROUP) {
      const index = tree[child].key as number;
      keys.push(groupKey(at, Math.floor(index / GROUP) * GROUP));
    }
  }
  return keys;
}

/** Every container and range, for "open all". */
export function allKeys(tree: Tree): string[] {
  const keys: string[] = [];
  tree.forEach((node, id) => {
    if (!isContainer(node) || node.children.length === 0) return;
    keys.push(String(id));
    if (node.kind === "array" && node.children.length > GROUP) {
      for (let start = 0; start < node.children.length; start += GROUP) {
        keys.push(groupKey(id, start));
      }
    }
  });
  return keys;
}

/** The first two levels, which show the shape without unfolding everything. */
export function initialKeys(tree: Tree): string[] {
  const keys: string[] = [];
  tree.forEach((node, id) => {
    if (node.depth < 2 && isContainer(node)) keys.push(String(id));
  });
  return keys;
}

/** Nodes whose key or scalar value contains the query, ignoring case. */
export function search(tree: Tree, query: string, locale = "tr"): number[] {
  const needle = query.trim().toLocaleLowerCase(locale);
  if (!needle) return [];
  const found: number[] = [];
  tree.forEach((node, id) => {
    if (
      (typeof node.key === "string" &&
        node.key.toLocaleLowerCase(locale).includes(needle)) ||
      (!isContainer(node) &&
        node.value.toLocaleLowerCase(locale).includes(needle))
    ) {
      found.push(id);
    }
  });
  return found;
}
