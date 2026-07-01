import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — AI-Powered Travel Business Platform`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "travel CRM",
    "travel agency software",
    "lead management",
    "quotation builder",
    "booking management",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} ${displayFont.variable} min-h-screen antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
