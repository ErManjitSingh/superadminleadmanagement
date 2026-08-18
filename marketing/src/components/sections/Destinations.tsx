"use client";

import { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Mountain,
  Umbrella,
  TreePalm,
  Castle,
  Tent,
  Trees,
} from "lucide-react";
import { exploreDestinations } from "@/lib/data";

const MOCK_ORDER = [
  { key: "Himachal", label: "Himachal Pradesh", trending: true, icon: Mountain },
  { key: "Uttarakhand", label: "Uttarakhand", trending: true, icon: Tent },
  { key: "Kerala", label: "Kerala", trending: true, icon: TreePalm },
  { key: "Ladakh", label: "Ladakh", trending: true, icon: Mountain },
  { key: "Rajasthan", label: "Rajasthan", trending: false, icon: Castle },
  { key: "Goa", label: "Goa", trending: true, icon: Umbrella },
  { key: "Andaman", label: "Andaman", trending: false, icon: Umbrella },
  { key: "Sikkim", label: "Sikkim", trending: false, icon: Trees },
  { key: "Spiti", label: "Spiti Valley", trending: true, icon: Mountain },
] as const;

export function Destinations() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  const cards = MOCK_ORDER.map((item) => {
    const data = exploreDestinations.find((d) => d.name === item.key);
    return { ...item, image: data?.image || "" };
  }).filter((c) => c.image);

  return (
    <section id="destinations" className="bg-white pb-2 pt-8 sm:pt-12">
      <div className="mx-auto mb-4 flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 sm:mb-6 sm:items-end sm:px-6">
        <div>
          <h2 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-[#003322] sm:text-[32px] sm:text-[#111827]">
            Explore Popular Destinations
          </h2>
          <p className="mt-1 hidden text-[14px] text-[#6b7280] sm:block">
            Handpicked places for your next adventure
          </p>
        </div>
        <a
          href="#packages"
          className="shrink-0 text-[13px] font-semibold text-[#003322] sm:inline-flex sm:items-center sm:rounded-lg sm:border sm:border-[#e5e7eb] sm:bg-white sm:px-4 sm:py-2.5 sm:text-[#111827] sm:hover:border-[#f46c14] sm:hover:text-[#f46c14]"
        >
          View all <span className="ml-0.5">›</span>
        </a>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollBy(-1)}
          className="absolute left-2 top-[46%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111827] shadow-md sm:flex lg:left-4"
        >
          <ChevronLeft className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollBy(1)}
          className="absolute right-2 top-[46%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111827] shadow-md sm:flex lg:right-4"
        >
          <ChevronRight className="h-[18px] w-[18px]" />
        </button>

        <div
          ref={scrollerRef}
          className="hide-scrollbar mx-auto flex w-full max-w-[1200px] gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:gap-[14px] sm:px-6"
        >
          {cards.map((d) => {
            const href =
              d.key === "Himachal" || d.key === "Spiti"
                ? "#himachal"
                : ["Andaman", "Sikkim", "Uttarakhand"].includes(d.key)
                ? "#packages"
                : `#${d.key.toLowerCase()}`;

            return (
              <a
                key={d.key}
                href={href}
                className="group relative h-[220px] w-[148px] shrink-0 overflow-hidden rounded-[14px] bg-[#d1d5db] sm:h-[318px] sm:w-[178px] sm:rounded-[16px]"
              >
                <img
                  src={d.image}
                  alt={d.label}
                  width={360}
                  height={640}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.78) 100%)",
                  }}
                />
                {d.trending && (
                  <span className="absolute right-2 top-2 rounded-[4px] bg-[#f46c14] px-[6px] py-[2px] text-[8px] font-bold uppercase tracking-wide text-white sm:right-2.5 sm:top-2.5 sm:px-[7px] sm:py-[3px] sm:text-[9px]">
                    Trending
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-3 pb-3 text-white">
                  <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                  <p className="text-[13px] font-bold leading-tight sm:text-[15px]">
                    {d.label}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
