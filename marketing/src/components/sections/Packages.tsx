"use client";

import { ArrowUpRight } from "lucide-react";
import { packages } from "@/lib/data";
import { siteConfig } from "@/lib/config";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/effects/FadeIn";

export function Packages() {
  return (
    <section id="packages" className="section-padding bg-[var(--sand)]">
      <div className="mx-auto max-w-7xl">
        <FadeIn className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--lagoon)]">
            Featured packages
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl lg:text-5xl">
            Journeys worth packing for
          </h2>
          <p className="mt-4 text-lg text-[var(--ink)]/60">
            Ready-to-book holiday packages with clear pricing — customise any itinerary to your dates.
          </p>
        </FadeIn>

        <StaggerContainer className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <StaggerItem key={pkg.id}>
              <article className="group overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_-28px_rgba(12,36,38,0.35)] ring-1 ring-[var(--ink)]/5 transition-transform duration-500 hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={pkg.image}
                    alt={pkg.imageAlt}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                    {pkg.tag}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-bold text-[var(--ink)]">{pkg.title}</h3>
                      <p className="mt-1 text-sm text-[var(--ink)]/50">
                        {pkg.location} · {pkg.duration}
                      </p>
                    </div>
                    <p className="shrink-0 text-right">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--ink)]/40">
                        From
                      </span>
                      <span className="font-display text-lg font-bold text-[var(--coral)]">
                        {pkg.priceFrom}
                      </span>
                    </p>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {pkg.highlights.map((h) => (
                      <li
                        key={h}
                        className="rounded-full bg-[var(--mist)] px-3 py-1 text-xs font-medium text-[var(--lagoon)]"
                      >
                        {h}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={siteConfig.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:text-[var(--coral)]"
                  >
                    Enquire now
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
