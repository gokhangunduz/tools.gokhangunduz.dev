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
import {
  restoreValues,
  shareableValues,
  type OptionValue,
  type OptionValues,
  type ToolOption,
} from "../text-tool";

/**
 * The input and options of a tool with its own page, kept in the link the way
 * TextTool keeps them: read from the fragment until the page is touched, then
 * written back to it.
 */
export function useLinkState(options: ToolOption[]) {
  const hash = useSyncExternalStore(subscribeShared, readSharedHash, () => "");
  const shared = useMemo(() => parseShared(hash), [hash]);
  const linked = useMemo(
    () => restoreValues(options, shared?.options),
    [options, shared],
  );
  const [typed, setTyped] = useState<string | null>(null);
  const [chosen, setChosen] = useState<OptionValues | null>(null);
  const input = typed ?? shared?.input ?? "";
  const values = chosen ?? linked;

  useEffect(() => {
    const id = window.setTimeout(
      () => writeShared({ input, options: shareableValues(options, values) }),
      300,
    );
    return () => window.clearTimeout(id);
  }, [input, values, options]);

  const setInput = useCallback(
    (value: string) => {
      setChosen((current) => current ?? values);
      setTyped(value);
    },
    [values],
  );

  const setOption = useCallback(
    (id: string, value: OptionValue) => {
      setChosen((current) => ({ ...(current ?? values), [id]: value }));
    },
    [values],
  );

  return { input, values, setInput, setOption };
}
