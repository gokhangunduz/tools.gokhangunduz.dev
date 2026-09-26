import { runRegex, type RegexRequest } from "./logic";

self.addEventListener(
  "message",
  (event: MessageEvent<{ id: number; request: RegexRequest }>) => {
    self.postMessage({
      id: event.data.id,
      outcome: runRegex(event.data.request),
    });
  },
);
