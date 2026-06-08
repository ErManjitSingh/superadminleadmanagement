/**
 * Seed attractive demo quotations for PDF preview & print testing.
 * Run: npm run seed:demo-quotations
 * Safe to re-run — upserts by quoteNumber.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Lead = require('../models/Lead');
const Package = require('../models/Package');
const Quotation = require('../models/Quotation');

const DEMO_QUOTES = [
  {
    quoteNumber: 'Q-DEMO-2026-K001',
    lead: {
      name: 'Priya & Arjun Mehta',
      email: 'priya.arjun@email.com',
      phone: '+91 98123 45678',
      destination: 'Kashmir',
      travelDate: new Date('2026-09-14'),
      budget: 200000,
      travelers: 2,
      status: 'contacted',
      source: 'referral',
      sourceLabel: 'Referral',
    },
    package: {
      name: 'Kashmir Honeymoon Paradise',
      destination: 'Srinagar · Gulmarg · Pahalgam',
      duration: 6,
      startingPrice: 95000,
      packageType: 'honeymoon',
      coverImage: 'https://images.unsplash.com/photo-1595815778869-8465134C4C70?w=1400&q=80',
      highlights: [
        'Shikara ride on Dal Lake at sunset',
        'Gulmarg Gondola Phase 2 experience',
        'Luxury houseboat stay with candlelight dinner',
        'Private cab with professional driver',
        'Professional photoshoot in Mughal Gardens',
      ],
      inclusions: [
        'Return flights Delhi ↔ Srinagar',
        '5★ hotel + premium houseboat (2N)',
        'Daily breakfast & selected dinners',
        'Private Innova for entire trip',
        'Shikara ride & Gondola tickets',
        'All taxes & travel insurance',
      ],
      exclusions: [
        'Personal expenses & shopping',
        'Lunch on travel days',
        'Adventure sports optional add-ons',
        'Tips to guides & drivers',
      ],
      itinerary: [
        { day: 1, title: 'Welcome to Paradise — Srinagar', description: 'Arrive Srinagar, private transfer to Dal Lake houseboat. Evening Shikara ride with kahwa & kehwa snacks as the sun sets over the Zabarwan mountains.', meals: 'Dinner on houseboat', accommodation: 'Premium Houseboat, Dal Lake', activities: 'Shikara ride, sunset photography', transport: 'Private Innova from airport' },
        { day: 2, title: 'Mughal Gardens & Old City', description: 'Explore Nishat Bagh, Shalimar Bagh and Chashme Shahi. Walk through old Srinagar markets for pashmina and dry fruits. Couple photoshoot in gardens.', meals: 'Breakfast + Dinner', accommodation: 'Premium Houseboat', activities: 'Garden tour, photoshoot', transport: 'Private cab' },
        { day: 3, title: 'Gulmarg — Meadow of Flowers', description: 'Drive to Gulmarg via scenic routes. Gondola ride to Kongdoori with panoramic Himalayan views. Optional snow activities (seasonal).', meals: 'Breakfast + Dinner', accommodation: 'Hotel Hilltop Gulmarg 5★', activities: 'Gondola Phase 1 & 2', transport: 'Private cab' },
        { day: 4, title: 'Pahalgam — Valley of Shepherds', description: 'Journey to Pahalgam through saffron fields. Visit Betaab Valley and Aru Valley. Leisure evening by Lidder river.', meals: 'Breakfast + Dinner', accommodation: 'Pine N Peak Pahalgam 5★', activities: 'Valley sightseeing', transport: 'Private cab' },
        { day: 5, title: 'Romantic Day in Pahalgam', description: 'Leisure morning. Optional pony ride to Baisaran ("Mini Switzerland"). Candlelight dinner arranged at hotel.', meals: 'Breakfast + Candlelight Dinner', accommodation: 'Pine N Peak Pahalgam 5★', activities: 'Baisaran visit, couple dinner', transport: 'Private cab' },
        { day: 6, title: 'Farewell with Memories', description: 'Return to Srinagar airport with packed breakfast. Departure with unforgettable Kashmir memories.', meals: 'Breakfast', accommodation: '—', activities: 'Departure', transport: 'Airport drop' },
      ],
    },
    pricing: { baseCost: 72000, hotelCost: 48000, cabCost: 12000, flightCost: 28000, activityCost: 8500, taxes: 6200, markup: 15000, discount: 5000, total: 184700, profitMargin: 5.4 },
    status: 'sent',
    customizations: 'Honeymoon special: rose petal decoration on arrival, complimentary cake, and late checkout where available.',
  },
  {
    quoteNumber: 'Q-DEMO-2026-D001',
    lead: {
      name: 'Sharma Family',
      email: 'sharma.family@email.com',
      phone: '+91 98765 11223',
      destination: 'Dubai',
      travelDate: new Date('2026-12-20'),
      budget: 500000,
      travelers: 4,
      status: 'follow_up',
      source: 'website',
      sourceLabel: 'Website',
    },
    package: {
      name: 'Dubai Luxury Family Escape',
      destination: 'Dubai, UAE',
      duration: 5,
      startingPrice: 180000,
      packageType: 'luxury',
      coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=80',
      highlights: [
        'Burj Khalifa At The Top SKY level',
        'Desert safari with BBQ dinner & entertainment',
        'Atlantis Aquaventure full-day pass',
        'Dubai Marina dhow cruise dinner',
        'Luxury 5★ hotel near Dubai Mall',
      ],
      inclusions: [
        'Return economy flights for 4 pax',
        '4N Atlantis The Palm / equivalent 5★',
        'Daily breakfast + 2 dinners',
        'All sightseeing with private van',
        'UAE visa processing assistance',
        'Travel insurance for family',
      ],
      exclusions: [
        'UAE visa fees (approx ₹7,000/person)',
        'Lunch & personal shopping',
        'Theme park fast-track passes',
        'Room service & minibar',
      ],
      itinerary: [
        { day: 1, title: 'Arrival — Dubai Welcomes You', description: 'Land at DXB, VIP meet & greet, transfer to Atlantis The Palm. Evening at leisure — explore The Pointe fountain show.', meals: '—', accommodation: 'Atlantis The Palm 5★', activities: 'Fountain show', transport: 'Private van' },
        { day: 2, title: 'Modern Dubai Icons', description: 'Burj Khalifa At The Top SKY, Dubai Mall aquarium visit, walk through Souk Al Bahar. Evening Dubai Marina walk.', meals: 'Breakfast', accommodation: 'Atlantis The Palm 5★', activities: 'Burj Khalifa, Dubai Mall', transport: 'Private van' },
        { day: 3, title: 'Desert Adventure', description: 'Morning at leisure / Aquaventure optional. Afternoon desert safari — dune bashing, camel ride, BBQ dinner with Tanoura show.', meals: 'Breakfast + BBQ Dinner', accommodation: 'Atlantis The Palm 5★', activities: 'Desert safari', transport: 'Safari 4x4 + van' },
        { day: 4, title: 'Aquaventure & Marina Cruise', description: 'Full day at Aquaventure Waterpark. Evening dhow cruise dinner with live entertainment and skyline views.', meals: 'Breakfast + Cruise Dinner', accommodation: 'Atlantis The Palm 5★', activities: 'Aquaventure, dhow cruise', transport: 'Private van' },
        { day: 5, title: 'Departure', description: 'Breakfast, last-minute souvenir shopping at Dubai Mall (time permitting), transfer to airport.', meals: 'Breakfast', accommodation: '—', activities: 'Departure', transport: 'Airport transfer' },
      ],
    },
    pricing: { baseCost: 185000, hotelCost: 142000, cabCost: 28000, flightCost: 96000, activityCost: 32000, taxes: 18500, markup: 35000, discount: 8000, total: 452500, profitMargin: 6.0 },
    status: 'approved',
    customizations: 'Family room connecting rooms requested. Kids welcome amenities on arrival.',
  },
  {
    quoteNumber: 'Q-DEMO-2026-B001',
    lead: {
      name: 'Rahul Sharma & Friends',
      email: 'rahul.adventure@email.com',
      phone: '+91 87654 99887',
      destination: 'Bali',
      travelDate: new Date('2026-08-05'),
      budget: 120000,
      travelers: 6,
      status: 'new',
      source: 'social',
      sourceLabel: 'Instagram',
    },
    package: {
      name: 'Bali Adventure Squad Getaway',
      destination: 'Ubud · Seminyak · Nusa Penida',
      duration: 7,
      startingPrice: 65000,
      packageType: 'adventure',
      coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=80',
      highlights: [
        'Nusa Penida day trip — Kelingking Beach',
        'White water rafting on Ayung River',
        'Ubud rice terraces & swing experience',
        'Seminyak beach clubs & nightlife',
        'Traditional Balinese spa session',
      ],
      inclusions: [
        'Return flights Delhi ↔ Denpasar',
        'Mix of 4★ boutique hotels',
        'Daily breakfast',
        'Group transport (Innova + driver)',
        'Rafting, swing & Nusa Penida tour',
        'Indonesia visa on arrival guidance',
      ],
      exclusions: [
        'Visa on arrival fee (~₹2,500/person)',
        'Lunch & dinner (except where noted)',
        'Beach club entry & drinks',
        'Scuba diving optional',
      ],
      itinerary: [
        { day: 1, title: 'Touch Down in Bali', description: 'Arrive Denpasar, transfer to Seminyak. Group welcome dinner at beachside restaurant.', meals: 'Welcome Dinner', accommodation: 'Seminyak 4★ Boutique', activities: 'Beach walk', transport: 'Group van' },
        { day: 2, title: 'Ubud Culture Day', description: 'Tegallalang rice terraces, Ubud Monkey Forest, traditional coffee plantation. Optional Bali swing.', meals: 'Breakfast', accommodation: 'Ubud Jungle Resort 4★', activities: 'Terraces, swing', transport: 'Group van' },
        { day: 3, title: 'White Water Rafting', description: 'Morning Ayung River rafting (Grade II–III). Afternoon spa session. Evening free in Ubud.', meals: 'Breakfast + Post-raft lunch', accommodation: 'Ubud Jungle Resort 4★', activities: 'Rafting, spa', transport: 'Group van' },
        { day: 4, title: 'Seminyak Vibes', description: 'Transfer to Seminyak. Beach day, optional surf lesson. Sunset at Potato Head Beach Club.', meals: 'Breakfast', accommodation: 'Seminyak 4★ Boutique', activities: 'Beach, surf optional', transport: 'Group van' },
        { day: 5, title: 'Nusa Penida Expedition', description: 'Early ferry to Nusa Penida. Kelingking Beach, Angel\'s Billabong, Broken Beach. Return by evening.', meals: 'Breakfast + Packed lunch', accommodation: 'Seminyak 4★ Boutique', activities: 'Nusa Penida tour', transport: 'Ferry + van' },
        { day: 6, title: 'Free Day — Your Rules', description: 'Leisure day for shopping, water sports, or pool party at villa. Group farewell dinner.', meals: 'Breakfast + Farewell Dinner', accommodation: 'Seminyak 4★ Boutique', activities: 'Free day', transport: 'On request' },
        { day: 7, title: 'See You Again, Bali', description: 'Checkout and airport transfer. Depart with epic squad memories.', meals: 'Breakfast', accommodation: '—', activities: 'Departure', transport: 'Airport transfer' },
      ],
    },
    pricing: { baseCost: 42000, hotelCost: 28000, cabCost: 14000, flightCost: 48000, activityCost: 12000, taxes: 3800, markup: 6500, discount: 2000, total: 98500, profitMargin: 4.6 },
    status: 'sent',
    customizations: 'Group of 6 friends — twin/triple sharing. One vegetarian meal option daily.',
  },
];

async function seedDemoQuotations() {
  await connectDB();
  console.log('Connected. Seeding demo quotations…');

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.findOne();
  }
  if (!admin) {
    console.error('No users found. Run npm run seed first or create an admin user.');
    process.exit(1);
  }

  let branch = await Branch.findOne();
  if (!branch) {
    branch = await Branch.create({ name: 'Shimla', code: 'SHIMLA', status: 'active' });
  }

  const created = [];

  for (const demo of DEMO_QUOTES) {
    let lead = await Lead.findOne({ email: demo.lead.email });
    if (!lead) {
      lead = await Lead.create({
        ...demo.lead,
        createdBy: admin._id,
        branchId: branch._id,
      });
      console.log(`  + Lead: ${lead.name}`);
    }

    let pkg = await Package.findOne({ name: demo.package.name });
    if (!pkg) {
      pkg = await Package.create({
        ...demo.package,
        createdBy: admin._id,
      });
      console.log(`  + Package: ${pkg.name}`);
    }

    const sentAt = new Date();
    sentAt.setDate(sentAt.getDate() - Math.floor(Math.random() * 5));

    const payload = {
      quoteNumber: demo.quoteNumber,
      lead: lead._id,
      package: pkg._id,
      packageSnapshot: { ...demo.package, _id: pkg._id },
      status: demo.status,
      pricing: demo.pricing,
      customizations: demo.customizations || '',
      createdByExecutive: admin._id,
      createdBy: admin._id,
      branchId: branch._id,
      sentAt: demo.status === 'sent' ? sentAt : undefined,
      approvedBy: demo.status === 'approved' || demo.status === 'sent' ? admin._id : undefined,
      timeline: [
        { type: 'created', date: new Date(sentAt.getTime() - 86400000 * 2), user: admin.name, notes: 'Demo quotation created' },
        ...(demo.status === 'approved' || demo.status === 'sent'
          ? [{ type: 'approved', date: new Date(sentAt.getTime() - 86400000), user: admin.name, notes: 'Approved for customer' }]
          : []),
        ...(demo.status === 'sent'
          ? [{ type: 'sent', date: sentAt, user: admin.name, notes: `Sent to ${lead.name}` }]
          : []),
      ],
    };

    const existing = await Quotation.findOne({ quoteNumber: demo.quoteNumber });
    if (existing) {
      await Quotation.updateOne({ _id: existing._id }, { $set: payload });
      console.log(`  ↻ Updated: ${demo.quoteNumber}`);
    } else {
      await Quotation.create(payload);
      console.log(`  + Created: ${demo.quoteNumber}`);
    }
    created.push(demo.quoteNumber);
  }

  console.log('\n✅ Demo quotations ready:\n');
  created.forEach((q) => console.log(`   ${q}`));
  console.log('\nOpen Admin → Quotations, click any demo quote, then "View PDF" → Print / Save PDF.\n');

  await mongoose.disconnect();
}

seedDemoQuotations().catch((err) => {
  console.error(err);
  process.exit(1);
});
