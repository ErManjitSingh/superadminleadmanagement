const crypto = require("crypto");
const User = require("../../models/User");
const Role = require("../../models/Role");
const Branch = require("../../models/Branch");
const Company = require("../models/Company");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const { ROLES, ROLE_LABELS } = require("../../config/roles");
const { ROLE_PERMISSIONS } = require("../../config/permissions");
const ApiError = require("../../utils/apiError");

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

async function createDefaultBranch(companyId) {
  const existing = await Branch.findOne({ companyId, code: "HQ" });
  if (existing) return existing;

  return Branch.create({
    companyId,
    name: "Head Office",
    code: "HQ",
    status: "active",
  });
}

async function provisionCompany({ payload, superAdminId }) {
  const plan = await SubscriptionPlan.findById(
    payload.subscriptionPlanId,
  ).notDeleted();
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

  const trialDays = payload.trialDays ?? 14;
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);

  const renewDate =
    payload.billingCycle === "yearly"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const features = { ...DEFAULT_FEATURES, ...(payload.features || {}) };

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

  const company = await Company.create({
    name: payload.name.trim(),
    slug,
    subdomain,
    primaryDomain,
    domainType,
    domainVerified: domainType === "subdomain" ? true : Boolean(payload.domainVerified),
    businessType: payload.businessType || "",
    logo: payload.logo || null,
    ownerName: payload.ownerName.trim(),
    ownerEmail,
    phone: payload.phone || "",
    country: payload.country || "India",
    state: payload.state || "",
    city: payload.city || "",
    address: payload.address || "",
    gst: payload.gst || "",
    timezone: payload.timezone || "Asia/Kolkata",
    currency: payload.currency || "INR",
    subscriptionPlanId: plan._id,
    status: payload.status || "trial",
    storageLimitGb: payload.storageLimitGb ?? plan.storageLimitGb,
    trialEndDate,
    renewDate,
    features,
    createdBy: superAdminId || null,
    updatedBy: superAdminId || null,
  });

  await ensureCompanyRoles(company._id);
  const adminRoleId = await getAdminRoleId(company._id);
  const defaultBranch = await createDefaultBranch(company._id);

  const tempPassword = payload.ownerPassword || generateTempPassword();
  const adminUser = await User.create({
    name: payload.ownerName.trim(),
    email: ownerEmail,
    password: tempPassword,
    phone: payload.phone || "",
    role: "admin",
    roleId: adminRoleId,
    branchId: defaultBranch._id,
    department: "Management",
    companyId: company._id,
    status: "active",
  });

  company.adminUserId = adminUser._id;
  await company.save();

  return {
    company,
    adminUser: {
      id: adminUser._id,
      email: adminUser.email,
      name: adminUser.name,
    },
    defaultBranch: {
      id: defaultBranch._id,
      name: defaultBranch.name,
      code: defaultBranch.code,
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
