/**
 * Rich operations demo — 10 leads with bookings across all ops statuses.
 * Safe to re-run (skips existing booking / ticket / voucher numbers).
 * Run: npm run seed:operations-demo
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const Hotel = require('../models/Hotel');
const Cab = require('../models/Cab');
const TripTask = require('../models/TripTask');
const Voucher = require('../models/Voucher');
const SupportTicket = require('../models/SupportTicket');
const Package = require('../models/Package');
const { DEMO_LEADS } = require('../data/demoLeads');

function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}

const TODAY = new Date();
TODAY.setHours(12, 0, 0, 0);

async function ensureBranch(name, code) {
  return Branch.findOneAndUpdate(
    { code },
    { name, code, status: 'active' },
    { upsert: true, new: true }
  );
}

async function ensureBooking(data) {
  return Booking.findOneAndUpdate(
    { bookingNumber: data.bookingNumber },
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function ensureLead(leadData, branchId, assignedTo) {
  return Lead.findOneAndUpdate(
    { phone: leadData.phone },
    {
      ...leadData,
      status: 'converted',
      branchId,
      assignedTo,
      travelDate: leadData.travelDate,
      returnDate: leadData.returnDate,
    },
    { upsert: true, new: true }
  );
}

async function ensureTasks(booking, opsId, branchId, statuses = ['pending', 'pending', 'pending']) {
  const types = ['hotel_confirmation', 'cab_confirmation', 'voucher_creation'];
  const titles = ['Confirm hotel reservation', 'Assign cab & driver', 'Generate travel vouchers'];
  for (let i = 0; i < types.length; i += 1) {
    const exists = await TripTask.findOne({ booking: booking._id, type: types[i] });
    if (!exists) {
      await TripTask.create({
        booking: booking._id,
        branchId,
        title: titles[i],
        type: types[i],
        status: statuses[i] || 'pending',
        assignedTo: opsId,
        dueDate: booking.travelDate,
      });
    }
  }
}

async function run() {
  await connectDB();

  const ops = await User.findOne({ email: 'ops@crm.com' });
  const admin = await User.findOne({ email: 'admin@crm.com' });
  if (!ops) throw new Error('Run seed:operations-user first (ops@crm.com required)');

  const [shimlaBranch, ptwBranch] = await Promise.all([
    ensureBranch('Shimla', 'SHIMLA'),
    ensureBranch('PTW', 'PTW'),
  ]);

  const branches = [shimlaBranch, ptwBranch];
  const branchAt = (i) => branches[i % branches.length];

  const pkg = await Package.findOne() || await Package.create({
    name: 'Demo Package',
    destination: 'Goa',
    duration: 5,
    basePrice: 45000,
    branchId: shimlaBranch._id,
  });

  await Hotel.bulkWrite([
    {
      updateOne: {
        filter: { name: 'Demo Beach Resort Goa' },
        update: {
          $set: {
            name: 'Demo Beach Resort Goa',
            destination: 'Goa',
            location: 'Calangute, Goa',
            category: '4 Star',
            contactPerson: 'Anita Desai',
            phone: '+91 98765 11111',
            email: 'reservations@demobeach.com',
            roomTypes: [{ name: 'Deluxe Sea View', maxOccupancy: 3, baseRate: 7500 }],
            branchId: shimlaBranch._id,
          },
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { name: 'Kerala Houseboat Retreat' },
        update: {
          $set: {
            name: 'Kerala Houseboat Retreat',
            destination: 'Kerala',
            location: 'Alleppey',
            category: 'Premium',
            contactPerson: 'Thomas Varghese',
            phone: '+91 98765 44444',
            branchId: ptwBranch._id,
          },
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { name: 'Manali Snow View Hotel' },
        update: {
          $set: {
            name: 'Manali Snow View Hotel',
            destination: 'Manali',
            location: 'Old Manali',
            category: '3 Star',
            contactPerson: 'Rajesh Thakur',
            phone: '+91 98765 55555',
            branchId: ptwBranch._id,
          },
        },
        upsert: true,
      },
    },
  ]);

  await Cab.updateOne(
    { registrationNumber: 'KA 01 AB 1234' },
    {
      $set: {
        vehicleName: 'Innova',
        vehicleType: 'suv',
        registrationNumber: 'KA 01 AB 1234',
        color: 'White',
        fuelType: 'Diesel',
        capacity: 6,
        pickupLocation: 'Airport',
        dropLocation: 'Hotel',
        pickupAddress: 'Dabolim International Airport',
        dropAddress: 'Taj Resort Calangute',
        pickupDate: new Date('2026-06-16T10:30:00'),
        dropDate: new Date('2026-06-16T11:30:00'),
        tripType: 'One Way',
        cost: 3500,
        status: 'available',
        branchId: shimlaBranch._id,
      },
    },
    { upsert: true }
  );

  await Vendor.bulkWrite([
    {
      updateOne: {
        filter: { name: 'Goa Cabs Express' },
        update: {
          $set: {
            name: 'Goa Cabs Express',
            type: 'transport',
            contactPerson: 'Ravi',
            phone: '+91 98765 22222',
            destination: 'Goa',
            commission: 8,
            status: 'active',
            branchId: shimlaBranch._id,
          },
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { name: 'Dubai Transfers LLC' },
        update: {
          $set: {
            name: 'Dubai Transfers LLC',
            type: 'transport',
            contactPerson: 'Ahmed',
            phone: '+971 50 123 4567',
            destination: 'Dubai',
            commission: 10,
            status: 'active',
            branchId: ptwBranch._id,
          },
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { name: 'Adventure Goa Activities' },
        update: {
          $set: {
            name: 'Adventure Goa Activities',
            type: 'activity',
            contactPerson: 'Suresh',
            phone: '+91 98765 33333',
            destination: 'Goa',
            commission: 12,
            status: 'active',
            branchId: shimlaBranch._id,
          },
        },
        upsert: true,
      },
    },
  ]);

  const bookingPlans = [
    {
      idx: 0,
      bookingNumber: 'BK-2026-DEMO-01',
      status: 'booking_received',
      paymentStatus: 'partial',
      hotelConfirmation: 'pending',
      cabConfirmation: 'pending',
      voucherStatus: 'pending',
      travelOffset: 8,
      duration: 5,
      amount: 85000,
      paid: 30000,
    },
    {
      idx: 1,
      bookingNumber: 'BK-2026-DEMO-02',
      status: 'pending_verification',
      paymentStatus: 'partial',
      hotelConfirmation: 'pending',
      cabConfirmation: 'pending',
      voucherStatus: 'pending',
      travelOffset: 12,
      duration: 6,
      amount: 120000,
      paid: 40000,
    },
    {
      idx: 2,
      bookingNumber: 'BK-2026-DEMO-03',
      status: 'confirmed',
      paymentStatus: 'paid',
      hotelConfirmation: 'confirmed',
      cabConfirmation: 'pending',
      voucherStatus: 'pending',
      travelOffset: 15,
      duration: 5,
      amount: 250000,
      paid: 250000,
    },
    {
      idx: 3,
      bookingNumber: 'BK-2026-DEMO-04',
      status: 'confirmed',
      paymentStatus: 'paid',
      hotelConfirmation: 'confirmed',
      cabConfirmation: 'confirmed',
      voucherStatus: 'issued',
      travelOffset: 6,
      duration: 7,
      amount: 180000,
      paid: 180000,
    },
    {
      idx: 4,
      bookingNumber: 'BK-2026-DEMO-05',
      status: 'in_progress',
      paymentStatus: 'paid',
      hotelConfirmation: 'confirmed',
      cabConfirmation: 'confirmed',
      voucherStatus: 'sent',
      travelOffset: -3,
      duration: 6,
      amount: 55000,
      paid: 55000,
    },
    {
      idx: 5,
      bookingNumber: 'BK-2026-DEMO-06',
      status: 'in_progress',
      paymentStatus: 'paid',
      hotelConfirmation: 'confirmed',
      cabConfirmation: 'confirmed',
      voucherStatus: 'issued',
      travelOffset: 0,
      duration: 5,
      amount: 320000,
      paid: 320000,
    },
    {
      idx: 6,
      bookingNumber: 'BK-2026-DEMO-07',
      status: 'in_progress',
      paymentStatus: 'paid',
      hotelConfirmation: 'confirmed',
      cabConfirmation: 'confirmed',
      voucherStatus: 'sent',
      travelOffset: -5,
      duration: 5,
      amount: 165000,
      paid: 165000,
    },
    {
      idx: 7,
      bookingNumber: 'BK-2026-DEMO-08',
      status: 'completed',
      paymentStatus: 'paid',
      hotelConfirmation: 'confirmed',
      cabConfirmation: 'confirmed',
      voucherStatus: 'redeemed',
      travelOffset: -18,
      duration: 8,
      amount: 450000,
      paid: 450000,
    },
    {
      idx: 8,
      bookingNumber: 'BK-2026-DEMO-09',
      status: 'pending',
      paymentStatus: 'pending',
      hotelConfirmation: 'pending',
      cabConfirmation: 'pending',
      voucherStatus: 'pending',
      travelOffset: 4,
      duration: 4,
      amount: 42000,
      paid: 0,
    },
    {
      idx: 9,
      bookingNumber: 'BK-2026-DEMO-10',
      status: 'confirmed',
      paymentStatus: 'partial',
      hotelConfirmation: 'confirmed',
      cabConfirmation: 'pending',
      voucherStatus: 'pending',
      travelOffset: 20,
      duration: 4,
      amount: 600000,
      paid: 200000,
    },
  ];

  const bookings = [];

  for (const plan of bookingPlans) {
    const leadSrc = DEMO_LEADS[plan.idx];
    const travelDate = addDays(TODAY, plan.travelOffset);
    const returnDate = addDays(travelDate, plan.duration);
    const branch = branchAt(plan.idx);
    const adults = leadSrc.adults || Math.max(1, Math.floor((leadSrc.travelers || 2) * 0.7));
    const children = leadSrc.children || Math.max(0, (leadSrc.travelers || 2) - adults);

    const lead = await ensureLead(
      {
        ...leadSrc,
        travelDate,
        returnDate,
        adults,
        children,
      },
      branch._id,
      admin?._id
    );

    const quoteNumber = `Q-2026-DEMO-${String(plan.idx + 1).padStart(2, '0')}`;
    const quote = await Quotation.findOneAndUpdate(
      { quoteNumber },
      {
        quoteNumber,
        lead: lead._id,
        package: pkg._id,
        packageSnapshot: { name: `${leadSrc.destination} Package`, destination: leadSrc.destination },
        status: 'approved',
        pricing: { total: plan.amount, baseCost: plan.amount * 0.6, taxes: plan.amount * 0.1 },
        createdBy: admin?._id,
        branchId: branch._id,
      },
      { upsert: true, new: true }
    );

    await Payment.findOneAndUpdate(
      { invoiceNumber: `INV-2026-DEMO-${String(plan.idx + 1).padStart(2, '0')}` },
      {
        invoiceNumber: `INV-2026-DEMO-${String(plan.idx + 1).padStart(2, '0')}`,
        lead: lead._id,
        quotation: quote._id,
        customerName: leadSrc.name,
        amount: plan.amount,
        paidAmount: plan.paid,
        status: plan.paymentStatus,
        branchId: branch._id,
        createdBy: admin?._id,
      },
      { upsert: true, new: true }
    );

    const hotelStatus = plan.hotelConfirmation === 'confirmed' ? 'confirmed' : 'pending';
    const cabStatus = plan.cabConfirmation === 'confirmed' ? 'confirmed' : 'pending';

    const booking = await ensureBooking({
      bookingNumber: plan.bookingNumber,
      lead: lead._id,
      quotation: quote._id,
      customerName: leadSrc.name,
      customerPhone: leadSrc.phone,
      customerEmail: leadSrc.email,
      destination: leadSrc.destination,
      packageName: `${leadSrc.destination} ${plan.duration}D Package`,
      travelDate,
      returnDate,
      adults,
      children,
      status: plan.status,
      paymentStatus: plan.paymentStatus,
      totalAmount: plan.amount,
      advanceReceived: plan.paid,
      pendingAmount: Math.max(0, plan.amount - plan.paid),
      executiveName: admin?.name || 'Admin User',
      quotationReference: quoteNumber,
      hotelConfirmation: plan.hotelConfirmation,
      cabConfirmation: plan.cabConfirmation,
      activityConfirmation: plan.status === 'completed' ? 'confirmed' : 'pending',
      voucherStatus: plan.voucherStatus,
      hotels: [{
        hotelName: plan.idx % 3 === 0 ? 'Demo Beach Resort Goa' : plan.idx % 3 === 1 ? 'Kerala Houseboat Retreat' : 'Manali Snow View Hotel',
        destination: leadSrc.destination,
        checkIn: travelDate,
        checkOut: returnDate,
        roomType: 'Deluxe',
        status: hotelStatus,
      }],
      transport: [{
        vendorName: leadSrc.destination === 'Dubai' ? 'Dubai Transfers LLC' : 'Goa Cabs Express',
        vehicleType: leadSrc.travelers > 4 ? 'innova' : 'suv',
        pickupLocation: `${leadSrc.destination} Airport`,
        dropLocation: 'Hotel',
        pickupDate: travelDate,
        status: cabStatus,
      }],
      activities: [{
        name: `${leadSrc.destination} Sightseeing`,
        scheduledAt: addDays(travelDate, 1),
        status: plan.status === 'completed' ? 'completed' : 'pending',
      }],
      itinerary: [
        { day: 1, title: 'Arrival', description: `Welcome to ${leadSrc.destination}` },
        { day: 2, title: 'Sightseeing', description: 'Full day local tour' },
        { day: 3, title: 'Leisure', description: 'Free time / optional activities' },
      ],
      assignedTo: ops._id,
      branchId: branch._id,
    });

    bookings.push(booking);

    if (['booking_received', 'pending_verification', 'pending', 'confirmed'].includes(plan.status)) {
      await ensureTasks(
        booking,
        ops._id,
        branch._id,
        plan.status === 'confirmed' ? ['completed', 'pending', 'pending'] : ['pending', 'pending', 'pending']
      );
    }
  }

  const voucherPlans = [
    { num: 'VCH-H-2026-DEMO-01', bookingIdx: 3, type: 'hotel' },
    { num: 'VCH-T-2026-DEMO-02', bookingIdx: 4, type: 'transport' },
    { num: 'VCH-A-2026-DEMO-03', bookingIdx: 5, type: 'activity' },
    { num: 'VCH-M-2026-DEMO-04', bookingIdx: 6, type: 'master' },
  ];

  for (const v of voucherPlans) {
    const b = bookings[v.bookingIdx];
    if (!b) continue;
    const exists = await Voucher.findOne({ voucherNumber: v.num });
    if (!exists) {
      await Voucher.create({
        voucherNumber: v.num,
        booking: b._id,
        bookingNumber: b.bookingNumber,
        customerName: b.customerName,
        type: v.type,
        status: 'issued',
        branchId: b.branchId,
        details: { title: `${v.type} voucher — ${b.destination}`, validFrom: b.travelDate, validUntil: b.returnDate },
        issuedBy: ops._id,
        issuedAt: new Date(),
      });
    }
  }

  const ticketPlans = [
    { num: 'TKT-2026-DEMO-01', bookingIdx: 0, category: 'hotel_issue', subject: 'Room category mismatch', priority: 'high' },
    { num: 'TKT-2026-DEMO-02', bookingIdx: 4, category: 'cab_delay', subject: 'Driver delayed at pickup', priority: 'medium' },
    { num: 'TKT-2026-DEMO-03', bookingIdx: 8, category: 'payment_issue', subject: 'Advance payment not reflected', priority: 'high' },
  ];

  for (const t of ticketPlans) {
    const b = bookings[t.bookingIdx];
    if (!b) continue;
    const exists = await SupportTicket.findOne({ ticketNumber: t.num });
    if (!exists) {
      await SupportTicket.create({
        ticketNumber: t.num,
        booking: b._id,
        branchId: b.branchId,
        customerName: b.customerName,
        category: t.category,
        subject: t.subject,
        description: `Demo support ticket for ${b.bookingNumber}`,
        priority: t.priority,
        status: 'open',
        assignedTo: ops._id,
      });
    }
  }

  const summary = {
    leads: DEMO_LEADS.length,
    bookings: bookings.length,
    pending: bookings.filter((b) => ['booking_received', 'pending_verification', 'pending'].includes(b.status)).length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    active: bookings.filter((b) => b.status === 'in_progress').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    branches: branches.map((b) => b.name).join(', '),
  };

  console.log('Operations demo seeded successfully:');
  console.log(JSON.stringify(summary, null, 2));
  console.log('Bookings:', bookingPlans.map((p) => p.bookingNumber).join(', '));
  console.log('Login: ops@crm.com — Operations Manager dashboard');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
