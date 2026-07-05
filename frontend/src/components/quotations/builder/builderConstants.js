import {
  Package,
  Bot,
  Building2,
  Car,
  IndianRupee,
  Eye,
} from 'lucide-react';

/** Simplified 6-step quotation builder — matches product UI */
export const BUILDER_STEPS = [
  { id: 1, title: 'Package', subtitle: 'Basic Details', key: 'package', icon: Package },
  { id: 2, title: 'Itinerary', subtitle: 'AI Itinerary', key: 'ai-itinerary', icon: Bot },
  { id: 3, title: 'Hotels', subtitle: 'Stay Options', key: 'hotels', icon: Building2 },
  { id: 4, title: 'Transport', subtitle: 'Travel Options', key: 'transport', icon: Car },
  { id: 5, title: 'Pricing', subtitle: 'Total Cost', key: 'pricing', icon: IndianRupee },
  { id: 6, title: 'Preview', subtitle: 'Review & Save', key: 'preview', icon: Eye },
];

export const INCLUSION_PRESETS = [
  'Hotel accommodation',
  'Breakfast',
  'Dinner',
  'Private cab',
  'Sightseeing',
  'Pickup & drop',
  'Guide',
  'All applicable taxes',
  'Parking',
  'Driver allowance',
];

export const EXCLUSION_PRESETS = [
  'Airfare',
  'Personal expenses',
  'Lunch',
  'Entry tickets',
  'Travel insurance',
  'Anything not mentioned in inclusions',
];

export const VEHICLE_TYPES = ['Cab', 'Tempo Traveller', 'SUV', 'Sedan', 'Luxury Car'];

/** Short taglines shown on Quick Template cards */
export const TEMPLATE_TAGLINES = {
  himachal: 'Mountains & Serenity',
  kashmir: 'Paradise on Earth',
  goa: 'Sun, Sand & Sea',
  kerala: "God's Own Country",
  thailand: 'Land of Smiles',
  dubai: 'Luxury & Adventure',
  bali: 'Island of the Gods',
  europe: 'Culture & Charm',
};

export const GUEST_COUNT_OPTIONS = Array.from({ length: 21 }, (_, i) => i);

export const QUOTE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-500/15 text-slate-700' },
  { value: 'sent', label: 'Sent', color: 'bg-sky-500/15 text-sky-700' },
  { value: 'viewed', label: 'Viewed', color: 'bg-indigo-500/15 text-indigo-700' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-500/15 text-emerald-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/15 text-red-700' },
  { value: 'expired', label: 'Expired', color: 'bg-amber-500/15 text-amber-700' },
  { value: 'booked', label: 'Booked', color: 'bg-violet-500/15 text-violet-700' },
];
