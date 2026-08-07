import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
      <body className={`${body.className} ${display.variable} ${body.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
