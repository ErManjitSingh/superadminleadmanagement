"use client";

import Link from "next/link";
import { Plane, Heart } from "lucide-react";
import { siteConfig } from "@/lib/config";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Modules", href: "#modules" },
    { label: "Pricing", href: "#pricing" },
    { label: "Integrations", href: "#features" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#contact" },
  ],
  Support: [
    { label: "Help Center", href: "#faq" },
    { label: "Documentation", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer id="contact" className="section-dark border-t border-white/10 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-purple">
                <Plane className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-white">Travel CRM</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              The complete AI-powered travel CRM for modern travel companies.
            </p>
            <div className="mt-5 flex gap-3">
              {["f", "in", "𝕏", "ig"].map((s) => (
                <a key={s} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-xs font-bold text-white/60 hover:border-violet-500/50 hover:text-white">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-bold text-white">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-white/50 transition-colors hover:text-violet-400">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-2">
            <h4 className="mb-4 text-sm font-bold text-white">Subscribe to our newsletter</h4>
            <p className="mb-4 text-sm text-white/50">Get product updates and travel industry tips.</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none"
              />
              <button type="submit" className="btn-primary shrink-0 !py-2.5">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Travel CRM. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-sm text-white/40">
            Made with <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> in India
          </p>
          <div className="flex gap-5 text-sm text-white/40">
            <a href={siteConfig.crmLogin} className="hover:text-violet-400">Login</a>
            <a href={siteConfig.superAdmin} className="hover:text-violet-400">Super Admin</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
