export type ThemeMode = "light" | "dark" | "system";

const KEY = "yachtdrop:theme";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(KEY);
  return (v === "light" || v === "dark" || v === "system") ? v : "system";
}

export function storeTheme(v: ThemeMode) {
  window.localStorage.setItem(KEY, v);
}

export function getSystemPrefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

export function applyTheme(v: ThemeMode) {
  const root = document.documentElement;
  const dark = v === "dark" || (v === "system" && getSystemPrefersDark());
  root.classList.toggle("dark", dark);
}
