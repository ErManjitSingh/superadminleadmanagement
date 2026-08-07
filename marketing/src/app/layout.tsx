import type { Metadata } from "next";
import { Outfit, Figtree } from "next/font/google";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const displayFont = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const bodyFont = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Holiday Packages Across India`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "India holiday packages",
    "Goa tour package",
    "Kerala honeymoon",
    "Himachal packages",
    "Rajasthan tour",
    "India Holiday Destination",
  ],
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.tagline,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.className} ${displayFont.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
