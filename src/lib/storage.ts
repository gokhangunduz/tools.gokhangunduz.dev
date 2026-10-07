"use client";

import { useCallback, useSyncExternalStore } from "react";

const FAVORITES_KEY = "tools-favorites";
const RECENT_KEY = "tools-recent";
const RECENT_LIMIT = 8;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

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
  } catch {}
  emit();
}

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

export function noteVisit(id: string) {
  const current = read(RECENT_KEY).filter((v) => v !== id);
  write(RECENT_KEY, [id, ...current].slice(0, RECENT_LIMIT));
}

const VALUES_PREFIX = "tools-values:";

export function readToolValues(toolId: string): string | null {
  try {
    return localStorage.getItem(VALUES_PREFIX + toolId);
  } catch {
    return null;
  }
}

export function parseToolValues(
  raw: string | null,
): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

export function writeToolValues(
  toolId: string,
  values: Record<string, unknown>,
) {
  try {
    if (Object.keys(values).length === 0) {
      localStorage.removeItem(VALUES_PREFIX + toolId);
    } else {
      localStorage.setItem(VALUES_PREFIX + toolId, JSON.stringify(values));
    }
  } catch {}
}
