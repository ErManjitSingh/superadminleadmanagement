const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { resolveCompanyFromRequest, assertCompanyAccessible } = require('../services/tenantResolveService');
const { formatOnboardingResponse } = require('../services/onboardingService');
const { platformDomain } = require('../config/branding');

const router = express.Router();

router.get(
  '/resolve',
  asyncHandler(async (req, res) => {
    const company = await resolveCompanyFromRequest(req);
    if (!company) {
      return res.json({
        resolved: false,
        reason: 'not_found',
        message: 'Workspace not found. Check your URL or contact support.',
      });
    }

    const check = assertCompanyAccessible(company);
    if (!check.ok) {
      return res.json({
        resolved: false,
        reason: check.code === 404 ? 'not_found' : 'unavailable',
        status: company.status,
        message: check.message,
      });
    }

    const onboarding = formatOnboardingResponse(company);
    const trialDaysRemaining = company.trialEndDate
      ? Math.max(0, Math.ceil((new Date(company.trialEndDate) - Date.now()) / (24 * 60 * 60 * 1000)))
      : 0;

    res.json({
      resolved: true,
      company: {
        id: company._id,
        name: company.name,
        slug: company.slug,
        subdomain: company.subdomain,
        subdomainUrl: `https://${company.subdomain}.${platformDomain}`,
        primaryDomain: company.primaryDomain,
        domainType: company.domainType,
        domainVerified: Boolean(company.domainVerified),
        sslStatus: company.sslStatus,
        status: company.status,
        logo: company.logo,
        ownerEmailVerified: Boolean(company.ownerEmailVerified),
        maintenanceMode: Boolean(company.maintenanceMode),
        trialEndDate: company.trialEndDate,
        trialDaysRemaining,
        whiteLabel: company.whiteLabel || {},
        branding: {
          appTitle: company.whiteLabel?.appTitle || company.name,
          logo: company.logo || company.tenantSettings?.brandLogoUrl || null,
          favicon: company.tenantSettings?.brandFaviconUrl || null,
          primaryColor: company.whiteLabel?.primaryColor || '#7c3aed',
          secondaryColor: company.whiteLabel?.secondaryColor || '#4f46e5',
          sidebarColor: company.whiteLabel?.sidebarColor || '#0f172a',
        },
      },
      onboarding,
    });
  }),
);

module.exports = router;
