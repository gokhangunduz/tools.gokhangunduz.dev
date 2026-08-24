import { ToolError } from "../text-tool";
import { buildTree } from "./logic";
import type { ParseReply, ParseRequest } from "./parse";

self.onmessage = (event: MessageEvent<ParseRequest>) => {
  const { id, input } = event.data;
  let reply: ParseReply;
  try {
    reply = { id, tree: buildTree(input) };
  } catch (cause) {
    reply = {
      id,
      error:
        cause instanceof ToolError
          ? { detail: cause.detail, at: cause.at }
          : null,
    };
  }
  self.postMessage(reply);
};
