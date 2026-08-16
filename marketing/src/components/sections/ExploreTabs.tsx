"use client";

import { useState } from "react";
import {
  Search,
  CalendarDays,
  Users,
  Package,
  MapPin,
  Compass,
  Mountain,
  Hotel,
  ChevronDown,
} from "lucide-react";
import { siteConfig } from "@/lib/config";

const searchTabs = [
  { id: "packages", label: "Packages", icon: Package },
  { id: "destinations", label: "Destinations", icon: MapPin },
  { id: "activities", label: "Activities", icon: Compass },
  { id: "treks", label: "Treks", icon: Mountain },
  { id: "hotels", label: "Hotels", icon: Hotel },
] as const;

/** Hero search widget — matches India Holiday Destinations homepage mock */
export function ExploreTabs() {
  const [active, setActive] = useState<(typeof searchTabs)[number]["id"]>("packages");
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("");
  const [travellers] = useState("2 Adults • 0 Children");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (active === "treks") {
      window.location.href = siteConfig.treksUrl;
      return;
    }
    const target =
      active === "destinations"
        ? "#destinations"
        : active === "activities"
          ? "#packages"
          : "#packages";
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative z-20 mx-auto w-full max-w-[1100px] px-4 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
        <div className="hide-scrollbar flex gap-1 overflow-x-auto border-b border-[#eef1ef] px-3 pt-3 sm:px-4">
          {searchTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-t-lg px-3.5 py-2.5 text-[13px] font-semibold transition sm:px-4 ${
                  isActive
                    ? "bg-[var(--th-forest)] text-white"
                    : "text-[#5a6a60] hover:bg-black/[0.03] hover:text-[var(--th-forest)]"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 p-3 sm:flex-row sm:items-end sm:gap-3 sm:p-4"
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7a8a80]">
              Where do you want to go?
            </span>
            <span className="flex items-center gap-2 rounded-xl border border-[#e4ebe6] bg-[#fafcfb] px-3 py-2.5 focus-within:border-[var(--th-forest)] focus-within:ring-1 focus-within:ring-[var(--th-forest)]/20">
              <Search className="h-4 w-4 shrink-0 text-[#8a9a90]" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Search destination or place"
                className="w-full bg-transparent text-[13px] font-medium text-[var(--th-ink)] outline-none placeholder:text-[#9aa8a0]"
              />
            </span>
          </label>

          <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-[220px]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7a8a80]">
              Check-in - Check-out
            </span>
            <span className="flex items-center gap-2 rounded-xl border border-[#e4ebe6] bg-[#fafcfb] px-3 py-2.5 focus-within:border-[var(--th-forest)] focus-within:ring-1 focus-within:ring-[var(--th-forest)]/20">
              <CalendarDays className="h-4 w-4 shrink-0 text-[#8a9a90]" />
              <input
                type="text"
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                placeholder="Select dates"
                className="w-full bg-transparent text-[13px] font-medium text-[var(--th-ink)] outline-none placeholder:text-[#9aa8a0]"
              />
            </span>
          </label>

          <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-[200px]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7a8a80]">
              Travellers
            </span>
            <span className="flex items-center gap-2 rounded-xl border border-[#e4ebe6] bg-[#fafcfb] px-3 py-2.5">
              <Users className="h-4 w-4 shrink-0 text-[#8a9a90]" />
              <span className="flex-1 truncate text-[13px] font-medium text-[var(--th-ink)]">
                {travellers}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#8a9a90]" />
            </span>
          </label>

          <button
            type="submit"
            className="inline-flex h-[46px] shrink-0 items-center justify-center rounded-xl bg-[var(--th-orange)] px-5 text-[14px] font-bold text-white shadow-[0_10px_24px_rgba(248,128,8,0.32)] transition hover:-translate-y-0.5 hover:bg-[var(--th-orange-dark)] sm:mt-0"
          >
            Search Packages <span className="ml-1.5">→</span>
          </button>
        </form>
      </div>
    </div>
  );
}
