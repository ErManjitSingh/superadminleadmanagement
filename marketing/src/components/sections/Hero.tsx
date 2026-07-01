"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  Play,
  TrendingUp,
  Users,
  BarChart3,
  Bell,
  CheckCircle2,
  Sparkles,
  Zap,
  IndianRupee,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { heroFloatingCards } from "@/lib/data";
import { FadeIn } from "@/components/effects/FadeIn";

const cardIcons = [Zap, IndianRupee, CheckCircle2, IndianRupee, Calendar, Bell];

const cardPositions = [
  { top: "6%", left: "-4%", delay: 0 },
  { top: "18%", right: "-2%", delay: 0.4 },
  { top: "52%", left: "-8%", delay: 0.8 },
  { top: "62%", right: "-6%", delay: 1.2 },
  { bottom: "14%", left: "2%", delay: 1.6 },
  { bottom: "6%", right: "4%", delay: 2 },
];

export function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section className="relative min-h-screen overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28">
      <div className="absolute inset-0 mesh-hero pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
          <div className="relative z-10">
            <FadeIn>
              <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-semibold tracking-wide text-emerald-300">
                  AI-Powered Travel CRM
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="font-display text-balance text-[2.75rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
                Run Your Entire{" "}
                <span className="gradient-text">Travel Empire</span>
                <br />
                From One CRM
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
                Leads, follow-ups, quotations, bookings, operations, WhatsApp & teams —
                everything your travel agency needs, beautifully unified.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button variant="gradient" size="lg" className="h-14 px-8 text-base" asChild>
                  <Link href={siteConfig.signup}>
                    Start Free Demo
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-8 text-base group border-white/10">
                  <Play className="mr-1 h-4 w-4 fill-current transition-transform group-hover:scale-110" />
                  Watch Demo
                </Button>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
                {[
                  "14-day free trial",
                  "No credit card",
                  "Setup in 2 min",
                ].map((t) => (
                  <span key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {["RM", "PS", "AP", "SR", "VS"].map((a, i) => (
                    <div
                      key={a}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[hsl(224,71%,3%)] bg-gradient-to-br from-emerald-500 to-cyan-600 text-[10px] font-bold text-white"
                      style={{ zIndex: 5 - i }}
                    >
                      {a}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">100+</span> travel companies trust us
                </p>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.15} direction="left" className="relative lg:pl-4">
            <div
              className="relative mx-auto w-full max-w-xl perspective-[1200px] lg:max-w-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {heroFloatingCards.map((card, i) => {
                const pos = cardPositions[i];
                const Icon = cardIcons[i];
                return (
                  <motion.div
                    key={card.label}
                    className={`absolute z-20 hidden rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-2xl sm:block ${card.color}`}
                    style={{
                      top: pos.top,
                      bottom: pos.bottom,
                      left: pos.left,
                      right: pos.right,
                    }}
                    initial={{ opacity: 0, scale: 0.85, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                    transition={{
                      opacity: { delay: pos.delay, duration: 0.5 },
                      scale: { delay: pos.delay, duration: 0.5 },
                      y: { delay: pos.delay + 0.5, duration: 5, repeat: Infinity, ease: "easeInOut" },
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{card.label}</p>
                        <p className="text-[10px] text-white/60">{card.sub}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              <motion.div
                className="shine-border relative overflow-hidden rounded-3xl p-[1px] glow-primary"
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="overflow-hidden rounded-3xl bg-[#060d18] p-1">
                  <div className="rounded-[1.25rem] bg-gradient-to-b from-white/[0.06] to-transparent p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500/90" />
                        <div className="h-3 w-3 rounded-full bg-amber-400/90" />
                        <div className="h-3 w-3 rounded-full bg-emerald-400/90" />
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Live Dashboard
                      </div>
                    </div>

                    <div className="mb-4 grid grid-cols-3 gap-3">
                      {[
                        { label: "Active Leads", value: "248", icon: Users, color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400" },
                        { label: "Revenue", value: "₹12.4L", icon: TrendingUp, color: "from-cyan-500/20 to-cyan-500/5 text-cyan-400" },
                        { label: "Bookings", value: "34", icon: BarChart3, color: "from-violet-500/20 to-violet-500/5 text-violet-400" },
                      ].map((stat) => (
                        <div key={stat.label} className={`rounded-xl bg-gradient-to-br ${stat.color} p-3`}>
                          <stat.icon className="mb-2 h-4 w-4" />
                          <p className="text-lg font-bold text-white">{stat.value}</p>
                          <p className="text-[10px] text-white/50">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-white/70">Lead Conversion</p>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">+24%</span>
                      </div>
                      <div className="flex h-24 items-end gap-1.5">
                        {[35, 55, 42, 72, 48, 88, 65, 92, 58, 95, 78, 100].map((h, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 rounded-md bg-gradient-to-t from-emerald-600 via-teal-500 to-cyan-400"
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: 0.6 + i * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        { name: "Rajesh K.", dest: "Goa Premium Package", status: "Hot Lead", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
                        { name: "Priya S.", dest: "Kerala Honeymoon", status: "Quoted", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
                        { name: "Amit P.", dest: "Himachal Adventure", status: "Follow-up", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
                      ].map((row) => (
                        <div key={row.name} className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 text-[10px] font-bold text-white">
                              {row.name.split(" ")[0][0]}{row.name.split(" ")[1]?.[0]}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">{row.name}</p>
                              <p className="text-[10px] text-white/40">{row.dest}</p>
                            </div>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${row.color}`}>
                            {row.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-r from-emerald-500/25 via-cyan-500/15 to-violet-500/20 blur-3xl" />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
