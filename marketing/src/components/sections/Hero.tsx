"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, TrendingUp, Users, BarChart3 } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { heroFloatingCards, heroStats } from "@/lib/data";
import { FadeIn } from "@/components/effects/FadeIn";

const cardPos = [
  { top: "5%", left: "-2%", delay: 0 },
  { top: "20%", right: "-4%", delay: 0.3 },
  { bottom: "25%", left: "-6%", delay: 0.6 },
  { bottom: "8%", right: "-2%", delay: 0.9 },
];

export function Hero() {
  return (
    <section className="section-dark relative min-h-screen overflow-hidden pt-24 pb-16 lg:pt-28">
      <div className="absolute inset-0 hero-glow" />
      <div className="absolute inset-0 mesh-dark opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <div>
            <FadeIn>
              <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem] xl:text-6xl">
                Run Your Entire Travel Business From One{" "}
                <span className="gradient-text">Powerful CRM</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-white/60 lg:text-lg">
                Manage Leads, Follow-ups, Quotations, Bookings, Operations, Attendance,
                WhatsApp, Branches and Teams from one modern platform.
              </p>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={siteConfig.signup} className="btn-primary h-12 px-7 text-base">
                  Start Free Demo <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#contact" className="btn-outline-light h-12 px-7 text-base">
                  Book Live Demo
                </a>
              </div>
              <button className="mt-4 flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-violet-400">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5">
                  <Play className="h-3 w-3 fill-current" />
                </span>
                Watch Product Tour
              </button>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {heroStats.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-xl font-bold text-white sm:text-2xl">{s.value}</p>
                    <p className="mt-0.5 text-xs text-white/45">{s.label}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.15} direction="left" className="relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {heroFloatingCards.map((card, i) => {
                const pos = cardPos[i];
                return (
                  <motion.div
                    key={card.label}
                    className={`absolute z-20 hidden rounded-xl border px-3 py-2.5 backdrop-blur-xl sm:block ${card.color}`}
                    style={{ top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right }}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: pos.delay, ease: "easeInOut" }}
                  >
                    <p className="text-xs font-bold text-white">{card.label}</p>
                    <p className="text-[10px] text-white/50">{card.sub}</p>
                  </motion.div>
                );
              })}

              <motion.div
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#12121f] shadow-purple"
                initial={{ opacity: 0, y: 30, rotateX: 8 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8 }}
                style={{ transform: "perspective(1000px) rotateY(-4deg) rotateX(4deg)" }}
              >
                <div className="border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                    <span className="ml-2 text-xs text-white/40">Travel CRM Dashboard</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {[
                      { label: "Leads", value: "248", icon: Users, c: "text-violet-400" },
                      { label: "Revenue", value: "₹12.4L", icon: TrendingUp, c: "text-emerald-400" },
                      { label: "Bookings", value: "34", icon: BarChart3, c: "text-blue-400" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-white/5 p-3">
                        <s.icon className={`mb-1 h-4 w-4 ${s.c}`} />
                        <p className="text-lg font-bold text-white">{s.value}</p>
                        <p className="text-[10px] text-white/40">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mb-3 rounded-xl bg-white/5 p-3">
                    <p className="mb-2 text-[10px] font-medium text-white/50">Lead Conversion</p>
                    <div className="flex h-16 items-end gap-1">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-sm bg-gradient-to-t from-violet-600 to-indigo-400"
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.5 + i * 0.04, duration: 0.5 }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { name: "Rajesh K.", dest: "Goa Package", status: "Hot", bg: "bg-emerald-500/20 text-emerald-400" },
                      { name: "Priya S.", dest: "Kerala Tour", status: "Quoted", bg: "bg-violet-500/20 text-violet-400" },
                    ].map((r) => (
                      <div key={r.name} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                        <div>
                          <p className="text-xs font-medium text-white">{r.name}</p>
                          <p className="text-[10px] text-white/40">{r.dest}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.bg}`}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-r from-violet-600/30 to-indigo-600/20 blur-3xl" />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
