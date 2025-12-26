export const THEME_KEY = "tools-theme";

/** What the user chose. `system` follows the OS and is the default. */
export type ThemePref = "light" | "dark" | "system";
/** What is actually on screen. */
export type Theme = "light" | "dark";

export const THEME_PREFS: readonly ThemePref[] = ["light", "dark", "system"];

/**
 * Applies the theme before the first paint.
 *
 * A blocking inline script in <head>, not an effect: React hydrates after
 * paint, so deciding there would show one palette for a frame and then swap.
 *
 * Unlike an app behind a login, a public tool page is opened once from a
 * search result and never configured, so the OS preference is the default and
 * the toggle only overrides it.
 */
export const THEME_SCRIPT = `
(function () {
  try {
    var pref = localStorage.getItem(${JSON.stringify(THEME_KEY)});
    var dark = pref === "dark" || (pref !== "light" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
    var root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {}
})();
`.trim();

const listeners = new Set<() => void>();

/**
 * Subscribes to preference changes, including ones made in another tab.
 *
 * The toggle reads the preference through `useSyncExternalStore` rather than
 * copying it into state on mount: localStorage is an external store, and
 * mirroring it into React means a render pass whose only job is to correct the
 * previous one.
 */
export function subscribePref(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function readPref(): ThemePref {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage blocked: the visit still gets the system theme.
  }
  return "system";
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Reads what is on screen right now rather than a separate copy of the state. */
export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyPref(pref: ThemePref) {
  const theme = pref === "system" ? systemTheme() : pref;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    if (pref === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    // As above: this visit is still correct, the next one falls back to system.
  }
  for (const listener of listeners) listener();
}

/**
 * Keeps a `system` choice live while the page is open.
 *
 * Returns the unsubscribe function. Only attaches while the preference is
 * `system`; an explicit light or dark must not move when the OS flips at
 * sunset.
 */
export function watchSystem(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
