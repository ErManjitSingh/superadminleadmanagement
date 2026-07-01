"use client";

import { FadeIn } from "@/components/effects/FadeIn";
import { trustStats, trustLogos } from "@/lib/data";

export function Trust() {
  const doubled = [...trustLogos, ...trustLogos];

  return (
    <section className="relative border-y border-white/10 bg-card/30 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="mb-10 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Trusted by Travel Companies
          </p>
        </FadeIn>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />
          <div className="flex animate-marquee gap-12">
            {doubled.map((logo, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-violet-500/30" />
                <span className="whitespace-nowrap text-sm font-semibold text-muted-foreground">
                  {logo}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {trustStats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1}>
              <div className="text-center">
                <p className="text-3xl font-bold gradient-text sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
