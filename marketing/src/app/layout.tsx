import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { siteConfig } from "@/lib/config";
import "./globals.css";

/** Thrillophilia uses a clean Inter-like geometric sans */
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "India Holiday Destination | Holiday Packages & Himalayan Treks",
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "India Holiday Destination",
    "India Holiday Destinations",
    "IHD treks",
    "Himalayan treks",
    "Himachal holiday packages",
    "McLeodganj Triund",
    "Kheerganga trek",
    "Kareri Lake trek",
  ],
  alternates: {
    canonical: siteConfig.url,
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "India Holiday Destination",
    description: siteConfig.tagline,
    url: siteConfig.url,
    siteName: "India Holiday Destination",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "India Holiday Destination",
    description: siteConfig.tagline,
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TravelAgency",
      name: "India Holiday Destination",
      alternateName: ["India Holiday Destinations", "IHD"],
      url: siteConfig.url,
      telephone: siteConfig.contactPhone,
      email: siteConfig.contactEmail,
      image: `${siteConfig.url}/logo.png`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Delhi NCR",
        addressCountry: "IN",
      },
      sameAs: [siteConfig.treksUrl],
    },
    {
      "@type": "WebSite",
      name: "India Holiday Destination",
      url: siteConfig.url,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteConfig.url}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.className} ${sans.variable} min-h-screen bg-white text-[var(--th-ink)] antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
