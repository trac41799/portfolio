"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { profile } from "@/lib/data";

const nav = [
  { href: "/", label: "Index" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/ask", label: "Ask" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        scrolled
          ? "border-line bg-bg/80 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Home">
          <span className="grid h-7 w-7 place-items-center rounded-[7px] border border-line-strong font-mono text-[11px] font-medium text-ink transition-colors group-hover:border-accent group-hover:text-accent">
            NT
          </span>
          <span className="hidden font-mono text-xs tracking-tight text-muted sm:inline">
            nguyen dang trac
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {active && (
                  <span className="absolute left-3 top-1/2 h-1 w-1 -translate-x-3 -translate-y-1/2 rounded-full bg-accent" />
                )}
                {item.label}
              </Link>
            );
          })}
          <a
            href={profile.links.cv}
            className="ml-2 hidden rounded-md border border-line-strong px-3 py-1.5 font-mono text-xs text-ink transition-colors hover:border-accent hover:text-accent sm:inline-block"
          >
            CV ↓
          </a>
        </div>
      </nav>
    </header>
  );
}
