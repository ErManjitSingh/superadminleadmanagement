const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyOwnerEmail, resendVerificationEmail } = require('../services/emailVerificationService');

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const company = await verifyOwnerEmail(token);
  res.json({
    verified: true,
    message: 'Email verified successfully',
    company: {
      id: company._id,
      name: company.name,
      subdomain: company.subdomain,
      status: company.status,
    },
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');
  const result = await resendVerificationEmail(email);
  res.json(result);
});

module.exports = { verifyEmail, resendVerification };
