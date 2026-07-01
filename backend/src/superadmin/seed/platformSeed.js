/**
 * Platform seed — run: npm run seed:platform
 * Creates Super Admin, subscription plans, and links existing CRM as legacy tenant.
 */
const { connectDB } = require('../../config/db');
const { jwtSecret, superAdminJwtSecret } = require('../../config/env');
const SuperAdmin = require('../models/SuperAdmin');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Company = require('../models/Company');
const User = require('../../models/User');
const Branch = require('../../models/Branch');

const DEFAULT_PLANS = [
  {
    name: 'Starter',
    slug: 'starter',
    description: 'For small travel agencies getting started',
    monthlyPrice: 2999,
    yearlyPrice: 29990,
    userLimit: 5,
    branchLimit: 1,
    storageLimitGb: 5,
    leadLimit: 1000,
    bookingLimit: 200,
    features: ['crm', 'bookings', 'packages', 'reports', 'email'],
    sortOrder: 1,
  },
  {
    name: 'Professional',
    slug: 'professional',
    description: 'Growing teams with advanced sales tools',
    monthlyPrice: 5999,
    yearlyPrice: 59990,
    userLimit: 15,
    branchLimit: 3,
    storageLimitGb: 20,
    leadLimit: 5000,
    bookingLimit: 1000,
    features: ['crm', 'bookings', 'packages', 'hotels', 'transport', 'reports', 'calendar', 'email', 'whatsapp'],
    sortOrder: 2,
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Multi-branch operations at scale',
    monthlyPrice: 9999,
    yearlyPrice: 99990,
    userLimit: 50,
    branchLimit: 10,
    storageLimitGb: 50,
    leadLimit: 20000,
    bookingLimit: 5000,
    features: ['crm', 'bookings', 'packages', 'hotels', 'transport', 'activities', 'reports', 'calendar', 'whatsapp', 'email', 'payments'],
    sortOrder: 3,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Unlimited scale with API access',
    monthlyPrice: 19999,
    yearlyPrice: 199990,
    userLimit: 200,
    branchLimit: 50,
    storageLimitGb: 200,
    leadLimit: 100000,
    bookingLimit: 25000,
    features: ['crm', 'bookings', 'packages', 'hotels', 'transport', 'activities', 'reports', 'calendar', 'whatsapp', 'email', 'api', 'payments', 'invoices'],
    sortOrder: 4,
  },
  {
    name: 'Custom',
    slug: 'custom',
    description: 'Tailored plan for large organizations',
    monthlyPrice: 0,
    yearlyPrice: 0,
    userLimit: 999,
    branchLimit: 99,
    storageLimitGb: 500,
    leadLimit: 0,
    bookingLimit: 0,
    features: ['crm', 'bookings', 'packages', 'hotels', 'transport', 'activities', 'reports', 'calendar', 'whatsapp', 'email', 'api', 'payments', 'invoices'],
    isCustom: true,
    sortOrder: 5,
  },
];

async function seedPlatform() {
  if (!jwtSecret || !superAdminJwtSecret) {
    console.error('JWT_SECRET / SUPERADMIN_JWT_SECRET must be set in backend/.env');
    process.exit(1);
  }

  await connectDB();
  console.log('[Platform Seed] Connected');

  for (const plan of DEFAULT_PLANS) {
    await SubscriptionPlan.findOneAndUpdate(
      { slug: plan.slug },
      { $setOnInsert: plan },
      { upsert: true, new: true }
    );
  }
  console.log('[Platform Seed] Subscription plans ready');

  const enterprisePlan = await SubscriptionPlan.findOne({ slug: 'enterprise' });
  const adminUser = await User.findOne({ role: 'admin', email: 'admin@crm.com' });
  const defaultBranch = adminUser?.branchId
    ? await Branch.findById(adminUser.branchId)
    : await Branch.findOne();

  let legacyCompany = await Company.findOne({ isLegacy: true });
  if (!legacyCompany) {
    const trialEnd = new Date();
    trialEnd.setFullYear(trialEnd.getFullYear() + 10);

    legacyCompany = await Company.create({
      name: 'Travel CRM',
      slug: 'uno-trips',
      subdomain: 'uno-trips',
      ownerName: adminUser?.name || 'Admin User',
      ownerEmail: adminUser?.email || 'admin@crm.com',
      ownerEmailVerified: true,
      country: 'India',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      subscriptionPlanId: enterprisePlan?._id,
      status: 'active',
      storageLimitGb: 200,
      trialEndDate: trialEnd,
      renewDate: trialEnd,
      isLegacy: true,
      domainType: 'subdomain',
      domainVerified: true,
      onboarding: {
        companyCreated: true,
        emailVerified: true,
        domainConnected: true,
        profileCompleted: true,
        logoUploaded: false,
        firstUserAdded: true,
        firstLeadAdded: false,
        firstQuotationCreated: false,
      },
      adminUserId: adminUser?._id,
      defaultBranchId: defaultBranch?._id,
      features: {
        crm: true,
        bookings: true,
        packages: true,
        hotels: true,
        transport: true,
        activities: true,
        reports: true,
        calendar: true,
        whatsapp: true,
        email: true,
        api: true,
        payments: true,
        invoices: true,
      },
    });
    console.log('[Platform Seed] Legacy company created: Travel CRM');
  }

  if (legacyCompany) {
    await Company.updateOne(
      { _id: legacyCompany._id },
      {
        $set: {
          ownerEmailVerified: true,
          isLegacy: true,
          'onboarding.emailVerified': true,
          'onboarding.domainConnected': true,
        },
      },
    );
  }

  if (legacyCompany && adminUser && !adminUser.companyId) {
    await User.updateMany({ companyId: null }, { $set: { companyId: legacyCompany._id } });
    await Branch.updateMany({ companyId: null }, { $set: { companyId: legacyCompany._id } });
    const Role = require('../../models/Role');
    await Role.updateMany({ companyId: null }, { $set: { companyId: legacyCompany._id } });
    console.log('[Platform Seed] Linked existing CRM users/branches/roles to legacy company');
  }

  const superEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@indiaholidaydestination.com';
  const superPassword = process.env.SUPERADMIN_PASSWORD || process.env.SEED_PASSWORD || 'SuperAdmin@123';

  const existingSuper = await SuperAdmin.findOne({ email: superEmail });
  if (!existingSuper) {
    await SuperAdmin.create({
      name: 'Platform Super Admin',
      email: superEmail,
      password: superPassword,
      role: 'super_admin',
    });
    console.log(`[Platform Seed] Super Admin created: ${superEmail}`);
  } else {
    console.log(`[Platform Seed] Super Admin exists: ${superEmail}`);
  }

  console.log('[Platform Seed] Complete');
  process.exit(0);
}

seedPlatform().catch((err) => {
  console.error('[Platform Seed] Failed:', err);
  process.exit(1);
});
