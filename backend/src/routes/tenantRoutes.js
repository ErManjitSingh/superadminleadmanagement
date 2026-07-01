const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { resolveCompanyFromRequest } = require('../services/tenantResolveService');

const router = express.Router();

router.get(
  '/resolve',
  asyncHandler(async (req, res) => {
    const company = await resolveCompanyFromRequest(req);
    if (!company) {
      return res.json({ resolved: false });
    }
    res.json({
      resolved: true,
      company: {
        id: company._id,
        name: company.name,
        slug: company.slug,
        subdomain: company.subdomain,
        status: company.status,
        logo: company.logo,
      },
    });
  })
);

module.exports = router;
