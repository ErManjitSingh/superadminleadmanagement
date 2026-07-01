"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { FadeIn } from "@/components/effects/FadeIn";

export function FinalCTA() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-violet-600/20 to-cyan-600/20 p-12 text-center sm:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_70%)]" />
            <motion.div
              className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.6, 0.3, 0.6] }}
              transition={{ duration: 6, repeat: Infinity }}
            />

            <div className="relative z-10">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Ready to Grow Your{" "}
                <span className="gradient-text">Travel Business?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Start Free Demo Today. Join 100+ travel companies already using UNO Travel CRM.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button variant="gradient" size="lg" asChild>
                  <Link href={siteConfig.signup}>
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
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
