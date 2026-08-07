import {
  Compass,
  Headphones,
  HeartHandshake,
  MapPinned,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const navLinks = [
  { label: "Packages", href: "#packages" },
  { label: "Destinations", href: "#destinations" },
  { label: "Why Us", href: "#why-us" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Stories", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export const packages: {
  id: string;
  title: string;
  location: string;
  duration: string;
  priceFrom: string;
  tag: string;
  highlights: string[];
  image: string;
  imageAlt: string;
}[] = [
  {
    id: "goa-beach",
    title: "Goa Beach Bliss",
    location: "North & South Goa",
    duration: "4N / 5D",
    priceFrom: "₹12,999",
    tag: "Beach",
    highlights: ["Beachfront stay", "Water sports", "Sunset cruise"],
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Goa beach coastline at sunset",
  },
  {
    id: "kerala-backwaters",
    title: "Kerala Backwater Escape",
    location: "Alleppey · Kochi · Munnar",
    duration: "5N / 6D",
    priceFrom: "₹18,499",
    tag: "Nature",
    highlights: ["Houseboat night", "Tea gardens", "Ayurveda spa"],
    image:
      "https://images.unsplash.com/photo-1602216056336-8b5a9d71098e?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Kerala backwaters with palm trees",
  },
  {
    id: "himachal-hills",
    title: "Himachal Hill Retreat",
    location: "Manali · Solang · Kasol",
    duration: "5N / 6D",
    priceFrom: "₹16,999",
    tag: "Mountains",
    highlights: ["Snow peaks", "Adventure day", "Café trails"],
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Himachal Pradesh mountain landscape",
  },
  {
    id: "rajasthan-royal",
    title: "Royal Rajasthan Trail",
    location: "Jaipur · Udaipur · Jodhpur",
    duration: "6N / 7D",
    priceFrom: "₹22,499",
    tag: "Heritage",
    highlights: ["Palace hotels", "Desert sunset", "Cultural shows"],
    image:
      "https://images.unsplash.com/photo-1477587458883-471945f94173?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Rajasthan palace and desert architecture",
  },
  {
    id: "kashmir-valley",
    title: "Kashmir Valley Dreams",
    location: "Srinagar · Gulmarg · Pahalgam",
    duration: "5N / 6D",
    priceFrom: "₹24,999",
    tag: "Valley",
    highlights: ["Shikara ride", "Gulmarg gondola", "Houseboat stay"],
    image:
      "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Dal Lake Srinagar with mountains",
  },
  {
    id: "andaman-islands",
    title: "Andaman Island Hop",
    location: "Port Blair · Havelock · Neil",
    duration: "5N / 6D",
    priceFrom: "₹28,999",
    tag: "Islands",
    highlights: ["Scuba / snorkel", "Radhanagar Beach", "Ferry hops"],
    image:
      "https://images.unsplash.com/photo-1586500036706-41963de24d8b?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Andaman turquoise beach and clear water",
  },
];

export const destinations: {
  name: string;
  blurb: string;
  image: string;
}[] = [
  {
    name: "Goa",
    blurb: "Beaches, nightlife & Portuguese charm",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Kerala",
    blurb: "Backwaters, hills & quiet luxury",
    image:
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Himachal",
    blurb: "Alpine towns & adventure trails",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Rajasthan",
    blurb: "Forts, deserts & royal stays",
    image:
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=80",
  },
];

export const whyUs: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Curated packages",
    description: "Every itinerary is built by travel experts who know the destination inside out.",
    icon: Sparkles,
  },
  {
    title: "Transparent pricing",
    description: "Clear inclusions, no last-minute surprises — what you see is what you pay.",
    icon: ShieldCheck,
  },
  {
    title: "Local experiences",
    description: "Stay, eat and explore like a local with handpicked stays and activities.",
    icon: MapPinned,
  },
  {
    title: "24×7 trip support",
    description: "From booking to return, our team stays one message away for any help.",
    icon: Headphones,
  },
  {
    title: "Flexible customisation",
    description: "Honeymoon, family, group or solo — we reshape packages around your dates.",
    icon: Compass,
  },
  {
    title: "Trusted partnerships",
    description: "Verified hotels, drivers and vendors so your holiday stays smooth end to end.",
    icon: HeartHandshake,
  },
];

export const howItWorks = [
  {
    step: "01",
    title: "Pick a package",
    description: "Browse destinations and choose a package that matches your vibe and budget.",
  },
  {
    step: "02",
    title: "Tell us your dates",
    description: "Share travel dates, group size and preferences — we fine-tune the itinerary.",
  },
  {
    step: "03",
    title: "Confirm & travel",
    description: "Lock hotels and transfers, get vouchers, and enjoy your India holiday.",
  },
];

export const testimonials = [
  {
    quote:
      "Our Kerala honeymoon was flawless — houseboat, Munnar and every transfer was on time. Felt premium without the stress.",
    name: "Ananya & Rohan",
    trip: "Kerala Backwater Escape",
  },
  {
    quote:
      "Booked Goa for my family of six. Kids loved the water sports and the hotel was exactly as promised. Will book again.",
    name: "Vikram Shah",
    trip: "Goa Beach Bliss",
  },
  {
    quote:
      "Himachal in winter can be tricky, but their team handled snow routes and hotel changes without fuss. Highly recommended.",
    name: "Neha Kapoor",
    trip: "Himachal Hill Retreat",
  },
];

export const faqItems = [
  {
    q: "Can I customise a package?",
    a: "Yes. Every package can be adjusted for dates, hotels, activities and group size. Share your preferences and we will reshape the itinerary.",
  },
  {
    q: "What is included in the price?",
    a: "Most packages include stays, daily breakfast, sightseeing as listed, and airport/railway transfers. Flights are usually optional add-ons unless mentioned.",
  },
  {
    q: "How do I book?",
    a: "Choose a package, send an enquiry via WhatsApp or the contact form, confirm the itinerary, and pay the advance to lock your dates.",
  },
  {
    q: "Do you arrange flights?",
    a: "We can arrange domestic flights and train tickets on request, or you can book your own and we handle the ground package.",
  },
];
