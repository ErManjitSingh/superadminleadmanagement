const crmBase = (process.env.NEXT_PUBLIC_CRM_URL || "").replace(/\/$/, "");
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");

export const siteConfig = {
  name: "UNO Travel CRM",
  shortName: "Travel CRM",
  tagline: "The Complete AI-Powered Travel CRM for Modern Travel Companies",
  description:
    "Manage leads, follow-ups, quotations, bookings, operations, attendance, WhatsApp, branches and teams from one modern platform built for travel companies.",
  url: "https://indiaholidaydestination.com",
  crmBase,
  crmLogin: `${crmBase}/login`,
  crmSignup: `${crmBase}/signup`,
  crmDashboard: `${crmBase}/admin/dashboard`,
  signup: "/signup",
  superAdmin: process.env.NEXT_PUBLIC_SUPERADMIN_URL || "https://admin.indiaholidaydestination.com/admin/login",
  apiUrl: apiBase,
  links: {
    features: "#features",
    modules: "#modules",
    pricing: "#pricing",
    testimonials: "#testimonials",
    faq: "#faq",
    contact: "#contact",
  },
};
