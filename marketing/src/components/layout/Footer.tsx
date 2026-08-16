import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { destinationSections } from "@/lib/data";

export function Footer() {
  return (
    <footer id="contact" className="border-t border-[var(--th-border)] bg-[var(--th-forest)] pt-12 pb-8 text-white">
      <div className="th-container">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <a href={siteConfig.url + "/"} className="inline-flex items-center" aria-label={siteConfig.name}>
              <Image
                src="/logo.png"
                alt={siteConfig.name}
                width={220}
                height={74}
                className="h-12 w-auto rounded-md bg-white object-contain p-1.5"
              />
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              India&apos;s trusted holiday packages — curated tours, clear pricing, 24×7 support.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold">Popular Packages</h4>
            <ul className="space-y-2">
              {destinationSections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-sm text-white/55 hover:text-[var(--th-orange)]">
                    {s.title} Tour Packages
                  </a>
                </li>
              ))}
              <li>
                <a href={siteConfig.treksUrl} className="text-sm text-white/55 hover:text-[var(--th-orange)]">
                  Himalayan Treks
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold">Support</h4>
            <ul className="space-y-2 text-sm text-white/55">
              <li>
                <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="hover:text-[var(--th-orange)]">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.contactEmail}`} className="hover:text-[var(--th-orange)]">
                  {siteConfig.contactEmail}
                </a>
              </li>
              <li>
                <a href={`tel:${siteConfig.contactPhone.replace(/\s/g, "")}`} className="hover:text-[var(--th-orange)]">
                  {siteConfig.contactPhone}
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[var(--th-orange)]">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold">Team</h4>
            <a
              href={siteConfig.crmLogin}
              className="inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-[var(--th-orange)] hover:text-[var(--th-orange)]"
            >
              CRM Login →
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:justify-between">
          <p>© 2026 India Holiday Destination. All rights reserved.</p>
          <p>Made in India</p>
        </div>
      </div>
    </footer>
  );
}
