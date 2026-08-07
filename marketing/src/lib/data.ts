export const navLinks = [
  { label: "Packages", href: "#packages" },
  { label: "Destinations", href: "#destinations" },
  { label: "Why Us", href: "#why-us" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Stories", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

const photo = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=68&fm=webp`;

export const heroImage = photo("photo-1524492412937-b28074a5d7da", 1600);

export const packages = [
  {
    id: "goa-beach",
    title: "Goa Beach Bliss",
    location: "North & South Goa",
    duration: "4N / 5D",
    priceFrom: "₹12,999",
    tag: "Beach",
    highlights: ["Beachfront stay", "Water sports", "Sunset cruise"],
    image: photo("photo-1512343879784-a960bf40e7f2", 800),
    imageAlt: "Goa beach at golden hour",
  },
  {
    id: "kerala-backwaters",
    title: "Kerala Backwater Escape",
    location: "Alleppey · Kochi · Munnar",
    duration: "5N / 6D",
    priceFrom: "₹18,499",
    tag: "Nature",
    highlights: ["Houseboat night", "Tea gardens", "Ayurveda spa"],
    image: photo("photo-1602216056336-8b5a9d71098e", 800),
    imageAlt: "Kerala backwaters with palms",
  },
  {
    id: "himachal-hills",
    title: "Himachal Hill Retreat",
    location: "Manali · Solang · Kasol",
    duration: "5N / 6D",
    priceFrom: "₹16,999",
    tag: "Mountains",
    highlights: ["Snow peaks", "Adventure day", "Café trails"],
    image: photo("photo-1626621341517-bbf3d9990a23", 800),
    imageAlt: "Himachal mountain valley",
  },
  {
    id: "rajasthan-royal",
    title: "Royal Rajasthan Trail",
    location: "Jaipur · Udaipur · Jodhpur",
    duration: "6N / 7D",
    priceFrom: "₹22,499",
    tag: "Heritage",
    highlights: ["Palace hotels", "Desert sunset", "Cultural shows"],
    image: photo("photo-1477587458883-471945f94173", 800),
    imageAlt: "Rajasthan fort architecture",
  },
  {
    id: "kashmir-valley",
    title: "Kashmir Valley Dreams",
    location: "Srinagar · Gulmarg · Pahalgam",
    duration: "5N / 6D",
    priceFrom: "₹24,999",
    tag: "Valley",
    highlights: ["Shikara ride", "Gulmarg gondola", "Houseboat stay"],
    image: photo("photo-1595815771614-ade9d652a65d", 800),
    imageAlt: "Dal Lake Srinagar",
  },
  {
    id: "andaman-islands",
    title: "Andaman Island Hop",
    location: "Port Blair · Havelock · Neil",
    duration: "5N / 6D",
    priceFrom: "₹28,999",
    tag: "Islands",
    highlights: ["Snorkelling", "Radhanagar Beach", "Ferry hops"],
    image: photo("photo-1586500036706-41963de24d8b", 800),
    imageAlt: "Andaman turquoise water",
  },
];

export const destinations = [
  {
    name: "Goa",
    blurb: "Beaches, nightlife & Portuguese charm",
    image: photo("photo-1507525428034-b723cf961d3e", 700),
  },
  {
    name: "Kerala",
    blurb: "Backwaters, hills & quiet luxury",
    image: photo("photo-1593693397690-362cb9666fc2", 700),
  },
  {
    name: "Himachal",
    blurb: "Alpine towns & adventure trails",
    image: photo("photo-1506905925346-21bda4d32df4", 700),
  },
  {
    name: "Rajasthan",
    blurb: "Forts, deserts & royal stays",
    image: photo("photo-1524492412937-b28074a5d7da", 700),
  },
];

export const whyUs = [
  {
    title: "Curated by travellers",
    description: "Every route is checked by people who actually go — not copy-paste itineraries.",
  },
  {
    title: "Clear, honest pricing",
    description: "Inclusions listed upfront. No surprise add-ons at the airport gate.",
  },
  {
    title: "Stays that feel right",
    description: "Boutique hotels, houseboats and resorts we would book for our own families.",
  },
  {
    title: "Support that shows up",
    description: "From first WhatsApp to the ride home — a real team on the other side.",
  },
];

export const howItWorks = [
  {
    step: "01",
    title: "Choose your escape",
    description: "Browse packages or tell us a destination — beach, hills, heritage or islands.",
  },
  {
    step: "02",
    title: "Shape the days",
    description: "We tune hotels, pace and experiences around your dates and group.",
  },
  {
    step: "03",
    title: "Travel light",
    description: "Confirm, get vouchers, and leave the logistics to us.",
  },
];

export const testimonials = [
  {
    quote:
      "Our Kerala honeymoon felt effortless. Houseboat, Munnar, every transfer — exactly as promised.",
    name: "Ananya & Rohan",
    trip: "Kerala Backwater Escape",
  },
  {
    quote:
      "Took six of us to Goa. Kids were happy, hotel matched the photos, and pricing was crystal clear.",
    name: "Vikram Shah",
    trip: "Goa Beach Bliss",
  },
  {
    quote:
      "Winter Himachal can go wrong fast. Their team rerouted us smoothly and we still got the snow.",
    name: "Neha Kapoor",
    trip: "Himachal Hill Retreat",
  },
];

export const faqItems = [
  {
    q: "Can I customise a package?",
    a: "Yes. Dates, hotels, activities and group size can all be adjusted — share what you need and we reshape the plan.",
  },
  {
    q: "What is usually included?",
    a: "Stays, breakfast, listed sightseeing and transfers in most packages. Flights are optional unless mentioned.",
  },
  {
    q: "How do I book?",
    a: "Pick a package, message us on WhatsApp, confirm the itinerary, and pay the advance to lock your dates.",
  },
  {
    q: "Do you book flights too?",
    a: "We can arrange domestic flights on request, or you book your own and we handle everything on ground.",
  },
];
