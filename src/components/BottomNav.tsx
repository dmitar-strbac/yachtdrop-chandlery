"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/", Icon: Home },
  { href: "/orders", Icon: ShoppingBag },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t bg-background/95 backdrop-blur",
        "pb-[env(safe-area-inset-bottom)]"
      )}
      aria-label="Bottom navigation"
    >
      <div className="mx-auto max-w-md px-4">
        <div className="h-16 flex items-center justify-around">
          {NAV.map(({ href, Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname?.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1",
                  "w-full h-12 rounded-2xl transition",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className={clsx("h-5 w-5", active && "scale-105")} />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
