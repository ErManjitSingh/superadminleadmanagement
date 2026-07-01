"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/effects/FadeIn";
import { moduleTabs } from "@/lib/data";

function ModulePreview({ active }: { active: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-card">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-xs text-slate-400 capitalize">{active.replace("-", " ")}</span>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white shadow-sm" />
          ))}
        </div>
        <div className="space-y-2">
          {[90, 70, 85, 60, 75].map((w, i) => (
            <motion.div
              key={i}
              className="h-3 rounded-full bg-gradient-to-r from-violet-200 to-indigo-100"
              initial={{ width: 0 }}
              animate={{ width: `${w}%` }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            />
          ))}
        </div>
        <div className="mt-4 h-28 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-50" />
      </div>
    </div>
  );
}

export function ModuleTabs() {
  const [active, setActive] = useState(moduleTabs[0].id);
  const current = moduleTabs.find((m) => m.id === active)!;

  return (
    <section id="modules" className="section-muted section-padding">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="Powerful Modules Built for Travel Business"
          subtitle="Every module connects seamlessly — from first inquiry to completed trip."
          theme="light"
        />

        <div className="flex flex-wrap justify-center gap-2">
          {moduleTabs.map((m) => (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                active === m.id
                  ? "gradient-purple text-white shadow-lg shadow-violet-500/25"
                  : "bg-white text-slate-600 shadow-sm hover:text-violet-600"
              }`}
            >
              {m.title}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="mt-10 grid items-center gap-10 lg:grid-cols-2"
          >
            <ModulePreview active={active} />
            <div>
              <h3 className="font-display text-2xl font-bold text-slate-900">{current.title}</h3>
              <p className="mt-4 text-base leading-relaxed text-slate-500">{current.description}</p>
              <ul className="mt-6 space-y-3">
                {["Real-time sync", "Role-based access", "Mobile friendly", "Export & reports"].map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-600">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
