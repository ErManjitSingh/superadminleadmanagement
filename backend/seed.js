require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Lead = require('./models/Lead');
const Followup = require('./models/Followup');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding...');
};

const seedData = async () => {
  try {
    await connectDB();

    await Followup.deleteMany();
    await Lead.deleteMany();
    await User.deleteMany();

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@travelcrm.com',
      password: 'admin123',
      role: 'admin',
    });

    const agent = await User.create({
      name: 'Travel Agent',
      email: 'agent@travelcrm.com',
      password: 'agent123',
      role: 'agent',
    });

    const leads = await Lead.insertMany([
      {
        name: 'Rahul Sharma',
        email: 'rahul@email.com',
        phone: '+91 98765 43210',
        destination: 'Goa',
        travelDate: new Date('2026-06-15'),
        budget: 75000,
        travelers: 4,
        status: 'new',
        source: 'website',
        notes: 'Interested in beach resort package',
        assignedTo: agent._id,
        createdBy: admin._id,
      },
      {
        name: 'Priya Patel',
        email: 'priya@email.com',
        phone: '+91 87654 32109',
        destination: 'Kerala',
        travelDate: new Date('2026-07-01'),
        budget: 120000,
        travelers: 2,
        status: 'contacted',
        source: 'referral',
        notes: 'Honeymoon package inquiry',
        assignedTo: agent._id,
        createdBy: admin._id,
      },
      {
        name: 'Amit Kumar',
        email: 'amit@email.com',
        phone: '+91 76543 21098',
        destination: 'Dubai',
        travelDate: new Date('2026-08-20'),
        budget: 250000,
        travelers: 3,
        status: 'qualified',
        source: 'social',
        notes: 'Family trip, needs visa assistance',
        assignedTo: agent._id,
        createdBy: agent._id,
      },
      {
        name: 'Sneha Reddy',
        email: 'sneha@email.com',
        phone: '+91 65432 10987',
        destination: 'Thailand',
        travelDate: new Date('2026-09-10'),
        budget: 180000,
        travelers: 2,
        status: 'proposal',
        source: 'phone',
        notes: 'Sent proposal for 7-day package',
        assignedTo: agent._id,
        createdBy: agent._id,
      },
      {
        name: 'Vikram Singh',
        email: 'vikram@email.com',
        phone: '+91 54321 09876',
        destination: 'Manali',
        travelDate: new Date('2026-12-25'),
        budget: 45000,
        travelers: 5,
        status: 'won',
        source: 'walk-in',
        notes: 'Booking confirmed for Christmas',
        assignedTo: admin._id,
        createdBy: admin._id,
      },
      {
        name: 'Anita Desai',
        email: 'anita@email.com',
        phone: '+91 43210 98765',
        destination: 'Maldives',
        travelDate: new Date('2026-10-05'),
        budget: 350000,
        travelers: 2,
        status: 'lost',
        source: 'website',
        notes: 'Budget mismatch, chose competitor',
        assignedTo: agent._id,
        createdBy: agent._id,
      },
    ]);

    await Followup.insertMany([
      {
        lead: leads[0]._id,
        type: 'call',
        scheduledAt: new Date(Date.now() + 86400000),
        status: 'pending',
        notes: 'Initial discovery call',
        createdBy: agent._id,
      },
      {
        lead: leads[1]._id,
        type: 'email',
        scheduledAt: new Date(Date.now() + 172800000),
        status: 'pending',
        notes: 'Send honeymoon package brochure',
        createdBy: agent._id,
      },
      {
        lead: leads[2]._id,
        type: 'meeting',
        scheduledAt: new Date(Date.now() - 86400000),
        completedAt: new Date(Date.now() - 82800000),
        status: 'completed',
        notes: 'Discussed visa requirements',
        createdBy: agent._id,
      },
      {
        lead: leads[3]._id,
        type: 'whatsapp',
        scheduledAt: new Date(Date.now() + 259200000),
        status: 'pending',
        notes: 'Follow up on proposal response',
        createdBy: agent._id,
      },
      {
        lead: leads[4]._id,
        type: 'call',
        scheduledAt: new Date(Date.now() - 604800000),
        completedAt: new Date(Date.now() - 600000000),
        status: 'completed',
        notes: 'Final payment confirmation call',
        createdBy: admin._id,
      },
    ]);

    console.log('Seed data created successfully!');
    console.log('\n--- Login Credentials ---');
    console.log('Admin: admin@travelcrm.com / admin123');
    console.log('Agent: agent@travelcrm.com / agent123');
    console.log(`\nCreated ${leads.length} leads and 5 followups`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
