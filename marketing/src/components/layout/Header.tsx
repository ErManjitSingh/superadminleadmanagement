"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { megaIndia, megaHoneymoon, megaFamily } from "@/lib/data";

const tabs = [
  { id: "india", label: "India Packages", columns: megaIndia },
  { id: "honeymoon", label: "Honeymoon", columns: megaHoneymoon },
  { id: "family", label: "Family", columns: megaFamily },
] as const;

export function Header() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--th-border)] bg-white">
      <div className="th-container relative flex h-[64px] items-center justify-between gap-4">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-[17px] font-extrabold tracking-tight">
              <span className="text-[var(--th-orange)]">india</span>
              <span className="text-[var(--th-ink)]">holiday</span>
            </span>
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
            <a href="#destinations" className="px-3 py-5 text-[13px] font-semibold text-[var(--th-ink)] hover:text-[var(--th-orange)]">
              Destinations
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-1 rounded border border-[var(--th-border)] px-2 py-1 text-xs font-semibold text-[var(--th-muted)] sm:inline-flex">
            INR ₹
          </span>
          <a
            href={siteConfig.crmLogin}
            className="text-[13px] font-semibold text-[var(--th-ink)] hover:text-[var(--th-orange)]"
          >
            login
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
