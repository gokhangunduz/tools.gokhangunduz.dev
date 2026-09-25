"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The two lists the home page keeps: what was starred, and what was opened.
 *
 * Both are per-browser and neither is worth a backend. They are read through
 * `useSyncExternalStore` so that starring a tool on the page updates the
 * header, the card and the home page at once without a context around the
 * whole app.
 */
const FAVORITES_KEY = "tools-favorites";
const RECENT_KEY = "tools-recent";
const RECENT_LIMIT = 8;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab starring a tool should not leave this one disagreeing.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v) => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function write(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode with storage disabled: the app works, the list just does
    // not survive the tab.
  }
  emit();
}

/**
 * Caches the parsed array per raw string.
 *
 * `useSyncExternalStore` compares snapshots by identity and calls the getter
 * on every render, so returning a fresh array each time is an infinite loop.
 */
const snapshots = new Map<string, { raw: string | null; value: string[] }>();

function getSnapshot(key: string): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value;
  const value = read(key);
  snapshots.set(key, { raw, value });
  return value;
}

const EMPTY: string[] = [];

function useList(key: string): string[] {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot(key),
    () => EMPTY,
  );
}

export function useFavorites() {
  const favorites = useList(FAVORITES_KEY);

  const toggle = useCallback((id: string) => {
    const current = read(FAVORITES_KEY);
    write(
      FAVORITES_KEY,
      current.includes(id) ? current.filter((v) => v !== id) : [id, ...current],
    );
  }, []);

  return { favorites, toggle };
}

export function useRecent(): string[] {
  return useList(RECENT_KEY);
}

/** Called when a tool page opens. Most-recent first, deduplicated, capped. */
export function noteVisit(id: string) {
  const current = read(RECENT_KEY).filter((v) => v !== id);
  write(RECENT_KEY, [id, ...current].slice(0, RECENT_LIMIT));
}
