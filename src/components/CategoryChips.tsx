"use client";

import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { useEffect, useRef } from "react";

export type Category = { label: string; url: string };

const SCROLL_KEY = "yachtdrop:categoryChipsScrollLeft";

export function CategoryChips({
  categories,
  activeUrl,
  onPick,
}: {
  categories: Category[];
  activeUrl: string;
  onPick: (url: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dx: number) => {
    ref.current?.scrollBy({ left: dx, behavior: "smooth" });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    try {
      const raw = sessionStorage.getItem(SCROLL_KEY);
      const saved = raw ? Number(raw) : 0;
      if (Number.isFinite(saved) && saved > 0) {
        requestAnimationFrame(() => {
          el.scrollLeft = saved;
        });
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        try {
          sessionStorage.setItem(SCROLL_KEY, String(el.scrollLeft));
        } catch {
          // ignore
        }
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 select-none">
      <div className="relative h-6 mb-1">
        <div
          onClick={() => scrollBy(-260)}
          className="absolute left-0 top-0 h-full w-1/2"
          aria-hidden
        />
        <div
          onClick={() => scrollBy(260)}
          className="absolute right-0 top-0 h-full w-1/2"
          aria-hidden
        />
      </div>

      <div
        ref={ref}
        className="flex gap-2 overflow-x-auto pb-2 pt-1 px-1 [-webkit-overflow-scrolling:touch]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((c) => (
          <Button
            key={c.url}
            variant={activeUrl === c.url ? "default" : "secondary"}
            size="sm"
            onClick={() => onPick(c.url)}
            className={clsx(
              "rounded-full shrink-0 px-4 font-semibold tracking-tight",
              activeUrl === c.url
                ? "bg-black text-white shadow-sm"
                : "bg-muted text-foreground"
            )}
          >
            {c.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
