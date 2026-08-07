"use client";

import { useEffect, useRef, useState } from "react";
import { exploreDestinations } from "@/lib/data";
import { destinationIcons, IconExplore } from "@/components/icons/DestinationIcons";

type Tab = {
  name: string;
  href: string;
  trending?: boolean;
};

const tabs: Tab[] = [
  { name: "Explore", href: "#packages" },
  ...exploreDestinations.map((d) => ({
    name: d.name,
    trending: d.trending,
    href: `#${["goa", "kerala", "ladakh", "kashmir", "rajasthan"].includes(d.name.toLowerCase()) ? d.name.toLowerCase() : "packages"}`,
  })),
];

/** Thrillophilia StickyTabBar-style Explore row with SVG icons */
export function ExploreTabs() {
  const [active, setActive] = useState("Explore");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const ids = ["goa", "kerala", "ladakh", "kashmir", "rajasthan"];
      let current = "Explore";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top < 180) current = id.charAt(0).toUpperCase() + id.slice(1);
      }
      // Map section titles
      const map: Record<string, string> = {
        Goa: "Goa",
        Kerala: "Kerala",
        Ladakh: "Ladakh",
        Kashmir: "Kashmir",
        Rajasthan: "Rajasthan",
      };
      setActive(map[current] || current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sticky top-16 z-40 border-b border-[#eee] bg-white">
      <div className="th-container relative">
        <div
          ref={scrollerRef}
          className="hide-scrollbar flex items-stretch overflow-x-auto py-2 pr-12"
        >
          {tabs.map((tab, i) => {
            const isActive = active === tab.name || (tab.name === "Explore" && active === "Explore");
            const Icon = destinationIcons[tab.name] || IconExplore;
            return (
              <a
                key={tab.name}
                href={tab.href}
                onClick={() => setActive(tab.name)}
                className={`relative mr-[50px] flex min-h-[60px] min-w-max flex-col items-center justify-center pt-2 last:mr-0 max-sm:mr-[44px] ${
                  i === tabs.length - 1 ? "mr-0" : ""
                }`}
              >
                <div className="relative flex h-[25px] w-[25px] items-center justify-center">
                  <Icon active={isActive} />
                  {tab.trending && (
                    <span className="absolute -right-5 -top-2 rounded-[3px] bg-[var(--th-orange)] px-1 py-[1px] text-[8px] font-bold leading-none text-white">
                      Trending
                    </span>
                  )}
                </div>
                <span
                  className={`mt-[7px] text-center text-[12px] font-medium leading-[18px] capitalize transition ${
                    isActive ? "text-[var(--th-orange)]" : "text-[#515151]"
                  }`}
                >
                  {tab.name}
                </span>
                <span
                  className={`absolute bottom-0 h-[1.5px] w-full bg-[var(--th-orange)] transition ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              </a>
            );
          })}
        </div>

        {/* Right fade + seek like Thrillophilia */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 items-center justify-end sm:flex"
          style={{ background: "linear-gradient(90deg, #fff0, #fffffff0 48.71%, #fff)" }}
          aria-hidden
        />
      </div>
    </div>
  );
}
