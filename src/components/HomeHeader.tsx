"use client";

import { Input } from "@/components/ui/input";
import Image from "next/image";
import ThemeSwitch from "./ThemeSwitch";
import { saveLocale, t, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function HomeHeader({
  query,
  setQuery,
  locale,
  setLocale,
}: {
  query: string;
  setQuery: (v: string) => void;
  locale: Locale;
  setLocale: (v: Locale) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const setAndSave = (v: Locale) => {
    saveLocale(v);
    setLocale(v);
    setOpen(false);
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-md px-4 py-3 relative">
        <div className="absolute right-4 top-3 flex items-center gap-2" ref={menuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="h-10 w-10 rounded-full border bg-background/70 flex items-center justify-center hover:bg-muted transition"
              aria-label="Language"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <Globe className="h-5 w-5" />
            </button>

            {open ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-32 rounded-2xl border bg-background shadow-lg p-1"
              >
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => setAndSave("en")}
                  className={[
                    "w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition",
                    locale === "en" ? "bg-muted" : "hover:bg-muted/60",
                  ].join(" ")}
                >
                  English {locale === "en" ? "✓" : ""}
                </button>

                <button
                  role="menuitem"
                  type="button"
                  onClick={() => setAndSave("es")}
                  className={[
                    "w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition",
                    locale === "es" ? "bg-muted" : "hover:bg-muted/60",
                  ].join(" ")}
                >
                  Español {locale === "es" ? "✓" : ""}
                </button>
              </div>
            ) : null}
          </div>

          <ThemeSwitch />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0">
            <Image src="/logo.png" alt="Yachtdrop logo" fill className="object-contain" priority />
          </div>

          <div className="leading-tight">
            <div className="text-lg font-light tracking-wide">yachtdrop</div>
            <div className="text-xs text-muted-foreground">{t(locale, "tagline")}</div>
          </div>
        </div>

        <div className="mt-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(locale, "searchPlaceholder")}
            className="h-11 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
