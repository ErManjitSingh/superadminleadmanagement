"use client";

import { whyUs } from "@/lib/data";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/effects/FadeIn";

export function WhyUs() {
  return (
    <section id="why-us" className="section-padding bg-[var(--mist)]">
      <div className="mx-auto max-w-7xl">
        <FadeIn className="mb-14 mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--lagoon)]">
            Why travel with us
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl lg:text-5xl">
            Built for real holidays, not brochure fluff
          </h2>
          <p className="mt-4 text-lg text-[var(--ink)]/60">
            We plan the boring bits so you can focus on the views, food and memories.
          </p>
        </FadeIn>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyUs.map((item) => {
            const Icon = item.icon;
            return (
              <StaggerItem key={item.title}>
                <div className="h-full rounded-3xl bg-white p-7 ring-1 ring-[var(--ink)]/5">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--lagoon)]/10 text-[var(--lagoon)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-[var(--ink)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]/55">{item.description}</p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
