"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Compass } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { navLinks } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-[var(--ink)]/90 backdrop-blur-xl shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--coral)] shadow-lg shadow-[var(--coral)]/30">
            <Compass className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            India Holiday Destination
          </span>
        </Link>

        <nav className="hidden items-center gap-7 xl:flex">
          {navLinks.map((link) => (
            <a
              key={link.href + link.label}
              href={link.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={siteConfig.crmLogin}
            className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            CRM Login
          </a>
          <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="btn-primary !py-2.5 !text-sm">
            Plan My Trip
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white lg:hidden"
          aria-label="Menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-b border-white/10 bg-[var(--ink)] lg:hidden">
          <nav className="flex flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
              <a href={siteConfig.crmLogin} className="btn-secondary text-center">
                CRM Login
              </a>
              <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="btn-primary text-center">
                Plan My Trip
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
