import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { navLinks } from "@/lib/data";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--th-border)] bg-white">
      <div className="th-container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--th-orange)] text-sm font-extrabold text-white">
              IHD
            </span>
            <span className="hidden text-[15px] font-extrabold tracking-tight text-[var(--th-ink)] sm:block">
              India Holiday Destination
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--th-ink)]/80 transition hover:bg-black/[0.04] hover:text-[var(--th-ink)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden rounded-md border border-[var(--th-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--th-muted)] sm:inline">
            INR ₹
          </span>
          <a
            href={siteConfig.crmLogin}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--th-ink)]/80 hover:text-[var(--th-orange)]"
          >
            Login
          </a>
          <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="th-btn !py-2">
            Enquire
          </a>

          <details className="relative lg:hidden">
            <summary className="list-none cursor-pointer rounded-lg border border-[var(--th-border)] px-3 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--th-border)] bg-white p-2 shadow-xl">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/[0.04]"
                >
                  {link.label}
                </a>
              ))}
              <a href={siteConfig.crmLogin} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/[0.04]">
                CRM Login
              </a>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
