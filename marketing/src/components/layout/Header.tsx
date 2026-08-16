"use client";

import { useState } from "react";
import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { megaIndia, megaHoneymoon, megaFamily } from "@/lib/data";
import { Search, ChevronDown, X, Cloud } from "lucide-react";

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

  return (
    <header className="relative z-50 bg-white">
      {/* Announcement — exact mock */}
      <div className="relative flex h-[32px] items-center justify-center bg-[#0f3d2e] text-[11px] font-medium text-white">
        <span className="inline-flex items-center gap-2">
          <Cloud className="h-3.5 w-3.5 opacity-90" strokeWidth={2} />
          <b className="font-bold tracking-[0.04em]">MONSOON SALE</b>
          <span className="text-white/85">
            Save up to <b className="font-bold text-white">40%</b> on your trip
          </span>
        </span>
        <span className="absolute right-10 hidden items-center gap-1.5 text-[11px] font-medium sm:inline-flex md:right-12">
          <span aria-hidden className="opacity-90">
            ◷
          </span>
          6 Days : 1 Hr : 47 Min
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          className="absolute right-3 hidden text-white/70 hover:text-white sm:block"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="th-container relative flex h-[64px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-5 lg:gap-7">
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
              className="h-[40px] w-auto object-contain sm:h-[44px]"
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
                      ? "text-[#f27c22]"
                      : "text-[#1a2420] hover:text-[#f27c22]"
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
                className="px-2.5 py-5 text-[13px] font-semibold text-[#1a2420] hover:text-[#f27c22]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#packages"
              className="inline-flex items-center gap-1.5 px-2.5 py-5 text-[13px] font-semibold text-[#1a2420] hover:text-[#f27c22]"
            >
              Offers
              <span className="rounded-full bg-[#f27c22] px-[6px] py-[2px] text-[8px] font-bold uppercase leading-none text-white">
                NEW
              </span>
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            aria-label="Search"
            className="hidden h-8 w-8 items-center justify-center rounded-md border border-[#e5e5e5] text-[#303030] sm:flex"
          >
            <Search className="h-4 w-4" />
          </button>
          <span className="hidden items-center gap-1.5 px-1.5 py-1 text-[12px] font-semibold text-[#4a5a52] sm:inline-flex">
            <span className="text-base leading-none">🇮🇳</span>
            INR ₹
            <ChevronDown className="h-3 w-3" />
          </span>
          <a
            href={siteConfig.crmLogin}
            className="rounded-md border border-[#f27c22] px-5 py-[7px] text-[12px] font-semibold text-[#e07000] transition hover:bg-[#fff6ec]"
          >
            Login
          </a>

          <details className="relative xl:hidden">
            <summary className="list-none cursor-pointer rounded border border-[#e2ebe4] px-2.5 py-1.5 text-xs font-semibold [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#e2ebe4] bg-white p-2 shadow-xl">
              {tabs.map((t) => (
                <a
                  key={t.id}
                  href="#packages"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/[0.04]"
                >
                  {t.label}
                </a>
              ))}
              {simpleLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/[0.04]"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#packages"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/[0.04]"
              >
                Offers
              </a>
              <a
                href={siteConfig.crmLogin}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/[0.04]"
              >
                Login
              </a>
            </div>
          </details>
        </div>

        {open && (
          <div
            className="absolute left-0 right-0 top-full z-50 hidden border-b border-[#e2ebe4] bg-white shadow-lg xl:block"
            onMouseEnter={() => setOpen(open)}
            onMouseLeave={() => setOpen(null)}
          >
            <div className="th-container grid grid-cols-4 gap-8 py-8">
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
                            className="text-[13px] text-[#6b7a72] hover:text-[#f27c22]"
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
