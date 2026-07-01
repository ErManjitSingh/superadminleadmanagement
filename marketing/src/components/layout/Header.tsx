"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plane } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { navLinks } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-[#0b0b14]/90 backdrop-blur-xl shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-purple shadow-lg shadow-violet-500/30">
            <Plane className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-white">Travel CRM</span>
        </Link>

        <nav className="hidden items-center gap-6 xl:flex">
          {navLinks.map((link) => (
            <a
              key={link.href + link.label}
              href={link.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a href={siteConfig.crmLogin} className="rounded-lg px-4 py-2 text-sm font-medium text-white/80 hover:text-white">
            Login
          </a>
          <a href={siteConfig.superAdmin} className="rounded-lg px-4 py-2 text-sm font-medium text-white/80 hover:text-white">
            Super Admin
          </a>
          <Link href={siteConfig.signup} className="btn-primary !py-2.5 !text-sm">
            Start Free Demo
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white lg:hidden"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-white/10 bg-[#0b0b14] lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white">
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
                <a href={siteConfig.crmLogin} className="btn-outline-light text-center">Login</a>
                <Link href={siteConfig.signup} className="btn-primary text-center">Start Free Demo</Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
