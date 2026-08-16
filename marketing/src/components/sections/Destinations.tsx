"use client";

import { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mountain,
  Umbrella,
  TreePalm,
  Castle,
  Tent,
  Trees,
} from "lucide-react";
import { exploreDestinations } from "@/lib/data";

/** Exact mock order + trending flags */
const MOCK_ORDER = [
  { key: "Himachal", label: "Himachal Pradesh", trending: false, icon: Mountain },
  { key: "Uttarakhand", label: "Uttarakhand", trending: false, icon: Tent },
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
    scrollerRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  const cards = MOCK_ORDER.map((item) => {
    const data = exploreDestinations.find((d) => d.name === item.key);
    return { ...item, image: data?.image || "" };
  }).filter((c) => c.image);

  return (
    <section id="destinations" className="bg-white pb-2 pt-10 sm:pt-12">
      <div className="mx-auto mb-6 flex w-full max-w-[1200px] items-end justify-between gap-4 px-4 sm:px-6">
        <div>
          <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-[#111827] sm:text-[32px]">
            Explore Popular Destinations
          </h2>
          <p className="mt-1.5 text-[14px] text-[#6b7280]">
            Handpicked places for your next adventure
          </p>
        </div>
        <a
          href="#packages"
          className="hidden shrink-0 items-center rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#111827] transition hover:border-[#f47920] hover:text-[#f47920] sm:inline-flex"
        >
          View all destinations <span className="ml-1.5">›</span>
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
          className="hide-scrollbar mx-auto flex w-full max-w-[1200px] gap-[14px] overflow-x-auto scroll-smooth px-4 pb-2 sm:px-6"
        >
          {cards.map((d) => {
            const Icon = d.icon;
            const href =
              ["Himachal", "Spiti", "Andaman", "Sikkim", "Uttarakhand"].includes(d.key)
                ? "#packages"
                : `#${d.key.toLowerCase()}`;

            return (
              <a
                key={d.key}
                href={href}
                className="group relative h-[300px] w-[168px] shrink-0 overflow-hidden rounded-[16px] bg-[#d1d5db] sm:h-[318px] sm:w-[178px]"
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
                  <span className="absolute right-2.5 top-2.5 rounded-[4px] bg-[#f47920] px-[7px] py-[3px] text-[9px] font-bold uppercase tracking-wide text-white">
                    Trending
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3.5 text-white">
                  <Icon className="mb-1.5 h-[18px] w-[18px]" strokeWidth={1.75} />
                  <p className="text-[15px] font-bold leading-tight">{d.label}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
