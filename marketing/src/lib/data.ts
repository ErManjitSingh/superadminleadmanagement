import {
  BarChart3,
  Bell,
  Building2,
  Bus,
  ClipboardList,
  Clock,
  FileText,
  Hotel,
  Mail,
  MessageCircle,
  Shield,
  Target,
  TrendingUp,
  Truck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

export const navLinks = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "Modules", href: "#modules" },
  { label: "Solutions", href: "#comparison" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Help", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export const heroStats = [
  { value: "100+", label: "Travel Companies" },
  { value: "10,00,000+", label: "Leads Managed" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

export const trustLogos = [
  "Thomas Cook",
  "SOTC",
  "MakeMyTrip",
  "Yatra",
  "Airbnb",
  "Expedia",
  "Cleartrip",
  "Goibibo",
];

export const featureCards: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "Lead Management", description: "Capture, assign and track every travel inquiry in one place.", icon: Target },
  { title: "Quotation Builder", description: "Create professional travel quotes with hotels, transport and margins.", icon: FileText },
  { title: "Operations Management", description: "Coordinate hotels, cabs, activities and vendors seamlessly.", icon: ClipboardList },
  { title: "Hotel Management", description: "Maintain a searchable hotel database with rates and contacts.", icon: Hotel },
  { title: "Transport Management", description: "Manage fleet, drivers and transfer schedules effortlessly.", icon: Bus },
  { title: "Vendor Management", description: "Build trusted vendor relationships with full performance history.", icon: Truck },
  { title: "Attendance", description: "Track team presence and working hours across branches.", icon: UserCheck },
  { title: "WhatsApp Integration", description: "Native WhatsApp inbox with lead capture and templates.", icon: MessageCircle },
  { title: "Email Integration", description: "Email templates, tracking and activity logs built in.", icon: Mail },
  { title: "Follow-up Automation", description: "Never miss a follow-up with smart reminders and SLAs.", icon: Clock },
  { title: "Reminder Center", description: "Central hub for all tasks, calls and pending actions.", icon: Bell },
  { title: "Analytics", description: "Real-time dashboards with conversion and revenue insights.", icon: TrendingUp },
  { title: "Reports", description: "Exportable sales, ops and team performance reports.", icon: BarChart3 },
  { title: "Role Management", description: "Granular permissions for every team member and branch.", icon: Shield },
  { title: "Branch Management", description: "Manage multiple offices with branch-scoped data.", icon: Building2 },
];

export const moduleTabs = [
  { id: "leads", title: "Lead Management", description: "Capture leads from WhatsApp, email, website and walk-ins. Auto-assign to the right executive instantly." },
  { id: "quotations", title: "Quotation Management", description: "Build beautiful PDF quotations with hotels, transport and activities. Track approvals and conversions." },
  { id: "operations", title: "Operations Management", description: "Execute trips flawlessly with hotel, cab and vendor coordination from one hub." },
  { id: "bookings", title: "Booking Management", description: "Manage the full booking lifecycle — payments, vouchers and customer communication." },
  { id: "reports", title: "Reports & Analytics", description: "Data-driven decisions with sales, team and operations reports in real time." },
];

export const comparisonColumns = [
  { key: "traditional", label: "Traditional", negative: true },
  { key: "excel", label: "Excel / Manual", negative: true },
  { key: "whatsapp", label: "WhatsApp / Calls", negative: true },
  { key: "crm", label: "Travel CRM", negative: false },
];

export const comparisonRows = [
  { feature: "Lead Tracking", traditional: "Difficult", excel: "Manual", whatsapp: "Messy", crm: "Centralized" },
  { feature: "Follow-ups", traditional: "Missed", excel: "Forgotten", whatsapp: "Scattered", crm: "Automated" },
  { feature: "Quotations", traditional: "Slow", excel: "Error-prone", whatsapp: "Unprofessional", crm: "Fast & Branded" },
  { feature: "Team Management", traditional: "Chaotic", excel: "No visibility", whatsapp: "No tracking", crm: "Organized" },
  { feature: "Reports", traditional: "None", excel: "Manual", whatsapp: "None", crm: "Real-time" },
  { feature: "Scalability", traditional: "Limited", excel: "Breaks", whatsapp: "Breaks", crm: "Unlimited" },
];

export const switchBenefits = [
  "Easy to use — no training required",
  "Reduce errors and double data entry",
  "Improve team efficiency by 40%",
  "Scale from 1 to 100+ users",
  "24/7 cloud access from anywhere",
  "Dedicated support & onboarding",
];

export const statsBar = [
  { value: "100+", label: "Travel Companies" },
  { value: "10,00,000+", label: "Leads Managed" },
  { value: "50,00,000+", label: "Follow-ups Done" },
  { value: "1,00,000+", label: "Quotations Created" },
  { value: "25,000+", label: "Bookings Confirmed" },
];

export const pricingPlans = [
  {
    name: "Starter",
    slug: "starter",
    monthly: 29,
    yearly: 23,
    description: "Perfect for small travel agencies getting started.",
    features: ["Up to 5 users", "Lead management", "Quotation builder", "WhatsApp integration", "Basic reports", "Email support"],
    popular: false,
  },
  {
    name: "Professional",
    slug: "professional",
    monthly: 79,
    yearly: 63,
    description: "For growing teams that need full operations control.",
    features: ["Up to 25 users", "Everything in Starter", "Operations module", "Hotel & transport DB", "Attendance tracking", "Advanced analytics", "Priority support"],
    popular: true,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    monthly: 149,
    yearly: 119,
    description: "For large travel companies with multiple branches.",
    features: ["Unlimited users", "Everything in Professional", "Multi-branch management", "Custom roles", "Audit logs", "API access", "Dedicated manager", "24/7 phone support"],
    popular: false,
  },
];

export const testimonials = [
  {
    quote: "We replaced 12 Excel sheets with Travel CRM. Our team closes 40% more bookings because nothing falls through the cracks anymore.",
    author: "Rajesh Mehta",
    role: "CEO, Golden Triangle Tours",
    avatar: "RM",
    rating: 5,
  },
  {
    quote: "The quotation builder alone saved us 3 hours per day. Clients love the professional PDFs and our conversion rate has doubled.",
    author: "Priya Sharma",
    role: "Sales Director, Himalaya Voyages",
    avatar: "PS",
    rating: 5,
  },
  {
    quote: "Managing 4 branches was chaos before. Now I see everything — leads, operations, attendance — from one dashboard.",
    author: "Amit Patel",
    role: "Operations Head, Coastal Escapes",
    avatar: "AP",
    rating: 5,
  },
];

export const faqs = [
  { q: "What is Travel CRM?", a: "Travel CRM is an all-in-one platform built specifically for travel companies — covering leads, quotations, bookings, operations, WhatsApp, email and team management." },
  { q: "Is there a free trial?", a: "Yes! Start a 14-day free trial with full access. No credit card required." },
  { q: "Can I migrate from Excel?", a: "Absolutely. We offer data import assistance and onboarding support to get you set up quickly." },
  { q: "Is my data secure?", a: "Enterprise-grade encryption, role-based access, audit logs and per-company data isolation." },
  { q: "Does it support multiple branches?", a: "Yes. Professional and Enterprise plans include multi-branch management with consolidated reporting." },
  { q: "Do you offer training?", a: "All plans include email support. Professional gets priority support and Enterprise includes a dedicated account manager." },
];

export const heroFloatingCards = [
  { label: "New Lead", sub: "Goa Package — Rajesh K.", color: "border-violet-500/30 bg-violet-500/10" },
  { label: "Booking Confirmed", sub: "Himachal — 6 pax", color: "border-emerald-500/30 bg-emerald-500/10" },
  { label: "Payment Received", sub: "₹45,000 advance", color: "border-blue-500/30 bg-blue-500/10" },
  { label: "Hot Lead", sub: "Kerala Honeymoon", color: "border-rose-500/30 bg-rose-500/10" },
];
