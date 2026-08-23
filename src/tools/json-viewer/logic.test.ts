import { describe, expect, it } from "vitest";
import { ToolError } from "../text-tool";
import {
  allKeys,
  buildTree,
  flatten,
  initialKeys,
  keysPreview,
  nodeJson,
  pathOf,
  pathSegment,
  revealKeys,
  search,
} from "./logic";

const SAMPLE = `{
  "order": { "id": 1001, "total": 249.9 },
  "first name": "Gökhan",
  "items": [ { "sku": "A-1" }, { "sku": "B-7" } ],
  "empty": {},
  "note": null
}`;

describe("buildTree", () => {
  it("indexes every value in document order", () => {
    const tree = buildTree(SAMPLE);
    expect(tree[0]).toMatchObject({ kind: "object", key: null, depth: 0 });
    expect(tree[0].children.map((c) => tree[c].key)).toEqual([
      "order",
      "first name",
      "items",
      "empty",
      "note",
    ]);
    const items = tree[tree[0].children[2]];
    expect(items.kind).toBe("array");
    expect(items.children.map((c) => tree[c].key)).toEqual([0, 1]);
  });

  it("keeps numbers exactly as written", () => {
    const tree = buildTree(
      '{"id": 12345678901234567890, "x": 1.10, "e": -2E+3}',
    );
    expect(tree.slice(1).map((n) => n.value)).toEqual([
      "12345678901234567890",
      "1.10",
      "-2E+3",
    ]);
  });

  it("decodes strings and escaped keys", () => {
    const tree = buildTree('{"a\\"b": "line\\nbreak \\u00e7"}');
    expect(tree[1]).toMatchObject({ key: 'a"b', value: "line\nbreak ç" });
  });

  it("handles scalars and empty containers at the root", () => {
    expect(buildTree(" 42 ")[0]).toMatchObject({ kind: "number", value: "42" });
    expect(buildTree("[]")[0].children).toEqual([]);
    expect(buildTree("[[], {}, [1]]").length).toBe(5);
  });

  it("throws a positioned ToolError on bad JSON", () => {
    try {
      buildTree('{\n  "a": 1,\n}');
      throw new Error("no throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ToolError);
      expect((error as ToolError).at?.line).toBe(2);
      expect((error as ToolError).detail.tr).toContain("virgül");
    }
  });
});

describe("paths", () => {
  it("uses bracket notation for keys that are not identifiers", () => {
    expect(pathSegment("name")).toBe(".name");
    expect(pathSegment("first name")).toBe("['first name']");
    expect(pathSegment("it's")).toBe("['it\\'s']");
    expect(pathSegment("a\\b")).toBe("['a\\\\b']");
    expect(pathSegment("1st")).toBe("['1st']");
    expect(pathSegment(3)).toBe("[3]");
  });

  it("builds full paths", () => {
    const tree = buildTree(SAMPLE);
    const items = tree[0].children[2];
    const sku = tree[tree[items].children[1]].children[0];
    expect(pathOf(tree, 0)).toBe("$");
    expect(pathOf(tree, sku)).toBe("$.items[1].sku");
    expect(pathOf(tree, tree[0].children[1])).toBe("$['first name']");
  });
});

describe("nodeJson", () => {
  it("serialises a subtree with exact numbers", () => {
    const tree = buildTree(
      '{"a": {"id": 12345678901234567890, "t": ["x"], "e": {}}}',
    );
    expect(nodeJson(tree, 1)).toBe(
      '{\n  "id": 12345678901234567890,\n  "t": [\n    "x"\n  ],\n  "e": {}\n}',
    );
    expect(nodeJson(tree, 3)).toBe('[\n  "x"\n]');
  });

  it("round-trips the whole document", () => {
    const tree = buildTree(SAMPLE);
    expect(JSON.parse(nodeJson(tree, 0))).toEqual(JSON.parse(SAMPLE));
  });
});

describe("flatten", () => {
  it("lists open nodes and closes them at the same depth", () => {
    const tree = buildTree('{"a": {"b": 1}, "c": 2}');
    const rows = flatten(tree, new Set(["0", "1"]));
    expect(rows.map((r) => `${r.type}:${r.id}@${r.depth}`)).toEqual([
      "node:0@0",
      "node:1@1",
      "node:2@2",
      "close:1@1",
      "node:3@1",
      "close:0@0",
    ]);
    expect(flatten(tree, new Set()).length).toBe(1);
  });

  it("groups arrays over a hundred items", () => {
    const tree = buildTree(
      JSON.stringify(Array.from({ length: 250 }, (_, i) => i)),
    );
    const rows = flatten(tree, new Set(["0"]));
    expect(rows.filter((r) => r.type === "group")).toEqual([
      { type: "group", id: 0, start: 0, end: 100, depth: 1 },
      { type: "group", id: 0, start: 100, end: 200, depth: 1 },
      { type: "group", id: 0, start: 200, end: 250, depth: 1 },
    ]);
    const opened = flatten(tree, new Set(["0", "0:200"]));
    expect(opened.filter((r) => r.type === "node").length).toBe(51);
  });

  it("opens two levels by default", () => {
    const tree = buildTree('{"a": {"b": {"c": 1}}}');
    expect(initialKeys(tree)).toEqual(["0", "1"]);
    expect(allKeys(tree)).toEqual(["0", "1", "2"]);
  });
});

describe("search and reveal", () => {
  it("matches keys and values, ignoring case", () => {
    const tree = buildTree(SAMPLE);
    const found = search(tree, "SKU");
    expect(found.length).toBe(2);
    expect(search(tree, "gökhan").map((id) => tree[id].key)).toEqual([
      "first name",
    ]);
    expect(search(tree, "  ")).toEqual([]);
  });

  it("opens the ancestors and the range of a match", () => {
    const tree = buildTree(
      JSON.stringify({ list: Array.from({ length: 150 }, (_, i) => ({ i })) }),
    );
    const target = search(tree, "i").find(
      (id) => pathOf(tree, id) === "$.list[120].i",
    )!;
    expect(revealKeys(tree, target)).toEqual([
      String(tree[target].parent),
      "1",
      "1:100",
      "0",
    ]);
  });

  it("previews the keys of a collapsed object", () => {
    const tree = buildTree('{"a":1,"b":2,"c":3,"d":4}');
    expect(keysPreview(tree, 0)).toBe("a, b, c, …");
  });
});
