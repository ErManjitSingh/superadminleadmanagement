"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
}: FadeInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const offsets = {
    up: { y: 32 },
    down: { y: -32 },
    left: { x: 32 },
    right: { x: -32 },
    none: {},
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offsets[direction] }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
}

export function StaggerContainer({
  children,
  className,
  stagger = 0.08,
}: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={defaultVariants} className={className}>
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  badge,
  title,
  subtitle,
  className,
  align = "center",
  theme = "dark",
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  className?: string;
  align?: "center" | "left";
  theme?: "dark" | "light";
}) {
  const isLight = theme === "light";
  return (
    <FadeIn className={cn("mb-16", align === "center" && "text-center", className)}>
      {badge && (
        <span className={cn(
          "mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em]",
          isLight ? "bg-violet-50 text-violet-600" : "border border-violet-500/25 bg-violet-500/10 text-violet-400"
        )}>
          {badge}
        </span>
      )}
      <h2 className={cn(
        "font-display text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem]",
        isLight ? "text-slate-900" : "text-white"
      )}>
        {title}
      </h2>
      {subtitle && (
        <p className={cn(
          "mx-auto mt-4 max-w-2xl text-lg leading-relaxed",
          isLight ? "text-slate-500" : "text-white/60",
          align === "left" && "mx-0"
        )}>
          {subtitle}
        </p>
      )}
    </FadeIn>
  );
}
