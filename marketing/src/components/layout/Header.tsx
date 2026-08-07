import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { navLinks } from "@/lib/data";

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[var(--ink)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="font-display text-base font-bold tracking-tight text-white sm:text-lg">
          India Holiday Destination
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <a href={siteConfig.crmLogin} className="px-3 py-1.5 text-sm text-white/75 hover:text-white">
            CRM Login
          </a>
          <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="btn-primary !py-2 !text-xs">
            Plan My Trip
          </a>
        </div>

        <details className="relative lg:hidden">
          <summary className="list-none cursor-pointer rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[var(--ink)] p-3 shadow-xl">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <a href={siteConfig.crmLogin} className="mt-1 rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/5">
                CRM Login
              </a>
              <a
                href={siteConfig.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="btn-primary mt-1 text-center !py-2"
              >
                Plan My Trip
              </a>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
