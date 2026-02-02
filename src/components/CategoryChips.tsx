"use client";

import { Button } from "@/components/ui/button";
import clsx from "clsx";

export type Category = { label: string; url: string };

export function CategoryChips({
  categories,
  activeUrl,
  onPick,
}: {
  categories: Category[];
  activeUrl: string;
  onPick: (url: string) => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4">
      <div className="flex gap-2 overflow-x-auto pb-2 pt-3 [-webkit-overflow-scrolling:touch]">
        {categories.map((c) => (
          <Button
            key={c.url}
            variant={activeUrl === c.url ? "default" : "secondary"}
            size="sm"
            onClick={() => onPick(c.url)}
            className={clsx(
              "rounded-full shrink-0",
              activeUrl === c.url ? "" : "bg-muted"
            )}
          >
            {c.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
