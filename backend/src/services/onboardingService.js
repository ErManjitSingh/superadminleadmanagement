const Company = require('../superadmin/models/Company');

const ONBOARDING_STEPS = [
  { key: 'companyCreated', label: 'Company Created' },
  { key: 'emailVerified', label: 'Email Verified' },
  { key: 'domainConnected', label: 'Domain Connected' },
  { key: 'profileCompleted', label: 'Profile Completed' },
  { key: 'logoUploaded', label: 'Logo Uploaded' },
  { key: 'firstUserAdded', label: 'First User Added' },
  { key: 'firstLeadAdded', label: 'First Lead Added' },
  { key: 'firstQuotationCreated', label: 'First Quotation Created' },
];

function computeProgress(onboarding = {}) {
  const completed = ONBOARDING_STEPS.filter((s) => onboarding[s.key]).length;
  return {
    completed,
    total: ONBOARDING_STEPS.length,
    percent: Math.round((completed / ONBOARDING_STEPS.length) * 100),
  };
}

function formatOnboardingResponse(company) {
  const onboarding = company.onboarding || {};
  const progress = computeProgress(onboarding);
  return {
    steps: ONBOARDING_STEPS.map((s) => ({
      key: s.key,
      label: s.label,
      done: Boolean(onboarding[s.key]),
    })),
    progress,
    trialEndDate: company.trialEndDate,
    trialDaysRemaining: company.trialEndDate
      ? Math.max(0, Math.ceil((new Date(company.trialEndDate) - Date.now()) / (24 * 60 * 60 * 1000)))
      : 0,
    status: company.status,
  };
}

async function markOnboardingStep(companyId, stepKey, value = true) {
  if (!ONBOARDING_STEPS.some((s) => s.key === stepKey)) return null;
  const company = await Company.findById(companyId);
  if (!company) return null;
  company.onboarding = company.onboarding || {};
  if (company.onboarding[stepKey] === value) return company;
  company.onboarding[stepKey] = value;
  company.markModified('onboarding');
  await company.save();
  return company;
}

async function checkProfileCompleted(company) {
  const complete = Boolean(
    company.name
    && company.ownerName
    && company.phone
    && company.country
    && company.businessType,
  );
  if (complete) await markOnboardingStep(company._id, 'profileCompleted', true);
}

module.exports = {
  ONBOARDING_STEPS,
  computeProgress,
  formatOnboardingResponse,
  markOnboardingStep,
  checkProfileCompleted,
};
