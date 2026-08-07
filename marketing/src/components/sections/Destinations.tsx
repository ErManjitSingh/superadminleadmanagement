"use client";

import { destinations } from "@/lib/data";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/effects/FadeIn";

export function Destinations() {
  return (
    <section id="destinations" className="section-padding bg-[var(--ink)] text-white">
      <div className="mx-auto max-w-7xl">
        <FadeIn className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--coral)]">
            Destinations
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Where will India take you next?
          </h2>
          <p className="mt-4 text-lg text-white/55">
            From coastline sunsets to Himalayan mornings — pick a region and we will craft the days.
          </p>
        </FadeIn>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((d) => (
            <StaggerItem key={d.name}>
              <a href="#packages" className="group relative block aspect-[3/4] overflow-hidden rounded-[1.75rem]">
                <img
                  src={d.image}
                  alt={d.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-display text-2xl font-bold">{d.name}</h3>
                  <p className="mt-1 text-sm text-white/70">{d.blurb}</p>
                </div>
              </a>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
