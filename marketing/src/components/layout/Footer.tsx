import Link from "next/link";
import { Plane, Mail, Share2, Globe, MessageCircle } from "lucide-react";
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
    <footer id="contact" className="border-t border-white/10 bg-card/50">
      <div className="section-padding mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600">
                <Plane className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">UNO Travel CRM</span>
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10 hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-semibold capitalize">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} UNO Travel CRM. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href={siteConfig.crmLogin} className="hover:text-foreground">CRM Login</a>
            <a href={siteConfig.superAdmin} className="hover:text-foreground">Super Admin</a>
            <Link href={siteConfig.signup} className="hover:text-foreground">Start Free Demo</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
