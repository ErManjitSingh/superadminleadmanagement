export const navLinks = [
  { label: "India Packages", href: "#packages" },
  { label: "Destinations", href: "#destinations" },
  { label: "Honeymoon", href: "#honeymoon" },
  { label: "Family", href: "#family" },
];

const photo = (id: string, w = 720) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70&fm=webp`;

/** Decorative flip-card images for Thrillophilia-style hero */
export const heroFlipCards = [
  {
    front: photo("photo-1512343879784-a960bf40e7f2", 220),
    back: photo("photo-1507525428034-b723cf961d3e", 220),
  },
  {
    front: photo("photo-1602216056336-8b5a9d71098e", 220),
    back: photo("photo-1593693397690-362cb9666fc2", 220),
  },
  {
    front: photo("photo-1477587458883-471945f94173", 220),
    back: photo("photo-1524492412937-b28074a5d7da", 220),
  },
  {
    front: photo("photo-1581791534721-e599df4417f7", 220),
    back: photo("photo-1626621341517-bbf3d9990a23", 220),
  },
  {
    front: photo("photo-1595815771614-ade9d652a65d", 220),
    back: photo("photo-1586500036706-41963de24d8b", 220),
  },
  {
    front: photo("photo-1506905925346-21bda4d32df4", 220),
    back: photo("photo-1464822759023-fed622ff2c3b", 220),
  },
];

export const megaIndia = [
  {
    title: "Popular Destinations",
    links: [
      { label: "Ladakh Tour Packages", href: "#ladakh" },
      { label: "Kashmir Tour Packages", href: "#kashmir" },
      { label: "Kerala Tour Packages", href: "#kerala" },
      { label: "Goa Tour Packages", href: "#goa" },
      { label: "Rajasthan Tour Packages", href: "#rajasthan" },
      { label: "Himachal Tour Packages", href: "#packages" },
      { label: "Andaman Tour Packages", href: "#packages" },
      { label: "Spiti Tour Packages", href: "#packages" },
    ],
  },
  {
    title: "Honeymoon Tour Packages",
    links: [
      { label: "Kerala Honeymoon Packages", href: "#kerala" },
      { label: "Kashmir Honeymoon Packages", href: "#kashmir" },
      { label: "Goa Honeymoon Packages", href: "#goa" },
      { label: "Rajasthan Honeymoon Packages", href: "#rajasthan" },
      { label: "Ladakh Honeymoon Packages", href: "#ladakh" },
      { label: "Andaman Honeymoon Packages", href: "#packages" },
    ],
  },
  {
    title: "Family Tour Packages",
    links: [
      { label: "Kerala Family Packages", href: "#kerala" },
      { label: "Kashmir Family Packages", href: "#kashmir" },
      { label: "Goa Family Packages", href: "#goa" },
      { label: "Rajasthan Family Packages", href: "#rajasthan" },
      { label: "Himachal Family Packages", href: "#packages" },
    ],
  },
  {
    title: "Trending This Month",
    links: [
      { label: "Ladakh Bike Trip Packages", href: "#ladakh" },
      { label: "Golden Triangle Tour Packages", href: "#rajasthan" },
      { label: "Kerala Backwater Packages", href: "#kerala" },
      { label: "Spiti Bike Trip Packages", href: "#packages" },
      { label: "Manali Tour Packages", href: "#packages" },
    ],
  },
];

export const megaHoneymoon = [
  {
    title: "India Honeymoon",
    links: [
      { label: "Kerala Honeymoon", href: "#kerala" },
      { label: "Kashmir Honeymoon", href: "#kashmir" },
      { label: "Goa Honeymoon", href: "#goa" },
      { label: "Andaman Honeymoon", href: "#packages" },
      { label: "Rajasthan Honeymoon", href: "#rajasthan" },
    ],
  },
  {
    title: "Hill Stations",
    links: [
      { label: "Manali Honeymoon", href: "#packages" },
      { label: "Shimla Honeymoon", href: "#packages" },
      { label: "Munnar Honeymoon", href: "#kerala" },
      { label: "Darjeeling Honeymoon", href: "#packages" },
      { label: "Nainital Honeymoon", href: "#packages" },
    ],
  },
  {
    title: "Luxury Escapes",
    links: [
      { label: "Kashmir Luxury DEAL", href: "#kashmir" },
      { label: "Royal Rajasthan", href: "#rajasthan" },
      { label: "Kerala Houseboat", href: "#kerala" },
    ],
  },
  {
    title: "Trending",
    links: [
      { label: "Ladakh for Couples", href: "#ladakh" },
      { label: "Goa Romantic Escape", href: "#goa" },
    ],
  },
];

export const megaFamily = [
  {
    title: "Family Favourites",
    links: [
      { label: "Kerala Family Packages", href: "#kerala" },
      { label: "Goa Family Packages", href: "#goa" },
      { label: "Rajasthan Family Packages", href: "#rajasthan" },
      { label: "Kashmir Family Packages", href: "#kashmir" },
    ],
  },
  {
    title: "Adventure with Family",
    links: [
      { label: "Ladakh Family Adventure", href: "#ladakh" },
      { label: "Himachal Family Trip", href: "#packages" },
      { label: "Andaman Family Fun", href: "#packages" },
    ],
  },
  {
    title: "Short Breaks",
    links: [
      { label: "Weekend Goa", href: "#goa" },
      { label: "Golden Triangle", href: "#rajasthan" },
      { label: "Kerala Weekend", href: "#kerala" },
    ],
  },
  {
    title: "Top Picks",
    links: [
      { label: "Best of Kerala", href: "#kerala" },
      { label: "Royal Rajasthan", href: "#rajasthan" },
    ],
  },
];

export const exploreDestinations = [
  { name: "Goa", trending: true, image: photo("photo-1512343879784-a960bf40e7f2", 400) },
  { name: "Kerala", trending: true, image: photo("photo-1602216056336-8b5a9d71098e", 400) },
  { name: "Ladakh", trending: true, image: photo("photo-1581791534721-e599df4417f7", 400) },
  { name: "Kashmir", trending: false, image: photo("photo-1595815771614-ade9d652a65d", 400) },
  { name: "Rajasthan", trending: false, image: photo("photo-1477587458883-471945f94173", 400) },
  { name: "Himachal", trending: true, image: photo("photo-1626621341517-bbf3d9990a23", 400) },
  { name: "Andaman", trending: false, image: photo("photo-1586500036706-41963de24d8b", 400) },
  { name: "Spiti", trending: true, image: photo("photo-1506905925346-21bda4d32df4", 400) },
  { name: "Sikkim", trending: false, image: photo("photo-1544735716-392fe2489ffa", 400) },
  { name: "Uttarakhand", trending: false, image: photo("photo-1582510003544-4d00b7f74220", 400) },
];

export type PackageCard = {
  id: string;
  title: string;
  duration: string;
  rating: number;
  reviews: number;
  stays: { days: number; place: string }[];
  priceWas: number;
  priceNow: number;
  per: string;
  image: string;
  badge?: string;
};

export type DestinationSection = {
  id: string;
  title: string;
  packages: PackageCard[];
};

export const destinationSections: DestinationSection[] = [
  {
    id: "kerala",
    title: "Kerala",
    packages: [
      {
        id: "kerala-1",
        title: "Best of Kerala | From Houseboat Stays to Hilltop Views",
        duration: "4 days & 3 nights",
        rating: 4.8,
        reviews: 312,
        stays: [
          { days: 2, place: "Munnar" },
          { days: 1, place: "Alleppey" },
          { days: 1, place: "Kochi" },
        ],
        priceWas: 28689,
        priceNow: 21571,
        per: "/Adult",
        image: photo("photo-1602216056336-8b5a9d71098e"),
        badge: "Bestseller",
      },
      {
        id: "kerala-2",
        title: "Kerala Weekend Getaway | Misty Hills & Calm Backwaters",
        duration: "4 days & 3 nights",
        rating: 4.7,
        reviews: 188,
        stays: [
          { days: 2, place: "Munnar" },
          { days: 1, place: "Alleppey" },
          { days: 1, place: "Kochi" },
        ],
        priceWas: 24500,
        priceNow: 18500,
        per: "/Adult",
        image: photo("photo-1593693397690-362cb9666fc2"),
      },
      {
        id: "kerala-3",
        title: "Romantic Escape to Kerala | Tea Estates to Golden Sands",
        duration: "7 days & 6 nights",
        rating: 4.9,
        reviews: 96,
        stays: [
          { days: 2, place: "Munnar" },
          { days: 1, place: "Thekkady" },
          { days: 1, place: "Alleppey" },
          { days: 2, place: "Kovalam" },
        ],
        priceWas: 35475,
        priceNow: 27500,
        per: "/Adult",
        image: photo("photo-1506905925346-21bda4d32df4"),
        badge: "Honeymoon",
      },
      {
        id: "kerala-4",
        title: "Exotic Kerala | Misty Mountains and Coastal Hues",
        duration: "8 days & 7 nights",
        rating: 4.6,
        reviews: 54,
        stays: [
          { days: 1, place: "Kochi" },
          { days: 2, place: "Munnar" },
          { days: 1, place: "Alleppey" },
          { days: 1, place: "Varkala" },
        ],
        priceWas: 52433,
        priceNow: 39423,
        per: "/Adult",
        image: photo("photo-1582510003544-4d00b7f74220"),
      },
    ],
  },
  {
    id: "goa",
    title: "Goa",
    packages: [
      {
        id: "goa-1",
        title: "Goa Beach Bliss | North & South Coast Escape",
        duration: "5 days & 4 nights",
        rating: 4.7,
        reviews: 420,
        stays: [
          { days: 2, place: "North Goa" },
          { days: 2, place: "South Goa" },
        ],
        priceWas: 18999,
        priceNow: 12999,
        per: "/Adult",
        image: photo("photo-1512343879784-a960bf40e7f2"),
        badge: "Popular",
      },
      {
        id: "goa-2",
        title: "Goa Family Getaway | Beaches, Forts & Water Sports",
        duration: "4 days & 3 nights",
        rating: 4.5,
        reviews: 201,
        stays: [{ days: 4, place: "Calangute" }],
        priceWas: 16999,
        priceNow: 11999,
        per: "/Adult",
        image: photo("photo-1507525428034-b723cf961d3e"),
      },
      {
        id: "goa-3",
        title: "Romantic Goa | Sunset Cruises & Boutique Stays",
        duration: "5 days & 4 nights",
        rating: 4.8,
        reviews: 143,
        stays: [
          { days: 2, place: "Candolim" },
          { days: 2, place: "Palolem" },
        ],
        priceWas: 24999,
        priceNow: 18999,
        per: "/Adult",
        image: photo("photo-1559827260-dc66d52bef19"),
        badge: "Honeymoon",
      },
      {
        id: "goa-4",
        title: "Weekend Goa Splash | Party Nights & Beach Days",
        duration: "3 days & 2 nights",
        rating: 4.4,
        reviews: 89,
        stays: [{ days: 3, place: "Baga" }],
        priceWas: 12999,
        priceNow: 9999,
        per: "/Adult",
        image: photo("photo-1544551763-46a013bb70d5"),
      },
    ],
  },
  {
    id: "rajasthan",
    title: "Rajasthan",
    packages: [
      {
        id: "raj-1",
        title: "Luxury Rajasthan, Smart Price - Full Circuit",
        duration: "8 days & 7 nights",
        rating: 4.8,
        reviews: 267,
        stays: [
          { days: 2, place: "Jaipur" },
          { days: 2, place: "Udaipur" },
          { days: 1, place: "Jodhpur" },
          { days: 2, place: "Jaisalmer" },
        ],
        priceWas: 51769,
        priceNow: 36769,
        per: "/Adult",
        image: photo("photo-1477587458883-471945f94173"),
        badge: "Bestseller",
      },
      {
        id: "raj-2",
        title: "Getaway to Golden Triangle | FREE Taj Mahal Visit",
        duration: "6 days & 5 nights",
        rating: 4.6,
        reviews: 512,
        stays: [
          { days: 2, place: "Delhi" },
          { days: 1, place: "Agra" },
          { days: 3, place: "Jaipur" },
        ],
        priceWas: 28800,
        priceNow: 22424,
        per: "/Adult",
        image: photo("photo-1524492412937-b28074a5d7da"),
      },
      {
        id: "raj-3",
        title: "Jodhpur, Udaipur & Jaisalmer Trails | Realm of Royals",
        duration: "6 days & 5 nights",
        rating: 4.7,
        reviews: 134,
        stays: [
          { days: 2, place: "Udaipur" },
          { days: 1, place: "Jodhpur" },
          { days: 2, place: "Jaisalmer" },
        ],
        priceWas: 64122,
        priceNow: 48212,
        per: "/Adult",
        image: photo("photo-1599661046289-e31897846e41"),
      },
      {
        id: "raj-4",
        title: "Best of Rajasthan | FREE Jaisalmer Camping Experience",
        duration: "9 days & 8 nights",
        rating: 4.9,
        reviews: 78,
        stays: [
          { days: 2, place: "Jaipur" },
          { days: 2, place: "Jaisalmer" },
          { days: 1, place: "Jodhpur" },
          { days: 2, place: "Udaipur" },
        ],
        priceWas: 46816,
        priceNow: 35200,
        per: "/Adult",
        image: photo("photo-1587474260584-136574528ed5"),
      },
    ],
  },
  {
    id: "ladakh",
    title: "Ladakh",
    packages: [
      {
        id: "ladakh-1",
        title: "Ladakh Adventure Expedition with Turtuk Village",
        duration: "7 days & 6 nights",
        rating: 4.9,
        reviews: 389,
        stays: [
          { days: 2, place: "Leh" },
          { days: 2, place: "Nubra" },
          { days: 1, place: "Pangong" },
          { days: 2, place: "Leh" },
        ],
        priceWas: 29900,
        priceNow: 21800,
        per: "/Adult",
        image: photo("photo-1581791534721-e599df4417f7"),
        badge: "Trending",
      },
      {
        id: "ladakh-2",
        title: "Thrilling Leh Ladakh Bike Adventure",
        duration: "7 days & 6 nights",
        rating: 4.8,
        reviews: 221,
        stays: [
          { days: 2, place: "Leh" },
          { days: 1, place: "Nubra" },
          { days: 1, place: "Pangong" },
          { days: 3, place: "Leh" },
        ],
        priceWas: 46284,
        priceNow: 34800,
        per: "/Adult",
        image: photo("photo-1506905925346-21bda4d32df4"),
      },
      {
        id: "ladakh-3",
        title: "Ladakh Highlights | Private Leh Ladakh Adventure",
        duration: "7 days & 6 nights",
        rating: 4.7,
        reviews: 156,
        stays: [
          { days: 2, place: "Leh" },
          { days: 1, place: "Nubra" },
          { days: 1, place: "Pangong" },
          { days: 3, place: "Leh" },
        ],
        priceWas: 41700,
        priceNow: 29999,
        per: "/Adult",
        image: photo("photo-1626621341517-bbf3d9990a23"),
      },
      {
        id: "ladakh-4",
        title: "Leh Ladakh Bike Trip | FREE Excursion to Chang-la Pass",
        duration: "6 days & 5 nights",
        rating: 4.6,
        reviews: 98,
        stays: [
          { days: 2, place: "Leh" },
          { days: 1, place: "Nubra" },
          { days: 1, place: "Pangong" },
          { days: 2, place: "Leh" },
        ],
        priceWas: 43663,
        priceNow: 29800,
        per: "/Adult",
        image: photo("photo-1464822759023-fed622ff2c3b"),
      },
    ],
  },
  {
    id: "kashmir",
    title: "Kashmir",
    packages: [
      {
        id: "kashmir-1",
        title: "Romantic Escape to Kashmir | FREE Excursion to Gulmarg",
        duration: "6 days & 5 nights",
        rating: 4.8,
        reviews: 274,
        stays: [
          { days: 3, place: "Srinagar" },
          { days: 1, place: "Pahalgam" },
          { days: 2, place: "Srinagar" },
        ],
        priceWas: 38182,
        priceNow: 21000,
        per: "/Adult",
        image: photo("photo-1595815771614-ade9d652a65d"),
        badge: "Honeymoon",
      },
      {
        id: "kashmir-2",
        title: "Highlights of Kashmir | FREE Shikara Ride on Dal Lake",
        duration: "6 days & 5 nights",
        rating: 4.7,
        reviews: 341,
        stays: [
          { days: 3, place: "Srinagar" },
          { days: 1, place: "Pahalgam" },
          { days: 2, place: "Srinagar" },
        ],
        priceWas: 31452,
        priceNow: 19500,
        per: "/Adult",
        image: photo("photo-1566837497312-7be7830ae9b1"),
      },
      {
        id: "kashmir-3",
        title: "Best of Kashmir | FREE Excursion to Sonmarg",
        duration: "7 days & 6 nights",
        rating: 4.9,
        reviews: 112,
        stays: [
          { days: 1, place: "Srinagar" },
          { days: 1, place: "Pahalgam" },
          { days: 2, place: "Gulmarg" },
          { days: 3, place: "Srinagar" },
        ],
        priceWas: 36800,
        priceNow: 27500,
        per: "/Adult",
        image: photo("photo-1506905925346-21bda4d32df4"),
      },
      {
        id: "kashmir-4",
        title: "Indulge in Romance | Kashmir Honeymoon Luxury DEAL",
        duration: "7 days & 6 nights",
        rating: 5.0,
        reviews: 67,
        stays: [
          { days: 3, place: "Srinagar" },
          { days: 1, place: "Pahalgam" },
          { days: 2, place: "Gulmarg" },
        ],
        priceWas: 155500,
        priceNow: 131510,
        per: "/Adult",
        image: photo("photo-1582510003544-4d00b7f74220"),
        badge: "Luxury",
      },
    ],
  },
];

export const trustStats = [
  { value: "4.8★", label: "Rated by travellers" },
  { value: "10L+", label: "Happy travellers" },
  { value: "500+", label: "Curated packages" },
  { value: "24×7", label: "Trip support" },
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
    a: "Pick a package, request a callback or message on WhatsApp, confirm the itinerary, and pay the advance to lock dates.",
  },
  {
    q: "Do you book flights too?",
    a: "We can arrange domestic flights on request, or you book your own and we handle everything on ground.",
  },
];

export function formatInr(n: number) {
  return `INR ${n.toLocaleString("en-IN")}`;
}
