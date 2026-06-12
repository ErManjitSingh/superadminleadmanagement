/**
 * Rich operations demo data for testing (safe to re-run — skips existing booking numbers).
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
const TripTask = require('../models/TripTask');
const Voucher = require('../models/Voucher');
const Package = require('../models/Package');

async function ensureBooking(data) {
  const exists = await Booking.findOne({ bookingNumber: data.bookingNumber });
  if (exists) return exists;
  return Booking.create(data);
}

async function run() {
  await connectDB();

  const branch = await Branch.findOne({ status: 'active' }).sort({ createdAt: 1 });
  const ops = await User.findOne({ email: 'ops@crm.com' });
  const admin = await User.findOne({ email: 'admin@crm.com' });
  if (!branch || !ops) throw new Error('Run main seed first (ops@crm.com + branch required)');

  const pkg = await Package.findOne({ destination: 'Goa' }) || await Package.findOne();

  await Hotel.findOneAndUpdate(
    { name: 'Demo Beach Resort Goa' },
    {
      name: 'Demo Beach Resort Goa',
      destination: 'Goa',
      location: 'Calangute, Goa',
      category: '4 Star',
      contactPerson: 'Anita Desai',
      phone: '+91 98765 11111',
      email: 'reservations@demobeach.com',
      address: 'Calangute Beach Road, Goa',
      roomTypes: [
        { name: 'Deluxe Sea View', maxOccupancy: 3, baseRate: 7500 },
        { name: 'Premium Suite', maxOccupancy: 4, baseRate: 12000 },
      ],
      contractRates: [{ roomType: 'Deluxe Sea View', rate: 7500, season: 'peak' }],
      specialNotes: 'Demo hotel for operations testing',
      branchId: branch._id,
    },
    { upsert: true, new: true }
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
            email: 'ops@goacabs.demo',
            destination: 'Goa',
            commission: 8,
            outstandingBalance: 12000,
            status: 'active',
            branchId: branch._id,
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
            branchId: branch._id,
          },
        },
        upsert: true,
      },
    },
  ]);

  const convertedLead = await Lead.findOneAndUpdate(
    { phone: '+91 98765 43210' },
    {
      name: 'Rahul Sharma',
      email: 'rahul@email.com',
      phone: '+91 98765 43210',
      destination: 'Goa',
      travelDate: new Date('2026-06-20'),
      returnDate: new Date('2026-06-25'),
      budget: 74100,
      adults: 4,
      children: 0,
      status: 'converted',
      source: 'website',
      assignedTo: admin?._id,
      branchId: branch._id,
    },
    { upsert: true, new: true }
  );

  const quote = await Quotation.findOneAndUpdate(
    { quoteNumber: 'Q-2026-DEMO-01' },
    {
      quoteNumber: 'Q-2026-DEMO-01',
      lead: convertedLead._id,
      package: pkg?._id,
      packageSnapshot: pkg?.toObject?.() || { name: 'Goa Beach Bliss 5D/4N', destination: 'Goa', duration: 5 },
      status: 'approved',
      pricing: { total: 74100, baseCost: 28500, hotelCost: 17000, cabCost: 3500, taxes: 4200, markup: 8500 },
      selectedHotels: [{ name: 'Demo Beach Resort Goa', checkIn: new Date('2026-06-20'), checkOut: new Date('2026-06-25'), roomType: 'Deluxe Sea View' }],
      selectedCabs: [{ vehicleType: 'innova', pickup: 'Goa Airport', drop: 'Calangute Hotel' }],
      selectedActivities: [{ name: 'North Goa Sightseeing', date: new Date('2026-06-21') }],
      createdBy: admin?._id,
      createdByExecutive: admin?._id,
      branchId: branch._id,
    },
    { upsert: true, new: true }
  );

  await Payment.findOneAndUpdate(
    { invoiceNumber: 'INV-2026-DEMO-01' },
    {
      invoiceNumber: 'INV-2026-DEMO-01',
      lead: convertedLead._id,
      quotation: quote._id,
      customerName: convertedLead.name,
      amount: 74100,
      paidAmount: 25000,
      status: 'partial',
      branchId: branch._id,
      createdBy: admin?._id,
    },
    { upsert: true, new: true }
  );

  const demos = [
    {
      bookingNumber: 'BK-2026-DEMO-01',
      lead: convertedLead._id,
      quotation: quote._id,
      customerName: 'Rahul Sharma',
      customerPhone: '+91 98765 43210',
      customerEmail: 'rahul@email.com',
      destination: 'Goa',
      packageName: 'Goa Beach Bliss 5D/4N',
      travelDate: new Date('2026-06-20'),
      returnDate: new Date('2026-06-25'),
      adults: 4,
      children: 0,
      status: 'booking_received',
      paymentStatus: 'partial',
      totalAmount: 74100,
      advanceReceived: 25000,
      pendingAmount: 49100,
      executiveName: admin?.name || 'Admin',
      quotationReference: 'Q-2026-DEMO-01',
      hotelConfirmation: 'pending',
      cabConfirmation: 'pending',
      voucherStatus: 'pending',
      hotels: [{ hotelName: 'Demo Beach Resort Goa', checkIn: new Date('2026-06-20'), checkOut: new Date('2026-06-25'), roomType: 'Deluxe Sea View', status: 'pending' }],
      transport: [{ vehicleType: 'innova', pickupLocation: 'Goa Airport', dropLocation: 'Calangute', status: 'pending' }],
      activities: [{ name: 'North Goa Sightseeing', scheduledAt: new Date('2026-06-21'), status: 'pending' }],
      itinerary: [
        { day: 1, title: 'Arrival & Beach', description: 'Airport pickup, hotel check-in, evening beach walk' },
        { day: 2, title: 'North Goa Tour', description: 'Fort Aguada, Calangute, Baga' },
      ],
      assignedTo: ops._id,
      branchId: branch._id,
    },
    {
      bookingNumber: 'BK-2026-DEMO-02',
      customerName: 'Priya Mehta',
      customerPhone: '+91 87654 32109',
      destination: 'Kerala',
      packageName: 'Kerala Backwaters 6D',
      travelDate: new Date('2026-07-05'),
      returnDate: new Date('2026-07-10'),
      adults: 2,
      status: 'confirmed',
      paymentStatus: 'paid',
      totalAmount: 98000,
      advanceReceived: 98000,
      pendingAmount: 0,
      hotelConfirmation: 'confirmed',
      cabConfirmation: 'pending',
      hotels: [{ hotelName: 'Kerala Houseboat', status: 'confirmed', checkIn: new Date('2026-07-05'), checkOut: new Date('2026-07-10') }],
      transport: [{ vehicleType: 'suv', pickupLocation: 'Kochi Airport', dropLocation: 'Alleppey', status: 'requested' }],
      assignedTo: ops._id,
      branchId: branch._id,
    },
    {
      bookingNumber: 'BK-2026-DEMO-03',
      customerName: 'Amit Verma',
      customerPhone: '+91 99887 76655',
      destination: 'Manali',
      packageName: 'Manali Snow Escape',
      travelDate: new Date('2026-06-14'),
      returnDate: new Date('2026-06-18'),
      adults: 3,
      status: 'in_progress',
      paymentStatus: 'paid',
      totalAmount: 65000,
      advanceReceived: 65000,
      pendingAmount: 0,
      hotelConfirmation: 'confirmed',
      cabConfirmation: 'confirmed',
      voucherStatus: 'issued',
      assignedTo: ops._id,
      branchId: branch._id,
    },
  ];

  const bookings = [];
  for (const d of demos) {
    bookings.push(await ensureBooking(d));
  }

  for (const b of bookings.slice(0, 2)) {
    const exists = await TripTask.findOne({ booking: b._id, type: 'hotel_confirmation' });
    if (!exists) {
      await TripTask.insertMany([
        { booking: b._id, branchId: branch._id, title: 'Confirm hotel reservation', type: 'hotel_confirmation', status: 'pending', assignedTo: ops._id, dueDate: b.travelDate },
        { booking: b._id, branchId: branch._id, title: 'Assign cab & driver', type: 'cab_confirmation', status: 'pending', assignedTo: ops._id, dueDate: b.travelDate },
        { booking: b._id, branchId: branch._id, title: 'Generate travel vouchers', type: 'voucher_creation', status: 'pending', assignedTo: ops._id, dueDate: b.travelDate },
      ]);
    }
  }

  const vchExists = await Voucher.findOne({ voucherNumber: 'VCH-H-2026-DEMO-01' });
  if (!vchExists && bookings[1]) {
    await Voucher.create({
      voucherNumber: 'VCH-H-2026-DEMO-01',
      booking: bookings[1]._id,
      bookingNumber: bookings[1].bookingNumber,
      customerName: bookings[1].customerName,
      type: 'hotel',
      status: 'issued',
      branchId: branch._id,
      details: { title: 'Kerala Houseboat Voucher', validFrom: bookings[1].travelDate, validUntil: bookings[1].returnDate },
      issuedBy: ops._id,
      issuedAt: new Date(),
    });
  }

  console.log('Operations demo seeded:');
  console.log('  Bookings:', demos.map((d) => d.bookingNumber).join(', '));
  console.log('  Converted lead: Rahul Sharma (+91 98765 43210)');
  console.log('  Login ops@crm.com to view operations dashboard');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
