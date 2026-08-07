const crmBase = (process.env.NEXT_PUBLIC_CRM_URL || "/app").replace(/\/$/, "");
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");

export const siteConfig = {
  name: "India Holiday Destination",
  shortName: "IHD",
  tagline: "Curated holiday packages across India — beaches, mountains, heritage & islands",
  description:
    "Discover handpicked holiday packages across India. From Goa beaches to Himalayan escapes, Kerala backwaters to Rajasthan forts — plan your perfect trip with India Holiday Destination.",
  url: "https://indiaholidaydestination.com",
  crmBase,
  crmLogin: `${crmBase}/login`,
  crmSignup: `${crmBase}/signup`,
  crmDashboard: `${crmBase}/admin/dashboard`,
  signup: "/signup",
  superAdmin: process.env.NEXT_PUBLIC_SUPERADMIN_URL || "https://admin.indiaholidaydestination.com/admin/login",
  apiUrl: apiBase,
  contactEmail: "sales@indiaholidaydestination.com",
  contactPhone: "+91 98765 43210",
  whatsapp: "https://wa.me/919876543210",
  links: {
    packages: "#packages",
    destinations: "#destinations",
    whyUs: "#why-us",
    howItWorks: "#how-it-works",
    testimonials: "#testimonials",
    contact: "#contact",
  },
};
