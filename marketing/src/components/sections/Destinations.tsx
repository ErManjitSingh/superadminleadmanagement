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

/** Mock card order & labels — exact sequence from design */
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
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  const cards = MOCK_ORDER.map((item) => {
    const data = exploreDestinations.find((d) => d.name === item.key);
    return { ...item, image: data?.image || "" };
  }).filter((c) => c.image);

  return (
    <section id="destinations" className="bg-white pb-4 pt-12 sm:pt-14">
      <div className="th-container mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-[#1a2420] sm:text-[32px]">
            Explore Popular Destinations
          </h2>
          <p className="mt-1.5 text-[14px] text-[#6b7a72]">
            Handpicked places for your next adventure
          </p>
        </div>
        <a
          href="#packages"
          className="hidden shrink-0 items-center rounded-lg border border-[#dde5e0] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#1a2420] transition hover:border-[#f27c22] hover:text-[#f27c22] sm:inline-flex"
        >
          View all destinations <span className="ml-1.5 text-[15px]">›</span>
        </a>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Previous destinations"
          onClick={() => scrollBy(-1)}
          className="absolute left-1 top-[46%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6ebe8] bg-white text-[#1a2420] shadow-[0_4px_14px_rgba(15,23,42,0.12)] sm:flex lg:left-3"
        >
          <ChevronLeft className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          aria-label="Next destinations"
          onClick={() => scrollBy(1)}
          className="absolute right-1 top-[46%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6ebe8] bg-white text-[#1a2420] shadow-[0_4px_14px_rgba(15,23,42,0.12)] sm:flex lg:right-3"
        >
          <ChevronRight className="h-[18px] w-[18px]" />
        </button>

        <div
          ref={scrollerRef}
          className="hide-scrollbar th-container flex gap-[14px] overflow-x-auto scroll-smooth pb-2"
        >
          {cards.map((d) => {
            const Icon = d.icon;
            const href =
              d.key === "Himachal" ||
              d.key === "Spiti" ||
              d.key === "Andaman" ||
              d.key === "Sikkim" ||
              d.key === "Uttarakhand"
                ? "#packages"
                : `#${d.key.toLowerCase()}`;

            return (
              <a
                key={d.key}
                href={href}
                className="group relative h-[300px] w-[168px] shrink-0 overflow-hidden rounded-[16px] bg-[#d8d8d8] sm:h-[318px] sm:w-[178px]"
              >
                <img
                  src={d.image}
                  alt={d.label}
                  width={360}
                  height={640}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 42%, rgba(0,0,0,0.78) 100%)",
                  }}
                />

                {d.trending && (
                  <span className="absolute right-2.5 top-2.5 rounded-[4px] bg-[#f27c22] px-[7px] py-[3px] text-[9px] font-bold uppercase tracking-[0.04em] text-white">
                    Trending
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 flex flex-col items-start px-3.5 pb-3.5 text-white">
                  <Icon className="mb-1.5 h-[18px] w-[18px] text-white" strokeWidth={1.75} />
                  <p className="text-[15px] font-bold leading-tight tracking-[-0.01em]">
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
