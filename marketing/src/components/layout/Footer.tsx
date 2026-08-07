"use client";

import Link from "next/link";
import { Compass, Heart } from "lucide-react";
import { siteConfig } from "@/lib/config";

const footerLinks = {
  Explore: [
    { label: "Packages", href: "#packages" },
    { label: "Destinations", href: "#destinations" },
    { label: "Why Us", href: "#why-us" },
    { label: "How It Works", href: "#how-it-works" },
  ],
  Support: [
    { label: "FAQs", href: "#faq" },
    { label: "Contact", href: "#contact" },
    { label: "WhatsApp", href: siteConfig.whatsapp },
    { label: "Email Us", href: `mailto:${siteConfig.contactEmail}` },
  ],
  Company: [
    { label: "About", href: "#why-us" },
    { label: "Traveller Stories", href: "#testimonials" },
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-[var(--ink)] pt-16 pb-8 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--coral)]">
                <Compass className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold">India Holiday Destination</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
              Handpicked holiday packages across India — beaches, mountains, heritage cities and islands.
            </p>
            <div className="mt-5 space-y-1.5 text-sm text-white/55">
              <a href={`mailto:${siteConfig.contactEmail}`} className="block hover:text-white">
                {siteConfig.contactEmail}
              </a>
              <a href={`tel:${siteConfig.contactPhone.replace(/\s/g, "")}`} className="block hover:text-white">
                {siteConfig.contactPhone}
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-bold text-white">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-[var(--coral)]"
                      {...(link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/40">
            © 2026 India Holiday Destination. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-sm text-white/40">
            Made with <Heart className="h-3.5 w-3.5 fill-[var(--coral)] text-[var(--coral)]" /> in India
          </p>
          <a
            href={siteConfig.crmLogin}
            className="text-sm text-white/40 transition-colors hover:text-white"
          >
            Team CRM Login →
          </a>
        </div>
      </div>
    </footer>
  );
}
