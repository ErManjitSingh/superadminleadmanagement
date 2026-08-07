import Link from "next/link";
import { siteConfig } from "@/lib/config";

const columns = {
  Explore: [
    { label: "Packages", href: "#packages" },
    { label: "Destinations", href: "#destinations" },
    { label: "Why us", href: "#why-us" },
    { label: "How it works", href: "#how-it-works" },
  ],
  Support: [
    { label: "FAQs", href: "#faq" },
    { label: "WhatsApp", href: siteConfig.whatsapp },
    { label: "Email us", href: `mailto:${siteConfig.contactEmail}` },
  ],
};

export function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-[var(--ink)] pt-16 pb-8 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="font-display text-xl font-bold tracking-tight">
              India Holiday Destination
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              Handpicked holiday packages across India — beaches, mountains, heritage cities and islands.
            </p>
            <div className="mt-5 space-y-1 text-sm text-white/50">
              <a href={`mailto:${siteConfig.contactEmail}`} className="block hover:text-white">
                {siteConfig.contactEmail}
              </a>
              <a href={`tel:${siteConfig.contactPhone.replace(/\s/g, "")}`} className="block hover:text-white">
                {siteConfig.contactPhone}
              </a>
            </div>
          </div>

          {Object.entries(columns).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-bold">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/50 transition hover:text-[var(--coral)]"
                      {...(link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-4 text-sm font-bold">Team access</h4>
            <a
              href={siteConfig.crmLogin}
              className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
            >
              CRM Login →
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-7 text-sm text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 India Holiday Destination. All rights reserved.</p>
          <p>Made with care in India</p>
        </div>
      </div>
    </footer>
  );
}
