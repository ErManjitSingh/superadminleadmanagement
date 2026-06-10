const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { recordWhatsAppContact } = require('../services/whatsappContactService');

const initiateWhatsAppContact = asyncHandler(async (req, res) => {
  if (!req.permissions?.whatsapp?.use) {
    throw new ApiError(403, 'You do not have permission to use WhatsApp');
  }

  const result = await recordWhatsAppContact({
    req,
    leadId: req.params.id,
    templateId: req.body.templateId || null,
  });

  res.json(result);
});

module.exports = { initiateWhatsAppContact };
