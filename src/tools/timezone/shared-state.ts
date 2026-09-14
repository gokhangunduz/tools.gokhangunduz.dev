"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  parseShared,
  readSharedHash,
  subscribeShared,
  writeShared,
} from "@/lib/share";

export type SharedValue = string | boolean | null;

type State<T> = { input: string; direction: string; options: T };

/**
 * Input, direction and options kept in the URL fragment, as TextTool does for
 * the tools it renders: read from the link until anything is touched, then
 * written back so the address bar is always the link to send. A null default
 * stands for "not chosen" (the browser's zone, say) and is left out of links.
 */
export function useSharedState<T extends Record<string, SharedValue>>(
  defaults: State<T>,
): {
  input: string;
  direction: string;
  options: T;
  setInput: (input: string) => void;
  setDirection: (direction: string) => void;
  setOption: <K extends keyof T>(id: K, value: T[K]) => void;
  update: (patch: Partial<State<T>>) => void;
} {
  const hash = useSyncExternalStore(subscribeShared, readSharedHash, () => "");
  const fromLink = useMemo((): State<T> => {
    const shared = parseShared(hash);
    const options = { ...defaults.options };
    for (const [id, fallback] of Object.entries(defaults.options)) {
      const value = shared?.options?.[id];
      if (
        value !== undefined &&
        (fallback === null
          ? typeof value === "string"
          : typeof value === typeof fallback)
      ) {
        (options as Record<string, SharedValue>)[id] = value as SharedValue;
      }
    }
    return {
      input: shared?.input ?? defaults.input,
      direction: shared?.direction ?? defaults.direction,
      options,
    };
    // `defaults` is a module constant in every caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);
  const [chosen, setChosen] = useState<State<T> | null>(null);
  const state = chosen ?? fromLink;

  const update = useCallback(
    (patch: Partial<State<T>>) =>
      setChosen((current) => ({ ...(current ?? fromLink), ...patch })),
    [fromLink],
  );

  useEffect(() => {
    if (!chosen) return;
    const id = window.setTimeout(() => {
      const options = Object.fromEntries(
        Object.entries(chosen.options).filter(
          ([id, value]) => value !== null && value !== defaults.options[id],
        ),
      );
      writeShared({
        input: chosen.input,
        direction:
          chosen.direction === defaults.direction
            ? undefined
            : chosen.direction,
        options,
      });
    }, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen]);

  return {
    ...state,
    update,
    setInput: useCallback((input: string) => update({ input }), [update]),
    setDirection: useCallback(
      (direction: string) => update({ direction }),
      [update],
    ),
    setOption: useCallback(
      <K extends keyof T>(id: K, value: T[K]) =>
        setChosen((current) => {
          const base = current ?? fromLink;
          return { ...base, options: { ...base.options, [id]: value } };
        }),
      [fromLink],
    ),
  };
}
