"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { getSavedLocale, pluralSuffixEn, t } from "@/lib/i18n";

export function CartBar({ onOpen }: { onOpen: () => void }) {
  const total = useCartStore((s) =>
    Object.values(s.items).reduce((sum, i) => sum + i.qty, 0)
  );

  const locale = getSavedLocale("en");

  const [mounted, setMounted] = useState(false);
  const [pulse, setPulse] = useState(false);

  const prevTotalRef = useRef(0);
  const pulseTimerRef = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const prev = prevTotalRef.current;

    if (total > prev) {
      setPulse(true);
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = window.setTimeout(() => setPulse(false), 220);
    }

    prevTotalRef.current = total;
  }, [total, mounted]);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
    };
  }, []);

  if (!mounted) return null;
  if (total <= 0) return null;

  const suffix = locale === "en" ? pluralSuffixEn(total) : total === 1 ? "" : "s";

  return (
    <div className="fixed bottom-15 left-0 right-0 z-40 pointer-events-none">
      <div className="mx-auto max-w-md px-4 pb-4 pointer-events-auto">
        <div
          className={clsx(
            "rounded-3xl border bg-background/95 backdrop-blur shadow-lg",
            "transform transition-all duration-200 ease-out will-change-transform",
            "translate-y-0 opacity-100",
            pulse ? "scale-[1.015]" : "scale-100"
          )}
        >
          <div className="flex items-center justify-between p-4">
            <div className="text-sm">
              <div className="font-semibold">
                {t(locale, "cartBarTitle", { count: total, s: suffix })}
              </div>
              <div className="text-xs text-muted-foreground">
                {t(locale, "cartBarSubtitle")}
              </div>
            </div>

            <Button
              onClick={onOpen}
              className="rounded-2xl bg-accent text-accent-foreground font-semibold tracking-tight"
            >
              {t(locale, "viewCart")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
