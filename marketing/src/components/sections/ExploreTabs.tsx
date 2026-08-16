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
    <div className="w-full overflow-hidden rounded-[14px] border border-black/[0.05] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      <div className="hide-scrollbar flex items-center gap-1 overflow-x-auto px-4 pt-3 sm:px-5">
        {searchTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition ${
                isActive
                  ? "bg-[#00332b] text-white"
                  : "text-[#6b7280] hover:bg-[#f3f6f4] hover:text-[#00332b]"
              }`}
            >
              <Icon className="h-[15px] w-[15px]" strokeWidth={2.25} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-end sm:gap-3 sm:px-5 sm:pb-4"
      >
        <label className="flex min-w-0 flex-[1.35] flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[#374151]">
            Where do you want to go?
          </span>
          <span className="flex h-[48px] items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5">
            <Search className="h-4 w-4 shrink-0 text-[#9ca3af]" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Search destination or place"
              className="w-full bg-transparent text-[13.5px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
            />
          </span>
        </label>

        <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-[210px]">
          <span className="text-[12px] font-semibold text-[#374151]">
            Check-in - Check-out
          </span>
          <span className="flex h-[48px] items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-[#9ca3af]" />
            <input
              type="text"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              placeholder="Select dates"
              className="w-full bg-transparent text-[13.5px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
            />
          </span>
        </label>

        <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-[200px]">
          <span className="text-[12px] font-semibold text-[#374151]">Travellers</span>
          <span className="flex h-[48px] items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5">
            <Users className="h-4 w-4 shrink-0 text-[#9ca3af]" />
            <span className="flex-1 truncate text-[13.5px] text-[#111827]">
              2 Adults • 0 Children
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" />
          </span>
        </label>

        <button
          type="submit"
          className="inline-flex h-[48px] shrink-0 items-center justify-center rounded-[10px] bg-[#f47920] px-6 text-[14px] font-bold text-white transition hover:bg-[#e06a14] sm:min-w-[168px]"
        >
          Search Packages <span className="ml-1.5">→</span>
        </button>
      </form>
    </div>
  );
}
