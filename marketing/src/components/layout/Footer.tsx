import Link from "next/link";
import { siteConfig } from "@/lib/config";

const footerLinks = {
  Explore: [
    { label: "Packages", href: "#packages" },
    { label: "Destinations", href: "#destinations" },
    { label: "Why Us", href: "#why-us" },
  ],
  Support: [
    { label: "FAQs", href: "#faq" },
    { label: "WhatsApp", href: siteConfig.whatsapp },
    { label: "Email", href: `mailto:${siteConfig.contactEmail}` },
  ],
};

export function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-[var(--ink)] py-12 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="font-display text-lg font-bold">
              India Holiday Destination
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/50">
              Handpicked holiday packages across India — beaches, mountains, heritage and islands.
            </p>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="mt-3 block text-sm text-white/50 hover:text-white"
            >
              {siteConfig.contactEmail}
            </a>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-3 text-sm font-bold">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/50 hover:text-[var(--coral)]"
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

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 India Holiday Destination</p>
          <a href={siteConfig.crmLogin} className="hover:text-white">
            Team CRM Login →
          </a>
        </div>
      </div>
    </footer>
  );
}
