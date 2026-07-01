"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plane, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { navLinks } from "@/lib/data";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        scrolled
          ? "border-b border-white/10 bg-background/80 backdrop-blur-2xl shadow-lg shadow-black/5"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
            <Plane className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            UNO <span className="gradient-text">Travel CRM</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button variant="ghost" size="sm" asChild>
            <a href={siteConfig.crmLogin}>Login</a>
          </Button>
          <Button variant="gradient" size="sm" asChild>
            <Link href={siteConfig.signup}>Start Free Demo</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-white/10 bg-background/95 backdrop-blur-2xl lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
                <Button variant="outline" asChild>
                  <a href={siteConfig.crmLogin}>Login</a>
                </Button>
                <Button variant="gradient" asChild>
                  <Link href={siteConfig.signup}>Start Free Demo</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
