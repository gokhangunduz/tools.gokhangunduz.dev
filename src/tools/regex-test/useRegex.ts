"use client";

import { useEffect, useRef, useState } from "react";
import type { Localized } from "@/i18n";
import { runRegex, type RegexOutcome, type RegexRequest } from "./logic";

const TIMEOUT = 500;

export const TIMED_OUT: Localized = {
  tr: "Desen çok uzun sürdü (catastrophic backtracking olabilir).",
  en: "The pattern took too long (possibly catastrophic backtracking).",
};

export type Answer = { request: RegexRequest; outcome: RegexOutcome };

function spawn(): Worker | null {
  try {
    return new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    return null;
  }
}

/**
 * Runs the pattern in a worker. A run that has not answered in 500 ms is
 * killed with its worker, since a backtracking pattern never yields and the
 * page would freeze with it; the next run gets a fresh worker.
 */
export function useRegex(request: RegexRequest | null): Answer | null {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const worker = useRef<Worker | null>(null);
  const pending = useRef<number | null>(null);
  const sequence = useRef(0);
  const key = request ? JSON.stringify(request) : "";

  useEffect(() => {
    if (!request) return;
    if (pending.current !== null) {
      window.clearTimeout(pending.current);
      worker.current?.terminate();
      worker.current = null;
      pending.current = null;
    }
    worker.current ??= spawn();
    const current = worker.current;
    const id = ++sequence.current;

    if (!current) {
      const outcome = runRegex(request);
      queueMicrotask(() => setAnswer({ request, outcome }));
      return;
    }

    pending.current = window.setTimeout(() => {
      current.terminate();
      if (worker.current === current) worker.current = null;
      pending.current = null;
      setAnswer({ request, outcome: { ok: false, error: TIMED_OUT } });
    }, TIMEOUT);

    current.onmessage = (
      event: MessageEvent<{ id: number; outcome: RegexOutcome }>,
    ) => {
      if (event.data.id !== id) return;
      if (pending.current !== null) window.clearTimeout(pending.current);
      pending.current = null;
      setAnswer({ request, outcome: event.data.outcome });
    };
    current.postMessage({ id, request });
    // `key` stands for `request`, which is a fresh object on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(
    () => () => {
      if (pending.current !== null) window.clearTimeout(pending.current);
      worker.current?.terminate();
      worker.current = null;
    },
    [],
  );

  return request ? answer : null;
}
