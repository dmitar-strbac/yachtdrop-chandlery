"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, storeTheme, type ThemeMode } from "@/lib/theme";

export default function ThemeSwitch() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);

  useEffect(() => {
    const initial = getStoredTheme();
    setMode(initial);
    applyTheme(initial);

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  const toggle = () => {
    const next: ThemeMode = isDark ? "light" : "dark";
    setMode(next);
    storeTheme(next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={[
        "relative h-6 w-10 rounded-full border transition",
        "bg-muted/60 hover:bg-muted",
        "focus:outline-none focus:ring-2 focus:ring-ring",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full shadow transition-all",
          "bg-background",
          isDark ? "left-[calc(100%-1.25rem-2px)]" : "left-[2px]",
        ].join(" ")}
      />
    </button>
  );
}
