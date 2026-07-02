import {
  Package,
  Bot,
  Building2,
  Car,
  IndianRupee,
  Eye,
} from 'lucide-react';

/** Simplified 6-step package builder flow */
export const PACKAGE_BUILDER_STEPS = [
  { id: 1, title: 'Basic Details', key: 'basics', icon: Package },
  { id: 2, title: 'AI Itinerary', key: 'ai-itinerary', icon: Bot },
  { id: 3, title: 'Hotels', key: 'hotels', icon: Building2 },
  { id: 4, title: 'Transport', key: 'transport', icon: Car },
  { id: 5, title: 'Pricing', key: 'pricing', icon: IndianRupee },
  { id: 6, title: 'Preview', key: 'preview', icon: Eye },
];

export const PACKAGE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-500/15 text-slate-700' },
  { value: 'published', label: 'Published', color: 'bg-emerald-500/15 text-emerald-700' },
  { value: 'hidden', label: 'Hidden', color: 'bg-amber-500/15 text-amber-700' },
  { value: 'archived', label: 'Archived', color: 'bg-red-500/15 text-red-700' },
];

export const PACKAGE_TAG_OPTIONS = [
  'Luxury', 'Budget', 'Family', 'Adventure', 'Honeymoon',
  'International', 'Domestic', 'Weekend', 'Festival', 'Summer', 'Winter',
];

export const PACKAGE_FEATURE_OPTIONS = [
  { key: 'refundable', label: 'Refundable' },
  { key: 'privateCab', label: 'Private Cab' },
  { key: 'guideIncluded', label: 'Guide Included' },
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'flights', label: 'Flights' },
  { key: 'visa', label: 'Visa' },
  { key: 'insurance', label: 'Insurance' },
];

export const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'challenging', label: 'Challenging' },
];

export const DEFAULT_DESTINATIONS = [
  { name: 'Shimla', state: 'Himachal Pradesh', image: '' },
  { name: 'Manali', state: 'Himachal Pradesh', image: '' },
  { name: 'Kasol', state: 'Himachal Pradesh', image: '' },
  { name: 'Dalhousie', state: 'Himachal Pradesh', image: '' },
  { name: 'Amritsar', state: 'Punjab', image: '' },
];

export { INCLUSION_PRESETS, EXCLUSION_PRESETS, VEHICLE_TYPES } from '../../quotations/builder/builderConstants';
