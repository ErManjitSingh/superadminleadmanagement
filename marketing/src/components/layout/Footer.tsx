import Link from "next/link";
import { Compass, Mail, Share2, Globe, MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/config";

const footerLinks = {
  company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#contact" },
  ],
  product: [
    { label: "Features", href: "#features" },
    { label: "Modules", href: "#modules" },
    { label: "Pricing", href: "#pricing" },
    { label: "Integrations", href: "#features" },
  ],
  support: [
    { label: "Documentation", href: "#" },
    { label: "Help Center", href: "#faq" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer id="contact" className="border-t border-white/[0.06] bg-white/[0.02]">
      <div className="section-padding mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500">
                <Compass className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold">Travel CRM</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {siteConfig.tagline}. Built for travel companies that want to grow faster with less chaos.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { icon: Share2, href: "#" },
                { icon: Globe, href: "#" },
                { icon: MessageCircle, href: "#" },
                { icon: Mail, href: "mailto:support@travelcrm.com" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 font-display text-sm font-bold capitalize">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-emerald-400"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Travel CRM. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href={siteConfig.crmLogin} className="hover:text-emerald-400">CRM Login</a>
            <a href={siteConfig.superAdmin} className="hover:text-emerald-400">Super Admin</a>
            <Link href={siteConfig.signup} className="hover:text-emerald-400">Start Free Demo</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
