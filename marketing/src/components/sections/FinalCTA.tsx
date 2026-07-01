"use client";

import { motion } from "framer-motion";
import { FadeIn } from "@/components/effects/FadeIn";
import { siteConfig } from "@/lib/config";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="shine-border relative overflow-hidden rounded-[2rem] p-12 text-center sm:p-20">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(168_76%_42%_/_0.12),transparent_70%)]" />
            <motion.div
              className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 8, repeat: Infinity }}
            />

            <div className="relative z-10">
              <h2 className="font-display text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Ready to Grow Your{" "}
                <span className="gradient-text">Travel Business?</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
                Start your free demo today. Join 100+ travel companies already growing with Travel CRM.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button variant="gradient" size="lg" className="h-14 px-10 text-base" asChild>
                  <Link href={siteConfig.signup}>
                    Create Free Account
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-10 text-base" asChild>
                  <a href={siteConfig.crmLogin}>Login</a>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
