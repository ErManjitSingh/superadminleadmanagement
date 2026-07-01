import {
  BarChart3,
  Bell,
  Building2,
  Bus,
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  Globe,
  Hotel,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  Plane,
  Search,
  Shield,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Modules", href: "#modules" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export const trustStats = [
  { value: "10,000+", label: "Leads Managed" },
  { value: "100+", label: "Travel Companies" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

export const trustLogos = [
  "Himalaya Voyages",
  "Golden Triangle Tours",
  "Coastal Escapes",
  "Royal Heritage",
  "Summit Adventures",
  "Desert Trails",
  "Island Getaways",
  "Alpine Journeys",
];

export const whyFeatures: { title: string; icon: LucideIcon; color: string }[] = [
  { title: "Lead Management", icon: Target, color: "from-blue-500 to-cyan-400" },
  { title: "Quotation Builder", icon: FileText, color: "from-violet-500 to-purple-400" },
  { title: "Operations Management", icon: ClipboardList, color: "from-emerald-500 to-teal-400" },
  { title: "Hotel Management", icon: Hotel, color: "from-amber-500 to-orange-400" },
  { title: "Transport Management", icon: Bus, color: "from-rose-500 to-pink-400" },
  { title: "Vendor Management", icon: Truck, color: "from-indigo-500 to-blue-400" },
  { title: "Attendance", icon: UserCheck, color: "from-green-500 to-emerald-400" },
  { title: "WhatsApp Integration", icon: MessageCircle, color: "from-green-600 to-lime-400" },
  { title: "Email Integration", icon: Mail, color: "from-sky-500 to-blue-400" },
  { title: "Follow-up Automation", icon: Clock, color: "from-fuchsia-500 to-violet-400" },
  { title: "Reminder Center", icon: Bell, color: "from-yellow-500 to-amber-400" },
  { title: "Analytics", icon: TrendingUp, color: "from-cyan-500 to-blue-400" },
  { title: "Reports", icon: BarChart3, color: "from-purple-500 to-indigo-400" },
  { title: "Role Management", icon: Shield, color: "from-slate-500 to-zinc-400" },
  { title: "Branch Management", icon: Building2, color: "from-blue-600 to-indigo-400" },
  { title: "Notifications", icon: Bell, color: "from-red-500 to-rose-400" },
  { title: "Audit Logs", icon: ClipboardList, color: "from-neutral-500 to-stone-400" },
  { title: "Calendar", icon: Calendar, color: "from-teal-500 to-cyan-400" },
  { title: "Task Management", icon: ClipboardList, color: "from-orange-500 to-red-400" },
];

export const modules = [
  {
    id: "leads",
    title: "Lead Management",
    subtitle: "Capture, assign & convert every inquiry",
    description:
      "Centralize inquiries from WhatsApp, email, website and walk-ins. Auto-assign leads to the right executive, track every touchpoint, and never miss a follow-up.",
    benefits: ["Auto lead assignment", "Lead scoring & timeline", "Multi-source capture", "SLA monitoring"],
    gradient: "from-blue-600/20 via-cyan-500/10 to-transparent",
    accent: "text-cyan-400",
  },
  {
    id: "quotations",
    title: "Quotation Management",
    subtitle: "Beautiful quotes in minutes",
    description:
      "Build professional travel quotations with hotels, transport, activities and margins. Send PDFs, track approvals, and convert quotes to bookings seamlessly.",
    benefits: ["Drag-and-drop builder", "PDF export", "Approval workflows", "Version history"],
    gradient: "from-violet-600/20 via-purple-500/10 to-transparent",
    accent: "text-violet-400",
  },
  {
    id: "operations",
    title: "Operations",
    subtitle: "Execute trips flawlessly",
    description:
      "Coordinate hotels, cabs, activities and vendors from one operations hub. Track trip status, manage documents, and keep every stakeholder aligned.",
    benefits: ["Trip tracker", "Task management", "Vendor coordination", "Document vault"],
    gradient: "from-emerald-600/20 via-teal-500/10 to-transparent",
    accent: "text-emerald-400",
  },
  {
    id: "bookings",
    title: "Bookings",
    subtitle: "From quote to confirmed trip",
    description:
      "Manage the entire booking lifecycle — payments, vouchers, itineraries and customer communication — without switching between spreadsheets.",
    benefits: ["Booking workflow", "Payment tracking", "Voucher generation", "Customer timeline"],
    gradient: "from-amber-600/20 via-orange-500/10 to-transparent",
    accent: "text-amber-400",
  },
  {
    id: "hotels",
    title: "Hotel Management",
    subtitle: "Your hotel database, organized",
    description:
      "Maintain a searchable hotel database with rates, contacts and preferences. Attach hotels to quotations and operations in one click.",
    benefits: ["Rate management", "Quick search", "Category filters", "Vendor linking"],
    gradient: "from-rose-600/20 via-pink-500/10 to-transparent",
    accent: "text-rose-400",
  },
  {
    id: "transport",
    title: "Transport",
    subtitle: "Cabs, coaches & transfers",
    description:
      "Manage fleet, drivers and transfer schedules. Assign vehicles to trips and track transport costs against quotations.",
    benefits: ["Fleet database", "Driver assignment", "Route planning", "Cost tracking"],
    gradient: "from-indigo-600/20 via-blue-500/10 to-transparent",
    accent: "text-indigo-400",
  },
  {
    id: "vendors",
    title: "Vendor Management",
    subtitle: "Trusted partners at your fingertips",
    description:
      "Build and maintain vendor relationships with contact details, payment terms and performance history — all searchable and filterable.",
    benefits: ["Vendor database", "Payment terms", "Performance tracking", "Quick attach"],
    gradient: "from-slate-600/20 via-zinc-500/10 to-transparent",
    accent: "text-slate-300",
  },
  {
    id: "attendance",
    title: "Attendance",
    subtitle: "Track your team's presence",
    description:
      "Monitor employee attendance, working hours and branch-wise presence. Integrate attendance data with team performance reports.",
    benefits: ["Check-in/out", "Branch-wise view", "Reports export", "Manager dashboard"],
    gradient: "from-green-600/20 via-lime-500/10 to-transparent",
    accent: "text-green-400",
  },
  {
    id: "finance",
    title: "Finance",
    subtitle: "Payments & revenue visibility",
    description:
      "Track payments, outstanding balances and revenue per booking. Get financial clarity without a separate accounting tool.",
    benefits: ["Payment tracking", "Outstanding alerts", "Revenue reports", "Receipt management"],
    gradient: "from-yellow-600/20 via-amber-500/10 to-transparent",
    accent: "text-yellow-400",
  },
  {
    id: "reports",
    title: "Reports",
    subtitle: "Data-driven decisions",
    description:
      "Generate sales, operations and team performance reports. Export data and share insights with leadership in real time.",
    benefits: ["Sales reports", "Team performance", "Custom date ranges", "Export to Excel"],
    gradient: "from-purple-600/20 via-fuchsia-500/10 to-transparent",
    accent: "text-purple-400",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    subtitle: "Your business at a glance",
    description:
      "Role-based dashboards for admins, sales managers and operations teams. See KPIs, pending tasks and live notifications instantly.",
    benefits: ["Role-based views", "Live KPIs", "Quick actions", "Notification center"],
    gradient: "from-cyan-600/20 via-sky-500/10 to-transparent",
    accent: "text-cyan-400",
  },
];

export const featureGrid: { title: string; icon: LucideIcon; description: string }[] = [
  { title: "Auto Lead Assignment", icon: Zap, description: "Round-robin & rule-based routing" },
  { title: "Multi Branch", icon: Building2, description: "Manage offices across cities" },
  { title: "AI Ready", icon: Sparkles, description: "Built for intelligent automation" },
  { title: "WhatsApp", icon: MessageCircle, description: "Native WhatsApp inbox" },
  { title: "Email", icon: Mail, description: "Templates & activity tracking" },
  { title: "Live Notifications", icon: Bell, description: "Real-time alerts everywhere" },
  { title: "Attendance", icon: UserCheck, description: "Team presence tracking" },
  { title: "Employee Tracking", icon: Users, description: "Performance & activity logs" },
  { title: "Quotation Generator", icon: FileText, description: "Professional PDF quotes" },
  { title: "Travel Itinerary", icon: MapPin, description: "Day-wise trip planning" },
  { title: "Booking Workflow", icon: ClipboardList, description: "Quote to trip pipeline" },
  { title: "Vendor Database", icon: Truck, description: "Centralized vendor records" },
  { title: "Hotel Database", icon: Hotel, description: "Rates, contacts & categories" },
  { title: "Transport Management", icon: Bus, description: "Fleet & driver scheduling" },
  { title: "Customer Timeline", icon: Clock, description: "Full interaction history" },
  { title: "Role Based Access", icon: Shield, description: "Granular permissions" },
  { title: "Audit Logs", icon: ClipboardList, description: "Every action recorded" },
  { title: "Lead Analytics", icon: BarChart3, description: "Conversion insights" },
  { title: "Lead Scoring", icon: Target, description: "Prioritize hot prospects" },
  { title: "Lead Timeline", icon: TrendingUp, description: "Visual activity feed" },
  { title: "Payment Tracking", icon: Wallet, description: "Collections & outstanding" },
  { title: "Voucher Generator", icon: FileText, description: "Branded travel vouchers" },
  { title: "Document Upload", icon: FileText, description: "Secure file storage" },
  { title: "Dashboard", icon: LayoutDashboard, description: "Role-based home screens" },
  { title: "Reports", icon: BarChart3, description: "Exportable business reports" },
  { title: "Dark Mode", icon: Moon, description: "Easy on the eyes" },
  { title: "Fast Search", icon: Search, description: "Find anything instantly" },
  { title: "Advanced Filters", icon: Filter, description: "Slice data your way" },
  { title: "Mobile Responsive", icon: Smartphone, description: "Works on every device" },
  { title: "Secure Login", icon: Lock, description: "Enterprise-grade security" },
  { title: "Flight Management", icon: Plane, description: "Air ticket coordination" },
  { title: "Global Ready", icon: Globe, description: "Multi-country operations" },
  { title: "Phone Integration", icon: Phone, description: "Call notes & logging" },
];

export const workflowSteps = [
  "Lead",
  "Follow-up",
  "Quotation",
  "Payment",
  "Booking",
  "Operations",
  "Trip",
  "Completed",
];

export const comparisonRows = [
  { feature: "Lead auto-assignment", excel: false, crm: true },
  { feature: "WhatsApp integration", excel: false, crm: true },
  { feature: "Quotation builder", excel: false, crm: true },
  { feature: "Multi-branch support", excel: false, crm: true },
  { feature: "Role-based access", excel: false, crm: true },
  { feature: "Real-time notifications", excel: false, crm: true },
  { feature: "Audit logs", excel: false, crm: true },
  { feature: "Attendance tracking", excel: false, crm: true },
  { feature: "Operations workflow", excel: false, crm: true },
  { feature: "Team collaboration", excel: false, crm: true },
  { feature: "Mobile access", excel: false, crm: true },
  { feature: "Data security", excel: false, crm: true },
  { feature: "Manual data entry", excel: true, crm: false },
  { feature: "Version conflicts", excel: true, crm: false },
  { feature: "No automation", excel: true, crm: false },
];

export const pricingPlans = [
  {
    name: "Starter",
    slug: "starter",
    monthly: 49,
    yearly: 39,
    description: "Perfect for small travel agencies getting started.",
    features: [
      "Up to 5 users",
      "Lead management",
      "Quotation builder",
      "WhatsApp integration",
      "Basic reports",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Professional",
    slug: "professional",
    monthly: 99,
    yearly: 79,
    description: "For growing teams that need full operations control.",
    features: [
      "Up to 25 users",
      "Everything in Starter",
      "Operations module",
      "Hotel & transport DB",
      "Attendance tracking",
      "Advanced analytics",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    monthly: 199,
    yearly: 159,
    description: "For large travel companies with multiple branches.",
    features: [
      "Unlimited users",
      "Everything in Professional",
      "Multi-branch management",
      "Custom roles & permissions",
      "Audit logs",
      "API access",
      "Dedicated account manager",
      "24/7 phone support",
    ],
    popular: false,
  },
];

export const testimonials = [
  {
    quote:
      "We replaced 12 Excel sheets with Travel CRM. Our team closes 40% more bookings because nothing falls through the cracks anymore.",
    author: "Rajesh Mehta",
    role: "CEO",
    company: "Golden Triangle Tours",
    avatar: "RM",
  },
  {
    quote:
      "The quotation builder alone saved us 3 hours per day. Clients love the professional PDFs and our conversion rate has doubled.",
    author: "Priya Sharma",
    role: "Sales Director",
    company: "Himalaya Voyages",
    avatar: "PS",
  },
  {
    quote:
      "Managing 4 branches was chaos before. Now I see everything — leads, operations, attendance — from one dashboard.",
    author: "Amit Patel",
    role: "Operations Head",
    company: "Coastal Escapes",
    avatar: "AP",
  },
  {
    quote:
      "WhatsApp integration changed our business. Every inquiry is tracked, assigned and followed up automatically.",
    author: "Sneha Reddy",
    role: "Founder",
    company: "Island Getaways",
    avatar: "SR",
  },
  {
    quote:
      "The best investment we made this year. Support is incredible and the platform keeps getting better every month.",
    author: "Vikram Singh",
    role: "Managing Director",
    company: "Royal Heritage Travels",
    avatar: "VS",
  },
];

export const faqs = [
  {
    q: "What is Travel CRM?",
    a: "Travel CRM is an all-in-one platform built specifically for travel companies. It covers lead management, quotations, bookings, operations, attendance, WhatsApp, email and team management in a single modern interface.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! Start a free 14-day trial with full access to all features. No credit card required. Create your company workspace in under 2 minutes.",
  },
  {
    q: "Can I migrate from Excel?",
    a: "Absolutely. Most of our customers migrate from spreadsheets. We offer data import assistance and our onboarding team helps you set up branches, users and workflows quickly.",
  },
  {
    q: "Does it support multiple branches?",
    a: "Yes. Professional and Enterprise plans include multi-branch management with branch-scoped data, role-based access and consolidated reporting across all locations.",
  },
  {
    q: "Is WhatsApp integration included?",
    a: "WhatsApp integration is included in all plans. Manage conversations, assign leads from WhatsApp messages and send templates directly from the CRM.",
  },
  {
    q: "How secure is my data?",
    a: "We use enterprise-grade encryption, role-based access control, audit logs and regular backups. Your data is isolated per company with strict tenant separation.",
  },
  {
    q: "Can I customize roles and permissions?",
    a: "Yes. Create custom roles with granular permissions for sales executives, team leaders, operations managers and admins. Control who sees what across every module.",
  },
  {
    q: "Do you offer training and support?",
    a: "All plans include email support. Professional plans get priority support and Enterprise customers receive a dedicated account manager plus 24/7 phone support.",
  },
];

export const heroFloatingCards = [
  { label: "New Lead", sub: "Rajesh K. — Goa Package", color: "border-cyan-500/30 bg-cyan-500/10" },
  { label: "Quotation Generated", sub: "₹1,24,500 — Kerala", color: "border-violet-500/30 bg-violet-500/10" },
  { label: "Booking Confirmed", sub: "Himachal — 6 pax", color: "border-emerald-500/30 bg-emerald-500/10" },
  { label: "Payment Received", sub: "₹45,000 advance", color: "border-amber-500/30 bg-amber-500/10" },
  { label: "Upcoming Follow-up", sub: "Today, 3:00 PM", color: "border-rose-500/30 bg-rose-500/10" },
  { label: "Live Notifications", sub: "3 new messages", color: "border-blue-500/30 bg-blue-500/10" },
];
