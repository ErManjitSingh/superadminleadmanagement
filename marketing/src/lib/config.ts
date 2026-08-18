const crmBase = (process.env.NEXT_PUBLIC_CRM_URL || "/app").replace(/\/$/, "");
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");

export const siteConfig = {
  name: "India Holiday Destination",
  shortName: "IHD",
  tagline: "Curated holiday packages across India — beaches, mountains, heritage & islands",
  description:
    "India Holiday Destination (India Holiday Destinations) — handpicked holiday packages and Himalayan treks across India. Goa, Kerala, Rajasthan, Himachal, Ladakh and more. Call +91 89887 69444.",
  url: "https://indiaholidaydestination.com",
  treksUrl: process.env.NEXT_PUBLIC_TREKS_URL || "https://treks.indiaholidaydestination.com/",
  crmBase,
  crmLogin: `${crmBase}/login`,
  crmSignup: `${crmBase}/signup`,
  crmDashboard: `${crmBase}/admin/dashboard`,
  signup: "/signup",
  superAdmin: process.env.NEXT_PUBLIC_SUPERADMIN_URL || "https://admin.indiaholidaydestination.com/admin/login",
  apiUrl: apiBase,
  contactEmail: "sales@indiaholidaydestination.com",
  contactPhone: "+91 89887 69444",
  whatsapp: "https://wa.me/918988769444",
  links: {
    packages: "#packages",
    destinations: "#destinations",
    whyUs: "#why-us",
    howItWorks: "#how-it-works",
    testimonials: "#testimonials",
    contact: "#contact",
  },
};
