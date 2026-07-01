"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/effects/FadeIn";
import { siteConfig } from "@/lib/config";

export function FinalCTA() {
  return (
    <section className="section-dark relative overflow-hidden py-24 lg:py-32">
      <div className="absolute inset-0 hero-glow" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <FadeIn>
            <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
              Ready to Grow Your{" "}
              <span className="gradient-text">Travel Business?</span>
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/60">
              Join 100+ travel companies already using Travel CRM to manage leads, bookings and operations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={siteConfig.signup} className="btn-primary h-12 px-8 text-base">
                Start Free Demo <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#contact" className="btn-outline-light h-12 px-8 text-base">
                Book Live Demo
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.15} direction="left">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12121f] shadow-purple" style={{ transform: "perspective(800px) rotateY(-6deg)" }}>
              <div className="border-b border-white/10 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-500/80" />
                  <div className="h-2 w-2 rounded-full bg-yellow-500/80" />
                  <div className="h-2 w-2 rounded-full bg-green-500/80" />
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-20 rounded-xl bg-violet-500/20" />
                  <div className="h-20 rounded-xl bg-indigo-500/20" />
                </div>
                <div className="mt-2 h-32 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/20" />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
