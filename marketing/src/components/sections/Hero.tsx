"use client";

import { ArrowRight, MapPin } from "lucide-react";
import { siteConfig } from "@/lib/config";

export function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=2000&q=80)",
        }}
        aria-hidden
      />
      <div className="hero-wash absolute inset-0" aria-hidden />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:px-8 lg:pb-24 lg:pt-32">
        <p className="hero-enter font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
          India Holiday Destination
        </p>

        <div className="hero-enter hero-enter-delay-1 mt-4 h-0.5 w-24 origin-left bg-[var(--coral)] sm:w-32" />

        <h1 className="hero-enter hero-enter-delay-2 mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Holiday packages that feel like home across India
        </h1>

        <p className="hero-enter hero-enter-delay-3 mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
          Beaches, mountains, heritage trails and islands — curated itineraries with stays,
          transfers and local experiences, ready for your dates.
        </p>

        <div className="hero-enter hero-enter-delay-4 mt-9 flex flex-wrap items-center gap-3">
          <a href="#packages" className="btn-primary">
            Explore Packages
            <ArrowRight className="h-4 w-4" />
          </a>
          <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="btn-secondary">
            <MapPin className="h-4 w-4" />
            Enquire on WhatsApp
          </a>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 sm:block"
        aria-hidden
      >
        <div className="h-10 w-px overflow-hidden bg-white/20">
          <div className="h-full w-full origin-top bg-white/70 animate-shimmer-line" />
        </div>
      </div>
    </section>
  );
}
