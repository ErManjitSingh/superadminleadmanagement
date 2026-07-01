import {
  Package,
  MapPin,
  Map,
  Building2,
  Car,
  Sparkles,
  UtensilsCrossed,
  IndianRupee,
  CheckCircle2,
  CircleOff,
  FileWarning,
  StickyNote,
  Images,
  Video,
  Search,
  Tags,
  Star,
  Eye,
  Save,
} from 'lucide-react';

export const PACKAGE_BUILDER_STEPS = [
  { id: 1, title: 'Basic Details', key: 'basics', icon: Package },
  { id: 2, title: 'Destinations', key: 'destinations', icon: MapPin },
  { id: 3, title: 'Itinerary', key: 'itinerary', icon: Map },
  { id: 4, title: 'Hotels', key: 'hotels', icon: Building2 },
  { id: 5, title: 'Transport', key: 'transport', icon: Car },
  { id: 6, title: 'Activities', key: 'activities', icon: Sparkles },
  { id: 7, title: 'Meals', key: 'meals', icon: UtensilsCrossed },
  { id: 8, title: 'Pricing', key: 'pricing', icon: IndianRupee },
  { id: 9, title: 'Inclusions', key: 'inclusions', icon: CheckCircle2 },
  { id: 10, title: 'Exclusions', key: 'exclusions', icon: CircleOff },
  { id: 11, title: 'Policies', key: 'policies', icon: FileWarning },
  { id: 12, title: 'Notes', key: 'notes', icon: StickyNote },
  { id: 13, title: 'Gallery', key: 'gallery', icon: Images },
  { id: 14, title: 'Videos', key: 'videos', icon: Video },
  { id: 15, title: 'SEO', key: 'seo', icon: Search },
  { id: 16, title: 'Tags', key: 'tags', icon: Tags },
  { id: 17, title: 'Features', key: 'features', icon: Star },
  { id: 18, title: 'Preview', key: 'preview', icon: Eye },
  { id: 19, title: 'Publish', key: 'publish', icon: Save },
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

export const TRANSPORT_TYPES = [
  { value: 'cab', label: 'Cab' },
  { value: 'suv', label: 'SUV' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'tempo', label: 'Tempo Traveller' },
  { value: 'luxury', label: 'Luxury Car' },
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'bus', label: 'Bus' },
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
