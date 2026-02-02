"use client";

import { Input } from "@/components/ui/input";

export function HomeHeader({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (v: string) => void;
}) {
  return (
    <div className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold tracking-tight">Yachtdrop</div>
            <div className="text-xs text-muted-foreground">
              Quick marine supplies — app-style
            </div>
          </div>
        </div>

        <div className="mt-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parts, brands, epoxy…"
            className="h-11 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
