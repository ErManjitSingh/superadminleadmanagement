"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  TrendingUp,
  Users,
  BarChart3,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/config";
import { heroFloatingCards } from "@/lib/data";
import { FadeIn } from "@/components/effects/FadeIn";

const cardPositions = [
  { top: "8%", left: "-8%", delay: 0 },
  { top: "15%", right: "-6%", delay: 0.5 },
  { top: "55%", left: "-12%", delay: 1 },
  { top: "65%", right: "-10%", delay: 1.5 },
  { bottom: "12%", left: "5%", delay: 2 },
  { bottom: "8%", right: "8%", delay: 2.5 },
];

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative z-10">
            <FadeIn>
              <Badge variant="outline" className="mb-6">
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                AI-Powered Travel CRM
              </Badge>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                Run Your Entire{" "}
                <span className="gradient-text">Travel Business</span> From One Powerful CRM
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Manage Leads, Follow-ups, Quotations, Bookings, Operations, Attendance,
                WhatsApp, Branches and Teams from one modern platform.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button variant="gradient" size="lg" asChild>
                  <Link href={siteConfig.signup}>
                    Start Free Demo
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="group">
                  <Play className="mr-1 h-4 w-4 transition-transform group-hover:scale-110" />
                  Watch Demo
                </Button>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  14-day free trial
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  No credit card
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Setup in 2 minutes
                </span>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.2} direction="left" className="relative">
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              {/* Floating notification cards */}
              {heroFloatingCards.map((card, i) => {
                const pos = cardPositions[i];
                return (
                  <motion.div
                    key={card.label}
                    className={`absolute z-20 hidden rounded-xl border px-3 py-2 backdrop-blur-xl sm:block ${card.color}`}
                    style={{
                      top: pos.top,
                      bottom: pos.bottom,
                      left: pos.left,
                      right: pos.right,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
                    transition={{
                      opacity: { delay: pos.delay, duration: 0.5 },
                      scale: { delay: pos.delay, duration: 0.5 },
                      y: { delay: pos.delay + 0.5, duration: 4, repeat: Infinity, ease: "easeInOut" },
                    }}
                  >
                    <p className="text-xs font-semibold">{card.label}</p>
                    <p className="text-[10px] text-muted-foreground">{card.sub}</p>
                  </motion.div>
                );
              })}

              {/* Dashboard mockup */}
              <motion.div
                className="glass-card relative overflow-hidden rounded-2xl p-1 glow-blue"
                initial={{ opacity: 0, y: 40, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 p-4">
                  {/* Top bar */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                      <div className="h-3 w-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Bell className="h-3.5 w-3.5" />
                      <span>3 new</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {[
                      { label: "Leads", value: "248", icon: Users, color: "text-cyan-400" },
                      { label: "Revenue", value: "₹12.4L", icon: TrendingUp, color: "text-emerald-400" },
                      { label: "Bookings", value: "34", icon: BarChart3, color: "text-violet-400" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg bg-white/5 p-2.5">
                        <stat.icon className={`mb-1 h-3.5 w-3.5 ${stat.color}`} />
                        <p className="text-sm font-bold text-white">{stat.value}</p>
                        <p className="text-[10px] text-slate-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart area */}
                  <div className="mb-3 rounded-lg bg-white/5 p-3">
                    <p className="mb-2 text-[10px] font-medium text-slate-400">Lead Conversion</p>
                    <div className="flex h-20 items-end gap-1">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-sm bg-gradient-to-t from-blue-600 to-cyan-400"
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Table rows */}
                  <div className="space-y-1.5">
                    {[
                      { name: "Rajesh K.", dest: "Goa Package", status: "Hot", color: "bg-emerald-500/20 text-emerald-400" },
                      { name: "Priya S.", dest: "Kerala Tour", status: "Quoted", color: "bg-violet-500/20 text-violet-400" },
                      { name: "Amit P.", dest: "Himachal", status: "Follow-up", color: "bg-amber-500/20 text-amber-400" },
                    ].map((row) => (
                      <div key={row.name} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                        <div>
                          <p className="text-xs font-medium text-white">{row.name}</p>
                          <p className="text-[10px] text-slate-500">{row.dest}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${row.color}`}>
                          {row.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-cyan-500/20 blur-2xl" />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
