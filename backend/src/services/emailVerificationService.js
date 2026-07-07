const crypto = require('crypto');
const Company = require('../superadmin/models/Company');
const { isEmailConfiguredFor, sendMailMessage } = require('./emailService');
const { markOnboardingStep } = require('./onboardingService');
const { platformDomain, brandName } = require('../config/branding');
const ApiError = require('../utils/apiError');

const TOKEN_TTL_HOURS = 48;

function buildVerificationUrl(token, subdomain) {
  const base = subdomain
    ? `https://${subdomain}.${platformDomain}/app`
    : `https://${platformDomain}/app`;
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
}

async function issueVerificationToken(company) {
  const token = crypto.randomBytes(32).toString('hex');
  company.ownerEmailVerificationToken = token;
  company.ownerEmailVerificationExpires = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
  await company.save();
  return token;
}

async function sendOwnerVerificationEmail(company) {
  if (company.ownerEmailVerified || company.isLegacy) return { sent: false, reason: 'already_verified' };

  const loaded = await Company.findById(company._id).select('+ownerEmailVerificationToken');
  const token = loaded.ownerEmailVerificationToken
    && loaded.ownerEmailVerificationExpires > new Date()
    ? loaded.ownerEmailVerificationToken
    : await issueVerificationToken(loaded);

  const verifyUrl = buildVerificationUrl(token, company.subdomain);

  if (!(await isEmailConfiguredFor(company._id))) {
    console.log(`[EmailVerification] SMTP not configured — verify URL for ${company.ownerEmail}: ${verifyUrl}`);
    return { sent: false, reason: 'smtp_not_configured', verifyUrl };
  }

  await sendMailMessage({
    companyId: company._id,
    to: company.ownerEmail,
    subject: `Verify your email — ${company.name}`,
    html: `
      <p>Hi ${company.ownerName},</p>
      <p>Welcome to ${brandName}! Please verify your business email to activate your workspace.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Verify Email</a></p>
      <p style="color:#64748b;font-size:13px">Or copy this link: ${verifyUrl}</p>
      <p style="color:#64748b;font-size:13px">This link expires in ${TOKEN_TTL_HOURS} hours.</p>
    `,
    text: `Verify your email: ${verifyUrl}`,
  });

  return { sent: true };
}

async function verifyOwnerEmail(token) {
  if (!token) throw new ApiError(400, 'Verification token is required');

  const company = await Company.findOne({
    ownerEmailVerificationToken: token,
    ownerEmailVerificationExpires: { $gt: new Date() },
    deletedAt: null,
  }).select('+ownerEmailVerificationToken +ownerEmailVerificationExpires');

  if (!company) throw new ApiError(400, 'Invalid or expired verification link');

  company.ownerEmailVerified = true;
  company.ownerEmailVerificationToken = null;
  company.ownerEmailVerificationExpires = null;
  if (company.status === 'pending_verification') {
    company.status = 'trial';
  }
  await company.save();
  await markOnboardingStep(company._id, 'emailVerified', true);

  return company;
}

async function resendVerificationEmail(email) {
  const company = await Company.findOne({
    ownerEmail: email.toLowerCase().trim(),
    deletedAt: null,
    ownerEmailVerified: false,
  });
  if (!company) {
    return { sent: false, message: 'If an account exists, a verification email has been sent.' };
  }
  const result = await sendOwnerVerificationEmail(company);
  return { sent: result.sent, message: 'If an account exists, a verification email has been sent.' };
}

module.exports = {
  sendOwnerVerificationEmail,
  verifyOwnerEmail,
  resendVerificationEmail,
  buildVerificationUrl,
};
