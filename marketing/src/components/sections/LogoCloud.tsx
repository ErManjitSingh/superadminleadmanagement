"use client";

import { FadeIn } from "@/components/effects/FadeIn";
import { trustLogos } from "@/lib/data";

export function LogoCloud() {
  const doubled = [...trustLogos, ...trustLogos];

  return (
    <section className="section-light border-b border-slate-100 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="mb-10 text-center text-sm font-medium text-slate-500">
            Trusted by <span className="font-semibold text-slate-800">100+ Travel Companies</span> Worldwide
          </p>
        </FadeIn>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-white to-transparent" />
          <div className="flex animate-marquee gap-12">
            {doubled.map((logo, i) => (
              <div key={i} className="flex shrink-0 items-center gap-2 opacity-50 grayscale transition-all hover:opacity-80 hover:grayscale-0">
                <div className="h-8 w-8 rounded-lg bg-slate-200" />
                <span className="whitespace-nowrap text-sm font-bold text-slate-600">{logo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
