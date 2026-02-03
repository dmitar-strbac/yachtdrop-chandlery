"use client";

import { useEffect, useState } from "react";
import { Anchor } from "lucide-react"

export type DockProfile = {
  marina: string;
  berth: string;
  departureISO: string;
};

export default function DockFab({
  dock,
  onOpen,
}: {
  dock: DockProfile | null;
  onOpen: () => void;
}) {
  const [showHint, setShowHint] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[40] bottom-[calc(env(safe-area-inset-bottom)+62px)] w-full max-w-md pointer-events-none">
        <div className="relative h-0 pointer-events-auto">
            <div className="absolute right-4 -top-16">

            <button
                onClick={onOpen}
                className="h-14 w-14 rounded-full bg-black text-white shadow-lg grid place-items-center"
                aria-label="Set dock"
            >
                <Anchor className="h-6 w-6 text-white" />
            </button>
            </div>
        </div>
    </div>
);
}
