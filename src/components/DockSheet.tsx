"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

export type DockProfile = {
  marina: string;
  berth: string;
  departureISO: string;
};

const DOCK_KEY = "yachtdrop:dockProfile";

const MARINAS = [
  "Porto Montenegro",
  "Marina di Porto Cervo",
  "Marina Ibiza",
  "Port Hercule (Monaco)",
  "ACI Marina Split",
  "D-Marin Mandalina",
];

function getInitialDepartureISO() {
  const d = new Date(Date.now() + 4 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16); 
}

export function loadDockProfile(): DockProfile | null {
  try {
    const raw = localStorage.getItem(DOCK_KEY);
    return raw ? (JSON.parse(raw) as DockProfile) : null;
  } catch {
    return null;
  }
}

export function saveDockProfile(p: DockProfile) {
  localStorage.setItem(DOCK_KEY, JSON.stringify(p));
}

export function clearDockProfile() {
  localStorage.removeItem(DOCK_KEY);
}

export default function DockSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: (p: DockProfile | null) => void;
}) {
  const [marina, setMarina] = useState(MARINAS[0]);
  const [berth, setBerth] = useState("A12");
  const [departureISO, setDepartureISO] = useState(getInitialDepartureISO());

  useEffect(() => {
    if (!open) return;
    const existing = loadDockProfile();
    if (existing) {
      setMarina(existing.marina);
      setBerth(existing.berth);
      setDepartureISO(existing.departureISO);
    }
  }, [open]);

  const canSave = marina.trim().length > 0 && berth.trim().length > 0 && departureISO.trim().length > 0;

  function toLocalInputValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  const quickTimes = useMemo(() => {
    const now = new Date();

    const roundToNextHour = (d: Date) => {
        const x = new Date(d);
        x.setMinutes(0, 0, 0);
        return x;
    };

    const in4h = roundToNextHour(new Date(Date.now() + 4 * 60 * 60 * 1000));

    const today18 = new Date(now);
    today18.setHours(18, 0, 0, 0);

    const tomorrow8 = new Date(now);
    tomorrow8.setDate(tomorrow8.getDate() + 1);
    tomorrow8.setHours(8, 0, 0, 0);

    const tomorrow18 = new Date(now);
    tomorrow18.setDate(tomorrow18.getDate() + 1);
    tomorrow18.setHours(18, 0, 0, 0);

    return [
        { label: "In 4h", iso: toLocalInputValue(in4h) },
        { label: "Today 18:00", iso: toLocalInputValue(today18) },
        { label: "Tomorrow 08:00", iso: toLocalInputValue(tomorrow8) },
        { label: "Tomorrow 18:00", iso: toLocalInputValue(tomorrow18) },
    ];
  }, []);

  const [hasDock, setHasDock] = useState(false);
  
  useEffect(() => {
    if (!open) return;

    const existing = loadDockProfile();
    setHasDock(!!existing);

    if (existing) {
        setMarina(existing.marina);
        setBerth(existing.berth);
        setDepartureISO(existing.departureISO);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 px-4 pb-[calc(env(safe-area-inset-bottom)+70px)]">
      <div className="w-full max-w-md rounded-3xl bg-background p-5 shadow-xl max-h-[75vh] overflow-y-auto">
        <div className="text-xl font-extrabold tracking-tight">Where is your yacht right now?</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Set marina, berth and departure.
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">Marina</div>
            <select
              value={marina}
              onChange={(e) => setMarina(e.target.value)}
              className="w-full rounded-2xl border px-3 py-3 bg-background"
            >
              {MARINAS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">Berth</div>
            <input
              value={berth}
              onChange={(e) => setBerth(e.target.value)}
              placeholder="e.g. A12"
              className="w-full rounded-2xl border px-3 py-3 bg-background"
            />
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">Departure</div>
            <input
              type="datetime-local"
              value={departureISO}
              onChange={(e) => setDepartureISO(e.target.value)}
              className="w-full rounded-2xl border px-3 py-3 bg-background"
            />

            <div className="mt-2 flex flex-wrap gap-2">
              {quickTimes.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setDepartureISO(t.iso)}
                  className={clsx(
                    "rounded-full border px-3 py-1 text-xs font-semibold",
                    departureISO === t.iso ? "bg-black text-white border-black" : "bg-background"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
            {hasDock ? (
                <Button
                variant="secondary"
                className="rounded-2xl"
                onClick={() => {
                    clearDockProfile();
                    onSaved?.(null); 
                    onClose();
                }}
                >
                Remove yacht
                </Button>
            ) : null}

          <Button variant="secondary" className="flex-1 rounded-2xl" onClick={onClose}>
            Not now
          </Button>
          <Button
            className="flex-1 rounded-2xl bg-black text-white font-semibold"
            disabled={!canSave}
            onClick={() => {
              const p = { marina: marina.trim(), berth: berth.trim(), departureISO };
              saveDockProfile(p);
              onSaved?.(p);
              onClose();
            }}
          >
            Confirm yacht
          </Button>
        </div>
      </div>
    </div>
  );
}
