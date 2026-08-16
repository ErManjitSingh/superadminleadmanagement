"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { megaIndia, megaHoneymoon, megaFamily } from "@/lib/data";
import { Search, ChevronDown, X } from "lucide-react";

const tabs = [
  { id: "india", label: "India Packages", columns: megaIndia },
  { id: "domestic", label: "Domestic Packages", columns: megaHoneymoon },
  { id: "activities", label: "Activities", columns: megaFamily },
] as const;

export function Header() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <header className="relative z-50 bg-white">
      <div className="relative flex h-[31px] items-center justify-center bg-[#ff6105] text-[11px] font-medium text-white">
        <span>⛺ <b>MONSOON SALE</b>&nbsp; ☁️ &nbsp; Save up to <b>40%</b> on your trip</span>
        <span className="absolute right-[78px] hidden rounded-full bg-black/20 px-3 py-1 text-[10px] sm:block">
          ◷ 6 Days : 1 Hr : 47 Min
        </span>
        <X className="absolute right-12 hidden h-3.5 w-3.5 sm:block" />
      </div>
      <div className="th-container relative flex h-[59px] items-center justify-between gap-4">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="flex shrink-0 items-center" aria-label={siteConfig.name}>
            <Image
              src="/logo.png"
              alt={siteConfig.name}
              width={210}
              height={71}
              className="h-10 w-auto object-contain sm:h-11"
              priority
            />
          </Link>

          <nav className="hidden items-center lg:flex" onMouseLeave={() => setOpen(null)}>
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className="relative"
                onMouseEnter={() => setOpen(tab.id)}
              >
                <button
                  type="button"
                  className={`px-3 py-5 text-[13px] font-semibold transition ${
                    open === tab.id ? "text-[var(--th-orange)]" : "text-[var(--th-ink)] hover:text-[var(--th-orange)]"
                  }`}
                >
                  {tab.label}
                </button>
              </div>
            ))}
            <a href="#packages" className="px-3 py-5 text-[13px] font-semibold text-[var(--th-ink)] hover:text-[var(--th-orange)]">
              Mice
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button aria-label="Search" className="hidden h-8 w-8 items-center justify-center rounded-lg border border-[#e8e8e8] text-[#303030] sm:flex">
            <Search className="h-4 w-4" />
          </button>
          <span className="hidden items-center gap-2 px-2 py-1 text-xs font-semibold text-[var(--th-muted)] sm:inline-flex">
            <span className="text-lg">🇮🇳</span> INR ₹ <ChevronDown className="h-3 w-3" />
          </span>
          <a
            href={siteConfig.crmLogin}
            className="rounded-lg border border-[#ff985e] px-5 py-2 text-[12px] font-semibold text-[#d96220] hover:bg-orange-50"
          >
            Login
          </a>
          <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="th-btn !py-1.5 !text-[13px] sm:hidden">
            Enquire
          </a>

          <details className="relative lg:hidden">
            <summary className="list-none cursor-pointer rounded border border-[var(--th-border)] px-2.5 py-1.5 text-xs font-semibold [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--th-border)] bg-white p-2 shadow-xl">
              {tabs.map((t) => (
                <a key={t.id} href="#packages" className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/[0.04]">
                  {t.label}
                </a>
              ))}
              <a href={siteConfig.crmLogin} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/[0.04]">
                CRM Login
              </a>
            </div>
          </details>
        </div>

        {/* Mega menu panel */}
        {open && (
          <div
            className="absolute left-0 right-0 top-full z-50 hidden border-b border-[var(--th-border)] bg-white shadow-lg lg:block"
            onMouseEnter={() => setOpen(open)}
            onMouseLeave={() => setOpen(null)}
          >
            <div className="th-container grid grid-cols-4 gap-8 py-8">
              {tabs
                .find((t) => t.id === open)!
                .columns.map((col) => (
                  <div key={col.title}>
                    <h4 className="mb-3 text-[13px] font-bold text-[var(--th-ink)]">{col.title}</h4>
                    <ul className="space-y-2">
                      {col.links.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            className="text-[13px] text-[var(--th-muted)] hover:text-[var(--th-orange)]"
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
