"use client";

import { useState } from "react";
import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { megaIndia, megaHoneymoon, megaFamily } from "@/lib/data";
import { Search, ChevronDown, Cloud, Menu, X, Clock } from "lucide-react";

const tabs = [
  { id: "india", label: "India Packages", columns: megaIndia },
  { id: "domestic", label: "Domestic Packages", columns: megaHoneymoon },
  { id: "activities", label: "Activities", columns: megaFamily },
] as const;

const simpleLinks = [
  { label: "Treks", href: siteConfig.treksUrl },
  { label: "Mice", href: "#packages" },
  { label: "Blog", href: "#packages" },
] as const;

export function Header() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative z-50 bg-white">
      {/* Announcement — mobile mock: sale left + timer pill right */}
      <div className="flex h-[34px] items-center justify-between gap-2 bg-[#1a2e28] px-3 text-[10px] font-medium text-white sm:h-[32px] sm:justify-center sm:px-4 sm:text-[11px]">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
          <Cloud className="h-3.5 w-3.5 shrink-0 text-[#7dcea0]" strokeWidth={2} />
          <span className="truncate">
            <b className="font-bold">MONSOON SALE</b>
            <span className="text-white/80"> | Save up to 40% on your trip</span>
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 text-[10px] sm:absolute sm:right-10 sm:bg-transparent sm:px-0 md:right-12">
          <Clock className="h-3 w-3 opacity-90" />
          6 Days : 1 Hr : 47 Min
        </span>
      </div>

      <div className="relative mx-auto flex h-[56px] w-full max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-[64px] sm:px-6">
        <a
          href={siteConfig.url + "/"}
          className="flex shrink-0 items-center"
          aria-label={siteConfig.name}
        >
          <Image
            src="/logo.png"
            alt={siteConfig.name}
            width={210}
            height={71}
            className="h-[36px] w-auto object-contain sm:h-[44px]"
            priority
          />
        </a>

        <nav
          className="hidden items-center xl:flex"
          onMouseLeave={() => setOpen(null)}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className="relative"
              onMouseEnter={() => setOpen(tab.id)}
            >
              <button
                type="button"
                className={`px-2.5 py-5 text-[13px] font-semibold transition ${
                  open === tab.id
                    ? "text-[#f46c14]"
                    : "text-[#1a2420] hover:text-[#f46c14]"
                }`}
              >
                {tab.label}
              </button>
            </div>
          ))}
          {simpleLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-2.5 py-5 text-[13px] font-semibold text-[#1a2420] hover:text-[#f46c14]"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#packages"
            className="inline-flex items-center gap-1.5 px-2.5 py-5 text-[13px] font-semibold text-[#1a2420] hover:text-[#f46c14]"
          >
            Offers
            <span className="rounded-full bg-[#f46c14] px-[6px] py-[2px] text-[8px] font-bold uppercase leading-none text-white">
              NEW
            </span>
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="Search"
            className="hidden h-8 w-8 items-center justify-center rounded-md border border-[#e5e5e5] text-[#303030] lg:flex"
          >
            <Search className="h-4 w-4" />
          </button>
          <span className="hidden items-center gap-1.5 px-1.5 py-1 text-[12px] font-semibold text-[#4a5a52] lg:inline-flex">
            <span className="text-base leading-none">🇮🇳</span>
            INR ₹
            <ChevronDown className="h-3 w-3" />
          </span>
          <a
            href={siteConfig.crmLogin}
            className="rounded-lg border border-[#f46c14] px-3.5 py-[6px] text-[12px] font-semibold text-[#f46c14] transition hover:bg-[#fff6ec] sm:px-5 sm:py-[7px]"
          >
            Login
          </a>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center text-[#003322] xl:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" strokeWidth={2.2} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="absolute left-0 right-0 top-full z-50 border-b border-[#e2ebe4] bg-white p-3 shadow-xl xl:hidden">
            {tabs.map((t) => (
              <a
                key={t.id}
                href="#packages"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/[0.04]"
                onClick={() => setMobileOpen(false)}
              >
                {t.label}
              </a>
            ))}
            {simpleLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/[0.04]"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#packages"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/[0.04]"
              onClick={() => setMobileOpen(false)}
            >
              Offers
            </a>
          </div>
        )}

        {open && (
          <div
            className="absolute left-0 right-0 top-full z-50 hidden border-b border-[#e2ebe4] bg-white shadow-lg xl:block"
            onMouseEnter={() => setOpen(open)}
            onMouseLeave={() => setOpen(null)}
          >
            <div className="mx-auto grid max-w-[1200px] grid-cols-4 gap-8 px-6 py-8">
              {tabs
                .find((t) => t.id === open)!
                .columns.map((col) => (
                  <div key={col.title}>
                    <h4 className="mb-3 text-[13px] font-bold text-[#1a2420]">
                      {col.title}
                    </h4>
                    <ul className="space-y-2">
                      {col.links.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            className="text-[13px] text-[#6b7a72] hover:text-[#f46c14]"
                            onClick={() => setOpen(null)}
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
