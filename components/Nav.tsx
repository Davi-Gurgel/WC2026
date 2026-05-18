"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "OVERVIEW" },
  { href: "/groups", label: "GROUPS" },
  { href: "/bracket", label: "BRACKET" },
  { href: "/matches", label: "MATCHES" },
  { href: "/stats", label: "STATS" },
  { href: "/teams", label: "TEAMS" },
];

const GROTESK: React.CSSProperties = {
  fontFamily: "var(--font-space-grotesk)",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.18em",
};

const ARCHIVO: React.CSSProperties = {
  fontFamily: "var(--font-archivo-black)",
  fontSize: "16px",
  letterSpacing: "0.02em",
};

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50" style={{ background: "#0d0d10" }}>
      <div className="flex h-12 items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white"
          style={{ ...ARCHIVO, color: "#fff" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 22, height: 22, background: "#D52B1E" }}
          >
            <svg viewBox="0 0 24 24" width={12} height={12} aria-hidden="true">
              <path
                fill="#fff"
                d="M12 .9l2.9 8.5h8.9l-7.2 5.3 2.8 8.5L12 17.9l-7.4 5.3 2.8-8.5L.2 9.4h8.9z"
              />
            </svg>
          </div>
          WORLD CUP 2026 SIMULATOR
        </Link>

        <button
          type="button"
          aria-label="Toggle navigation"
          className="text-white/60 transition-colors hover:text-white lg:hidden"
          onClick={() => setOpen((c) => !c)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <div
          className={cn(
            "absolute inset-x-0 top-12 flex flex-col px-6 py-4 lg:static lg:flex lg:flex-row lg:items-center lg:gap-[22px] lg:p-0",
            open ? "flex" : "hidden"
          )}
          style={{ background: open ? "#0d0d10" : undefined }}
        >
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-2 uppercase transition-colors lg:py-0"
                style={{
                  ...GROTESK,
                  color: active ? "#D52B1E" : "rgba(255,255,255,0.6)",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
