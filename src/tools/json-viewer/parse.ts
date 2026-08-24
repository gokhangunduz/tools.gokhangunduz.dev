import type { Localized } from "@/i18n";
import { ToolError, type TextPosition } from "../text-tool";
import { buildTree, type Tree } from "./logic";

export type ParseRequest = { id: number; input: string };

export type ParseReply =
  | { id: number; tree: Tree }
  | { id: number; error: { detail: Localized; at?: TextPosition } | null };

export type Parsed =
  | { tree: Tree; error?: undefined }
  | { tree?: undefined; error: { detail: Localized; at?: TextPosition } };

const FAILED: Localized = {
  tr: "JSON okunamadı.",
  en: "Could not read the JSON.",
};

/** Above this many characters the parse leaves the main thread. */
export const LARGE = 200_000;

export function parseHere(input: string): Parsed {
  try {
    return { tree: buildTree(input) };
  } catch (cause) {
    return {
      error:
        cause instanceof ToolError
          ? { detail: cause.detail, at: cause.at }
          : { detail: FAILED },
    };
  }
}

let worker: Worker | null = null;
let unavailable = false;
let sequence = 0;
const waiting = new Map<
  number,
  { input: string; resolve: (parsed: Parsed) => void }
>();

function start(): Worker | null {
  if (unavailable || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    unavailable = true;
    return null;
  }
  worker.onmessage = (event: MessageEvent<ParseReply>) => {
    const reply = event.data;
    const entry = waiting.get(reply.id);
    if (!entry) return;
    waiting.delete(reply.id);
    if ("tree" in reply) entry.resolve({ tree: reply.tree });
    else entry.resolve({ error: reply.error ?? { detail: FAILED } });
  };
  worker.onerror = () => {
    unavailable = true;
    worker?.terminate();
    worker = null;
    for (const { input, resolve } of waiting.values())
      resolve(parseHere(input));
    waiting.clear();
  };
  return worker;
}

export function parseOffThread(input: string): Promise<Parsed> {
  const thread = start();
  if (!thread) return Promise.resolve(parseHere(input));
  const id = ++sequence;
  return new Promise((resolve) => {
    waiting.set(id, { input, resolve });
    thread.postMessage({ id, input } satisfies ParseRequest);
  });
}
