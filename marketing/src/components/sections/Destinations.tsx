"use client";

import { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mountain,
  Umbrella,
  TreePalm,
  Castle,
  Snowflake,
  Tent,
} from "lucide-react";
import { exploreDestinations } from "@/lib/data";

const displayName: Record<string, string> = {
  Himachal: "Himachal Pradesh",
  Spiti: "Spiti Valley",
  Andaman: "Andaman",
};

const cardIcon: Record<string, typeof Mountain> = {
  Goa: Umbrella,
  Kerala: TreePalm,
  Ladakh: Mountain,
  Kashmir: Snowflake,
  Rajasthan: Castle,
  Himachal: Mountain,
  Andaman: Umbrella,
  Spiti: Mountain,
  Sikkim: Mountain,
  Uttarakhand: Tent,
};

/** Tall destination carousel matching homepage mock */
export function Destinations() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  return (
    <section id="destinations" className="bg-white py-12 sm:py-16">
      <div className="th-container mb-7 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-[var(--th-ink)] sm:text-[32px]">
            Explore Popular Destinations
          </h2>
          <p className="mt-1.5 text-[14px] text-[var(--th-muted)]">
            Handpicked places for your next adventure
          </p>
        </div>
        <a
          href="#packages"
          className="hidden shrink-0 items-center rounded-xl border border-[var(--th-border)] bg-white px-4 py-2.5 text-[13px] font-semibold text-[var(--th-ink)] transition hover:border-[var(--th-orange)] hover:text-[var(--th-orange)] sm:inline-flex"
        >
          View all destinations <span className="ml-1">›</span>
        </a>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Previous destinations"
          onClick={() => scrollBy(-1)}
          className="absolute -left-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e4ebe6] bg-white text-[var(--th-ink)] shadow-md transition hover:border-[var(--th-orange)] sm:flex lg:left-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next destinations"
          onClick={() => scrollBy(1)}
          className="absolute -right-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e4ebe6] bg-white text-[var(--th-ink)] shadow-md transition hover:border-[var(--th-orange)] sm:flex lg:right-2"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          ref={scrollerRef}
          className="hide-scrollbar th-container flex gap-4 overflow-x-auto scroll-smooth pb-1"
        >
          {exploreDestinations.map((d) => {
            const Icon = cardIcon[d.name] || Mountain;
            const label = displayName[d.name] || d.name;
            const href =
              d.name === "Himachal" || d.name === "Spiti" || d.name === "Andaman" || d.name === "Sikkim" || d.name === "Uttarakhand"
                ? "#packages"
                : `#${d.name.toLowerCase()}`;

            return (
              <a
                key={d.name}
                href={href}
                className="group relative h-[320px] w-[200px] shrink-0 overflow-hidden rounded-2xl bg-[#ddd] shadow-[0_10px_28px_rgba(15,23,42,0.1)] sm:h-[340px] sm:w-[210px]"
              >
                <img
                  src={d.image}
                  alt={label}
                  width={420}
                  height={680}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.75) 100%)",
                  }}
                />

                {d.trending && (
                  <span className="absolute right-3 top-3 rounded-md bg-[var(--th-orange)] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                    Trending
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-white">
                  <Icon className="mb-2 h-5 w-5 text-white/95" strokeWidth={2} />
                  <p className="text-[17px] font-bold leading-tight">{label}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
