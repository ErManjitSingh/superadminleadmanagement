"use client";

import { FadeIn } from "@/components/effects/FadeIn";
import { trustStats, trustLogos } from "@/lib/data";

export function Trust() {
  const doubled = [...trustLogos, ...trustLogos];

  return (
    <section className="relative border-y border-white/[0.06] bg-white/[0.02] py-20 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="mb-12 text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Trusted by Leading Travel Companies
          </p>
        </FadeIn>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-[hsl(224,71%,3%)] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-[hsl(224,71%,3%)] to-transparent" />
          <div className="flex animate-marquee gap-5">
            {doubled.map((logo, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-3.5 backdrop-blur-sm transition-colors hover:border-emerald-500/20 hover:bg-white/[0.05]"
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/20" />
                <span className="whitespace-nowrap text-sm font-semibold text-foreground/70">
                  {logo}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-6 md:grid-cols-4">
          {trustStats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1}>
              <div className="shine-border rounded-2xl p-6 text-center">
                <p className="font-display text-4xl font-extrabold gradient-text sm:text-5xl">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
