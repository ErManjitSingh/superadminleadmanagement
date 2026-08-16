"use client";

import { useRef, useState } from "react";
import { destinationIcons, IconExplore } from "@/components/icons/DestinationIcons";
import { siteConfig } from "@/lib/config";

type Tab = {
  name: string;
  href: string;
  trending?: boolean;
  external?: boolean;
};

const tabs: (Tab & { icon: string })[] = [
  { name: "Explore", href: "#packages", icon: "Explore" },
  { name: "Treks", href: siteConfig.treksUrl, icon: "Himachal", trending: true, external: true },
  { name: "Goa", href: "#goa", icon: "Goa", trending: true },
  { name: "Kerala", href: "#kerala", icon: "Kerala", trending: true },
  { name: "Ladakh", href: "#ladakh", icon: "Ladakh", trending: true },
  { name: "Kashmir", href: "#kashmir", icon: "Kashmir" },
  { name: "Rajasthan", href: "#rajasthan", icon: "Rajasthan" },
  { name: "Himachal", href: "#packages", icon: "Himachal", trending: true },
  { name: "Andaman", href: "#packages", icon: "Andaman" },
  { name: "Spiti", href: "#packages", icon: "Spiti", trending: true },
  { name: "Sikkim", href: "#packages", icon: "Sikkim" },
  { name: "More", href: "#packages", icon: "Explore" },
];

/** Thrillophilia StickyTabBar-style Explore row with SVG icons */
export function ExploreTabs() {
  const [active, setActive] = useState("Explore");
  const scrollerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative z-40 bg-white pb-3">
      <div className="mx-auto -mt-7 max-w-[1040px] rounded-2xl border border-black/[0.05] bg-white px-4 shadow-[0_14px_40px_rgba(31,41,55,0.12)]">
        <div
          ref={scrollerRef}
          className="hide-scrollbar flex items-stretch justify-between overflow-x-auto"
        >
          {tabs.map((tab, i) => {
            const isActive = active === tab.name || (tab.name === "Explore" && active === "Explore");
            const Icon = destinationIcons[tab.icon] || IconExplore;
            return (
              <a
                key={tab.name}
                href={tab.href}
                onClick={() => setActive(tab.name)}
                {...(tab.external ? { rel: "noopener noreferrer" } : {})}
                className={`relative mr-8 flex min-h-[76px] min-w-max flex-col items-center justify-center px-1 pt-1 last:mr-0 sm:mr-5 ${
                  i === tabs.length - 1 ? "mr-0" : ""
                }`}
              >
                <div className="relative flex h-[25px] w-[25px] items-center justify-center">
                  <Icon active={isActive} />
                  {tab.trending && (
                    <span className="absolute -right-6 -top-1 rounded-[3px] bg-[var(--th-orange)] px-1 py-[1px] text-[7px] font-bold leading-none text-white">
                      Trending
                    </span>
                  )}
                </div>
                <span
                  className={`mt-[6px] max-w-[66px] text-center text-[11px] font-semibold leading-[14px] transition ${
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

      </div>
    </div>
  );
}
