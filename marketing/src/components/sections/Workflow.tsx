"use client";

import { motion } from "framer-motion";
import { SectionHeading, FadeIn } from "@/components/effects/FadeIn";
import { workflowSteps } from "@/lib/data";

export function Workflow() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Workflow"
          title="From Lead to Completed Trip"
          subtitle="A seamless pipeline that keeps every booking on track — automatically."
        />

        <FadeIn>
          <div className="relative mx-auto max-w-3xl">
            {/* Connection line */}
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-blue-500/50 via-violet-500/50 to-cyan-500/50 md:block" />

            <div className="space-y-4 md:space-y-0">
              {workflowSteps.map((step, i) => (
                <motion.div
                  key={step}
                  className="relative flex items-center gap-4 md:justify-center"
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <div
                    className={`flex w-full items-center gap-4 md:w-auto md:max-w-xs ${
                      i % 2 === 0 ? "md:mr-auto md:flex-row-reverse md:text-right" : "md:ml-auto"
                    }`}
                  >
                    <div className="glass-card flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-sm font-bold text-primary shadow-lg shadow-primary/10">
                      {i + 1}
                    </div>
                    <div className="glass-card flex-1 rounded-xl px-5 py-3 md:flex-none">
                      <p className="font-semibold">{step}</p>
                    </div>
                  </div>

                  {i < workflowSteps.length - 1 && (
                    <div className="flex justify-center py-1 md:hidden">
                      <div className="h-6 w-px bg-gradient-to-b from-primary/50 to-violet-500/50" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
