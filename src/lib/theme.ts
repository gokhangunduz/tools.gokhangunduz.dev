export const THEME_KEY = "tools-theme";

export type ThemePref = "light" | "dark" | "system";

export type Theme = "light" | "dark";

export const THEME_PREFS: readonly ThemePref[] = ["light", "dark", "system"];

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
  } catch {}
  return "system";
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

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
  } catch {}
  for (const listener of listeners) listener();
}

export function watchSystem(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
