"use client";

import { motion } from "framer-motion";
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
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl"
        >
          India Holiday Destination
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 h-0.5 w-24 origin-left bg-[var(--coral)] sm:w-32"
        />

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Holiday packages that feel like home across India
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.7 }}
          className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
        >
          Beaches, mountains, heritage trails and islands — curated itineraries with stays,
          transfers and local experiences, ready for your dates.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.65 }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <a href="#packages" className="btn-primary">
            Explore Packages
            <ArrowRight className="h-4 w-4" />
          </a>
          <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="btn-secondary">
            <MapPin className="h-4 w-4" />
            Enquire on WhatsApp
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 1 }}
        className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 sm:block"
        aria-hidden
      >
        <div className="h-10 w-px overflow-hidden bg-white/20">
          <div className="h-full w-full origin-top bg-white/70 animate-shimmer-line" />
        </div>
      </motion.div>
    </section>
  );
}
