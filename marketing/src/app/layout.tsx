import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { GradientBackground } from "@/components/effects/GradientBackground";
import { CursorGlow } from "@/components/effects/CursorGlow";
import { siteConfig } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.shortName}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "travel CRM",
    "travel agency software",
    "lead management",
    "quotation builder",
    "booking management",
    "travel operations",
    "WhatsApp CRM",
  ],
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.tagline,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.tagline,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${GeistSans.className} min-h-screen antialiased`}>
        <ThemeProvider>
          <GradientBackground />
          <CursorGlow />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
