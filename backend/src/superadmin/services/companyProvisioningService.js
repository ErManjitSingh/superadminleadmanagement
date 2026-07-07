const crypto = require("crypto");
const User = require('../../models/User');
const Role = require('../../models/Role');
const EmailTemplate = require('../../models/EmailTemplate');
const Company = require("../models/Company");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const { ROLES, ROLE_LABELS } = require("../../config/roles");
const { ROLE_PERMISSIONS } = require("../../config/permissions");
const ApiError = require("../../utils/apiError");
const { markOnboardingStep } = require("../../services/onboardingService");

const DEFAULT_FEATURES = {
  crm: true,
  bookings: true,
  packages: true,
  hotels: false,
  transport: false,
  activities: false,
  reports: true,
  calendar: true,
  whatsapp: false,
  email: true,
  api: false,
  payments: false,
  invoices: false,
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function generateTempPassword() {
  return crypto.randomBytes(12).toString("base64url").slice(0, 16);
}

async function ensureCompanyRoles(companyId) {
  const existing = await Role.countDocuments({ companyId });
  if (existing > 0) return;

  await Role.insertMany(
    ROLES.map((slug) => ({
      name: ROLE_LABELS[slug],
      slug,
      description: `${ROLE_LABELS[slug]} role`,
      isSystem: true,
      companyId,
      permissions: ROLE_PERMISSIONS[slug],
    })),
  );
}

async function getAdminRoleId(companyId) {
  const role = await Role.findOne({ companyId, slug: "admin" });
  if (!role) throw new ApiError(500, "Admin role not provisioned");
  return role._id;
}

const DEFAULT_EMAIL_TEMPLATES = [
  {
    name: "Welcome",
    category: "welcome",
    subject: "Welcome to {{company_name}}",
    body: "Hi {{name}},\n\nWelcome to our travel CRM workspace. Your account is ready.\n\nBest regards,\n{{company_name}}",
    sortOrder: 1,
  },
  {
    name: "Quotation Sent",
    category: "quotation",
    subject: "Your travel quotation — {{quote_number}}",
    body: "Hi {{name}},\n\nPlease find your quotation attached.\n\nRegards,\n{{company_name}}",
    sortOrder: 2,
  },
  {
    name: "Follow-up Reminder",
    category: "follow_up",
    subject: "Following up on your travel inquiry",
    body: "Hi {{name}},\n\nJust checking in regarding your travel plans.\n\nRegards,\n{{company_name}}",
    sortOrder: 3,
  },
];

async function seedDefaultEmailTemplates(companyId, adminUserId) {
  const count = await EmailTemplate.countDocuments({ companyId });
  if (count > 0) return;

  await EmailTemplate.insertMany(
    DEFAULT_EMAIL_TEMPLATES.map((t) => ({
      ...t,
      companyId,
      branchId: null,
      createdBy: adminUserId,
      enabled: true,
    })),
  );
}

async function provisionCompany({ payload, superAdminId }) {
  const planId = payload.subscriptionPlanId || payload.planId;
  const plan = await SubscriptionPlan.findById(planId).notDeleted();
  if (!plan) throw new ApiError(400, "Invalid subscription plan");

  const baseSlug = slugify(payload.slug || payload.name);
  let slug = baseSlug;
  let subdomain = slugify(payload.subdomain || baseSlug);
  let attempt = 0;

  while (
    await Company.findOne({ $or: [{ slug }, { subdomain }], deletedAt: null })
  ) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
    subdomain = `${slugify(payload.subdomain || baseSlug)}-${attempt}`;
    if (attempt > 50)
      throw new ApiError(409, "Could not generate unique company slug");
  }

  const ownerEmail = payload.ownerEmail.toLowerCase().trim();
  const existingUser = await User.findOne({
    email: ownerEmail,
    companyId: { $ne: null },
  });
  if (existingUser) throw new ApiError(409, "Owner email already registered");

  const domainType = payload.domainType === "custom" ? "custom" : "subdomain";
  const primaryDomain =
    domainType === "custom" && payload.primaryDomain
      ? String(payload.primaryDomain).toLowerCase().trim()
      : null;

  if (primaryDomain) {
    const domainTaken = await Company.findOne({
      primaryDomain,
      deletedAt: null,
    });
    if (domainTaken) throw new ApiError(409, "Custom domain already registered");
  }

  const features = { ...DEFAULT_FEATURES, ...(payload.features || {}) };
  const trialDays = payload.trialDays ?? 7;
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);

  const renewDate =
    payload.billingCycle === "yearly"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const skipEmailVerification = Boolean(payload.skipEmailVerification || superAdminId);
  const domainConnected = domainType === "subdomain" || Boolean(payload.domainVerified);

  const companyDoc = {
    name: payload.name.trim(),
    slug,
    subdomain,
    domainType,
    domainVerified: domainType === "subdomain" ? true : Boolean(payload.domainVerified),
    domainLastVerifiedAt: domainType === "subdomain" || payload.domainVerified ? new Date() : null,
    sslStatus: domainType === "custom" && payload.domainVerified ? "pending" : "not_applicable",
    businessType: payload.businessType || "",
    logo: payload.logo || null,
    ownerName: payload.ownerName.trim(),
    ownerEmail,
    ownerEmailVerified: skipEmailVerification,
    phone: payload.phone || "",
    country: payload.country || "India",
    state: payload.state || "",
    city: payload.city || "",
    address: payload.address || "",
    gst: payload.gst || "",
    timezone: payload.timezone || "Asia/Kolkata",
    currency: payload.currency || "INR",
    billingCycle: payload.billingCycle || "monthly",
    autoRenewal: payload.autoRenewal !== false,
    subscriptionPlanId: plan._id,
    status: skipEmailVerification ? (payload.status || "trial") : "pending_verification",
    storageLimitGb: payload.storageLimitGb ?? plan.storageLimitGb,
    trialEndDate,
    renewDate,
    features,
    onboarding: {
      companyCreated: true,
      emailVerified: skipEmailVerification,
      domainConnected,
      profileCompleted: Boolean(payload.businessType && payload.phone),
      logoUploaded: Boolean(payload.logo),
      firstUserAdded: false,
      firstLeadAdded: false,
      firstQuotationCreated: false,
    },
    whiteLabel: {
      appTitle: payload.name.trim(),
      primaryColor: "#7c3aed",
      secondaryColor: "#4f46e5",
      sidebarColor: "#0f172a",
    },
    tenantSettings: {
      smtpFromName: payload.name.trim(),
    },
    createdBy: superAdminId || null,
    updatedBy: superAdminId || null,
  };

  if (primaryDomain) {
    companyDoc.primaryDomain = primaryDomain;
  }

  const company = await Company.create(companyDoc);

  // Provision roles + admin user atomically. If any step fails, roll back the
  // company so we never leave an orphaned company that nobody can log into.
  let adminUser;
  const tempPassword = payload.ownerPassword || generateTempPassword();
  try {
    await ensureCompanyRoles(company._id);
    const adminRoleId = await getAdminRoleId(company._id);

    adminUser = await User.create({
      name: payload.ownerName.trim(),
      email: ownerEmail,
      password: tempPassword,
      phone: payload.phone || "",
      role: "admin",
      roleId: adminRoleId,
      department: "Management",
      companyId: company._id,
      status: "active",
    });

    company.adminUserId = adminUser._id;
    await company.save();

    await seedDefaultEmailTemplates(company._id, adminUser._id);
    await markOnboardingStep(company._id, 'firstUserAdded', true);
  } catch (err) {
    // Clean up partial provisioning so signup can be retried.
    await Promise.allSettled([
      User.deleteMany({ companyId: company._id }),
      Role.deleteMany({ companyId: company._id }),
      Company.deleteOne({ _id: company._id }),
    ]);
    throw new ApiError(
      500,
      `Failed to provision company account: ${err.message}. Please try again.`,
    );
  }

  return {
    company,
    adminUser: {
      id: adminUser._id,
      email: adminUser.email,
      name: adminUser.name,
    },
    tempPassword: payload.ownerPassword ? undefined : tempPassword,
  };
}

async function getCompanyCounts(companyId) {
  const usersCount = await User.countDocuments({
    companyId,
    status: { $ne: "disabled" },
  });
  return { usersCount };
}

module.exports = {
  DEFAULT_FEATURES,
  slugify,
  generateTempPassword,
  provisionCompany,
  getCompanyCounts,
};
