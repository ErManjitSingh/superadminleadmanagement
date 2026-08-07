export const navLinks = [
  { label: "Packages", href: "#packages" },
  { label: "Destinations", href: "#destinations" },
  { label: "Why Us", href: "#why-us" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Stories", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

/** Compact Unsplash URLs — webp, small width, lower quality */
const img = (id: string, w = 640) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=55&fm=webp`;

export const packages = [
  {
    id: "goa-beach",
    title: "Goa Beach Bliss",
    location: "North & South Goa",
    duration: "4N / 5D",
    priceFrom: "₹12,999",
    tag: "Beach",
    highlights: ["Beachfront stay", "Water sports", "Sunset cruise"],
    image: img("photo-1512343879784-a960bf40e7f2"),
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
    image: img("photo-1602216056336-8b5a9d71098e"),
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
    image: img("photo-1626621341517-bbf3d9990a23"),
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
    image: img("photo-1477587458883-471945f94173"),
    imageAlt: "Rajasthan palace and desert architecture",
  },
];

export const destinations = [
  { name: "Goa", blurb: "Beaches & nightlife", tone: "goa" },
  { name: "Kerala", blurb: "Backwaters & hills", tone: "kerala" },
  { name: "Himachal", blurb: "Alpine trails", tone: "himachal" },
  { name: "Rajasthan", blurb: "Forts & deserts", tone: "rajasthan" },
];

export const whyUs = [
  {
    title: "Curated packages",
    description: "Itineraries built by experts who know each destination.",
  },
  {
    title: "Transparent pricing",
    description: "Clear inclusions — no last-minute surprises.",
  },
  {
    title: "Local experiences",
    description: "Handpicked stays, food and activities.",
  },
  {
    title: "24×7 trip support",
    description: "We’re one message away from booking to return.",
  },
];

export const howItWorks = [
  {
    step: "01",
    title: "Pick a package",
    description: "Choose a destination that matches your vibe and budget.",
  },
  {
    step: "02",
    title: "Tell us your dates",
    description: "Share dates and group size — we fine-tune the plan.",
  },
  {
    step: "03",
    title: "Confirm & travel",
    description: "Lock stays and transfers, get vouchers, enjoy the trip.",
  },
];

export const testimonials = [
  {
    quote:
      "Kerala honeymoon was flawless — houseboat, Munnar and every transfer on time.",
    name: "Ananya & Rohan",
    trip: "Kerala Backwater Escape",
  },
  {
    quote:
      "Booked Goa for family of six. Kids loved water sports; hotel was exactly as promised.",
    name: "Vikram Shah",
    trip: "Goa Beach Bliss",
  },
  {
    quote:
      "Himachal in winter can be tricky — their team handled routes without fuss.",
    name: "Neha Kapoor",
    trip: "Himachal Hill Retreat",
  },
];

export const faqItems = [
  {
    q: "Can I customise a package?",
    a: "Yes. Adjust dates, hotels, activities and group size — we’ll reshape the itinerary.",
  },
  {
    q: "What is included in the price?",
    a: "Most packages include stays, breakfast, listed sightseeing and transfers. Flights are usually optional.",
  },
  {
    q: "How do I book?",
    a: "Pick a package, enquire on WhatsApp, confirm the plan, and pay the advance to lock dates.",
  },
  {
    q: "Do you arrange flights?",
    a: "We can arrange domestic flights on request, or you book your own and we handle the ground package.",
  },
];
