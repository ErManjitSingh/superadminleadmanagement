"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading, FadeIn } from "@/components/effects/FadeIn";
import { modules } from "@/lib/data";
import { siteConfig } from "@/lib/config";

function ModuleMockup({ index }: { index: number }) {
  const colors = [
    "from-blue-500/30 to-cyan-500/20",
    "from-violet-500/30 to-purple-500/20",
    "from-emerald-500/30 to-teal-500/20",
    "from-amber-500/30 to-orange-500/20",
  ];
  const color = colors[index % colors.length];

  return (
    <div className={`glass-card relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-6`}>
      <div className="rounded-xl bg-slate-950/80 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="space-y-2">
          {[85, 65, 75, 55, 90].map((w, i) => (
            <motion.div
              key={i}
              className="h-3 rounded-full bg-white/10"
              initial={{ width: 0 }}
              whileInView={{ width: `${w}%` }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="h-16 rounded-lg bg-white/5" />
          <div className="h-16 rounded-lg bg-white/5" />
        </div>
        <div className="mt-3 h-20 rounded-lg bg-gradient-to-r from-white/5 to-white/10" />
      </div>
      <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 blur-xl" />
    </div>
  );
}

export function ModuleShowcase() {
  return (
    <section id="modules" className="section-padding relative">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          badge="CRM Modules"
          title="Purpose-Built for Travel Operations"
          subtitle="Every module connects seamlessly — from first inquiry to completed trip."
        />

        <div className="space-y-24 lg:space-y-32">
          {modules.map((mod, i) => {
            const reversed = i % 2 === 1;
            return (
              <FadeIn key={mod.id}>
                <div
                  className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-16 ${
                    reversed ? "lg:[direction:rtl]" : ""
                  }`}
                >
                  <div className={reversed ? "lg:[direction:ltr]" : ""}>
                    <ModuleMockup index={i} />
                  </div>
                  <div className={reversed ? "lg:[direction:ltr]" : ""}>
                    <span className={`text-sm font-semibold ${mod.accent}`}>
                      {mod.subtitle}
                    </span>
                    <h3 className="mt-2 text-3xl font-bold tracking-tight">
                      {mod.title}
                    </h3>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                      {mod.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {mod.benefits.map((b) => (
                        <li key={b} className="flex items-center gap-3 text-sm">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          {b}
                        </li>
                      ))}
                    </ul>
                    <Button variant="gradient" className="mt-8" asChild>
                      <Link href={siteConfig.signup}>
                        Start Free Demo
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
