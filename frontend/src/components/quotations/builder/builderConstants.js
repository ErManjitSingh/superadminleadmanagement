import {
  Package,
  Map,
  Building2,
  Car,
  Sparkles,
  CheckCircle2,
  CircleOff,
  IndianRupee,
  CreditCard,
  FileText,
  User,
  Eye,
} from 'lucide-react';

export const BUILDER_STEPS = [
  { id: 1, title: 'Package', key: 'package', icon: Package },
  { id: 2, title: 'Itinerary', key: 'itinerary', icon: Map },
  { id: 3, title: 'Hotels', key: 'hotels', icon: Building2 },
  { id: 4, title: 'Transport', key: 'transport', icon: Car },
  { id: 5, title: 'Activities', key: 'activities', icon: Sparkles },
  { id: 6, title: 'Inclusions', key: 'inclusions', icon: CheckCircle2 },
  { id: 7, title: 'Exclusions', key: 'exclusions', icon: CircleOff },
  { id: 8, title: 'Pricing', key: 'pricing', icon: IndianRupee },
  { id: 9, title: 'Payment', key: 'payment', icon: CreditCard },
  { id: 10, title: 'Notes', key: 'notes', icon: FileText },
  { id: 11, title: 'Customer', key: 'customer', icon: User },
  { id: 12, title: 'Preview', key: 'preview', icon: Eye },
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

export const ACTIVITY_PRESETS = [
  { name: 'Ropeway', icon: '🚡' },
  { name: 'River Rafting', icon: '🛶' },
  { name: 'Paragliding', icon: '🪂' },
  { name: 'Snow Activities', icon: '❄️' },
  { name: 'Sightseeing', icon: '🏞️' },
  { name: 'Temple Visit', icon: '🛕' },
  { name: 'Shopping', icon: '🛍️' },
];

export const QUOTE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-500/15 text-slate-700' },
  { value: 'sent', label: 'Sent', color: 'bg-sky-500/15 text-sky-700' },
  { value: 'viewed', label: 'Viewed', color: 'bg-indigo-500/15 text-indigo-700' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-500/15 text-emerald-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/15 text-red-700' },
  { value: 'expired', label: 'Expired', color: 'bg-amber-500/15 text-amber-700' },
  { value: 'booked', label: 'Booked', color: 'bg-violet-500/15 text-violet-700' },
];
