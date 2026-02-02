"use client";

import { Input } from "@/components/ui/input";
import Image from "next/image";

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
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0">
            <Image
              src="/logo.png"
              alt="Yachtdrop logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="leading-tight">
            <div className="text-lg font-light tracking-wide">
              yachtdrop
            </div>
            <div className="text-xs text-muted-foreground">
              Quick marine supplies
            </div>
          </div>
        </div>

        <div className="mt-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parts, brands, categories…"
            className="h-11 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
