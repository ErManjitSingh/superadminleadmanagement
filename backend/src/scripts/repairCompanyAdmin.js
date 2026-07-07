/**
 * Repair a company that has no admin user (orphaned provisioning).
 * Ensures roles exist, creates/repairs the admin user, links adminUserId.
 *
 * Usage (on server, from backend/):
 *   node src/scripts/repairCompanyAdmin.js <domainOrSubdomain> [password]
 *
 * If password is omitted, a random one is generated and printed.
 */
require("../config/env");
const mongoose = require("mongoose");
const env = require("../config/env");
const Company = require("../superadmin/models/Company");
const User = require("../models/User");
const {
  generateTempPassword,
} = require("../superadmin/services/companyProvisioningService");
const { ROLES, ROLE_LABELS } = require("../config/roles");
const { ROLE_PERMISSIONS } = require("../config/permissions");
const Role = require("../models/Role");

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
    }))
  );
}

async function repair(identifier, providedPassword) {
  const ident = String(identifier || "").toLowerCase().trim();
  if (!ident) throw new Error("Provide a domain or subdomain");

  const company = await Company.findOne({
    $or: [{ primaryDomain: ident }, { subdomain: ident }, { slug: ident }],
    deletedAt: null,
  });
  if (!company) throw new Error(`No company found for "${ident}"`);

  console.log(`Company: ${company.name} (${company._id})`);

  await ensureCompanyRoles(company._id);
  const adminRole = await Role.findOne({ companyId: company._id, slug: "admin" });
  if (!adminRole) throw new Error("Admin role could not be provisioned");

  const ownerEmail = String(company.ownerEmail).toLowerCase().trim();
  let admin = await User.findOne({ companyId: company._id, email: ownerEmail }).select("+password");

  const password = providedPassword || generateTempPassword();

  if (admin) {
    admin.password = password;
    admin.role = "admin";
    admin.roleId = adminRole._id;
    admin.status = "active";
    await admin.save();
    console.log("Existing admin user password reset.");
  } else {
    admin = await User.create({
      name: company.ownerName || "Admin",
      email: ownerEmail,
      password,
      phone: company.phone || "",
      role: "admin",
      roleId: adminRole._id,
      department: "Management",
      companyId: company._id,
      status: "active",
    });
    console.log("Admin user created.");
  }

  company.adminUserId = admin._id;
  if (company.status === "pending_verification") company.status = "trial";
  company.ownerEmailVerified = true;
  await company.save();

  console.log("---- LOGIN CREDENTIALS ----");
  console.log(`URL:      https://${company.primaryDomain || company.subdomain + "." + (process.env.PLATFORM_DOMAIN || "indiaholidaydestination.com")}/app`);
  console.log(`Email:    ${ownerEmail}`);
  console.log(`Password: ${password}`);
  console.log("---------------------------");
}

(async () => {
  const [, , identifier, password] = process.argv;
  try {
    await mongoose.connect(env.mongoUri);
    await repair(identifier, password);
    process.exit(0);
  } catch (err) {
    console.error("REPAIR_FAILED:", err.message);
    process.exit(1);
  }
})();
