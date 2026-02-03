"use client";

import { useEffect, useState } from "react";
import { Anchor } from "lucide-react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const hasDock = !!dock?.marina;

  return (
    <div
      className="
        fixed z-[40]
        left-1/2 -translate-x-1/2
        bottom-[calc(env(safe-area-inset-bottom)+130px)]
        w-full max-w-md
        pointer-events-none
      "
    >
      <div className="relative pointer-events-auto">
        <button
          onClick={onOpen}
          aria-label="Set dock"
          className="
            absolute right-4
            h-14 w-14 rounded-full
            bg-black text-white
            grid place-items-center
            shadow-[0_18px_45px_rgba(0,0,0,0.28)]
            transition
            hover:scale-[1.03]
            active:scale-[0.97]
          "
          style={{
            animation: "dock-fab-float 3.8s ease-in-out infinite",
          }}
        >
          <Anchor className="h-6 w-6" />

          {hasDock ? (
            <span
              className="
                absolute -right-0.5 -top-0.5
                h-3.5 w-3.5 rounded-full
                bg-emerald-500
                ring-2 ring-background
              "
            />
          ) : null}
        </button>

        <style jsx>{`
          @keyframes dock-fab-float {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-6px);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
