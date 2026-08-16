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
  { id: "packages", label: "Packages", icon: Package, mobile: true },
  { id: "destinations", label: "Destinations", icon: MapPin, mobile: true },
  { id: "activities", label: "Activities", icon: Compass, mobile: true },
  { id: "treks", label: "Treks", icon: Mountain, mobile: true },
  { id: "hotels", label: "Hotels", icon: Hotel, mobile: false },
] as const;

export function ExploreTabs() {
  const [active, setActive] = useState<(typeof searchTabs)[number]["id"]>("packages");
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (active === "treks") {
      window.location.href = siteConfig.treksUrl;
      return;
    }
    document
      .querySelector(active === "destinations" ? "#destinations" : "#packages")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full overflow-hidden rounded-[16px] border border-black/[0.05] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.14)] sm:rounded-[14px]">
      <div className="hide-scrollbar flex items-center gap-1 overflow-x-auto px-3 pt-3 sm:px-5">
        {searchTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold transition sm:gap-2 sm:px-3.5 sm:text-[13px] ${
                !tab.mobile ? "hidden sm:inline-flex" : ""
              } ${
                isActive
                  ? "bg-[#003322] text-white"
                  : "text-[#6b7280] hover:bg-[#f3f6f4] hover:text-[#003322]"
              }`}
            >
              <Icon className="h-[14px] w-[14px] sm:h-[15px] sm:w-[15px]" strokeWidth={2.25} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-end sm:gap-3 sm:px-5 sm:pb-4 sm:pt-3.5">
        {/* Destination — full width always */}
        <label className="flex min-w-0 flex-[1.35] flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[#374151]">
            Where do you want to go?
          </span>
          <span className="flex h-[46px] items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3 sm:h-[48px] sm:px-3.5">
            <Search className="h-4 w-4 shrink-0 text-[#9ca3af]" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Search destination or place"
              className="w-full bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#9ca3af] sm:text-[13.5px]"
            />
          </span>
        </label>

        {/* Mobile: dates + travellers side by side; Desktop: row */}
        <div className="grid grid-cols-2 gap-2.5 sm:contents">
          <label className="flex min-w-0 flex-col gap-1.5 sm:max-w-[210px] sm:flex-1">
            <span className="text-[11px] font-semibold text-[#374151] sm:text-[12px]">
              Check-in – Check-out
            </span>
            <span className="flex h-[46px] items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-2.5 sm:h-[48px] sm:gap-2.5 sm:px-3.5">
              <CalendarDays className="h-4 w-4 shrink-0 text-[#9ca3af]" />
              <input
                type="text"
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                placeholder="Select dates"
                className="w-full min-w-0 bg-transparent text-[12px] text-[#111827] outline-none placeholder:text-[#9ca3af] sm:text-[13.5px]"
              />
            </span>
          </label>

          <label className="flex min-w-0 flex-col gap-1.5 sm:max-w-[200px] sm:flex-1">
            <span className="text-[11px] font-semibold text-[#374151] sm:text-[12px]">
              Travellers
            </span>
            <span className="flex h-[46px] items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-2.5 sm:h-[48px] sm:gap-2.5 sm:px-3.5">
              <Users className="h-4 w-4 shrink-0 text-[#9ca3af]" />
              <span className="flex-1 truncate text-[12px] text-[#111827] sm:text-[13.5px]">
                2 Adults • 0 Children
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" />
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex h-[48px] w-full shrink-0 items-center justify-center rounded-[12px] bg-[#f46c14] px-6 text-[14px] font-bold text-white transition hover:bg-[#e05f0f] sm:w-auto sm:min-w-[168px] sm:rounded-[10px]"
        >
          Search Packages <span className="ml-1.5">→</span>
        </button>
      </form>
    </div>
  );
}
