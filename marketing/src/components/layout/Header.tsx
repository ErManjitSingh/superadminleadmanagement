import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { navLinks } from "@/lib/data";

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4 rounded-full border border-white/15 bg-[var(--ink)]/70 px-4 shadow-[0_10px_40px_-16px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:px-5">
          <Link href="/" className="font-display text-[15px] font-bold tracking-tight text-white sm:text-base">
            India Holiday Destination
          </Link>

          <nav className="hidden items-center gap-6 xl:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-white/70 transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={siteConfig.crmLogin}
              className="hidden rounded-full px-3 py-1.5 text-[13px] font-medium text-white/75 transition hover:text-white sm:inline"
            >
              CRM Login
            </a>
            <a
              href={siteConfig.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full bg-[var(--coral)] px-4 py-2 text-[13px] font-semibold text-white sm:inline-flex"
            >
              Plan my trip
            </a>

            <details className="relative xl:hidden">
              <summary className="list-none cursor-pointer rounded-full border border-white/20 px-3 py-1.5 text-[13px] text-white [&::-webkit-details-marker]:hidden">
                Menu
              </summary>
              <div className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[var(--ink)] p-2 shadow-2xl">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block rounded-xl px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
                <a href={siteConfig.crmLogin} className="block rounded-xl px-3 py-2.5 text-sm text-white/75 hover:bg-white/5">
                  CRM Login
                </a>
                <a
                  href={siteConfig.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block rounded-xl bg-[var(--coral)] px-3 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Plan my trip
                </a>
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}
