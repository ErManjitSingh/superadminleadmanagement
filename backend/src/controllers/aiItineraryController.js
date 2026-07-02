const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { generateItineraryFromPrompt } = require('../services/aiItineraryGenerationService');

const generateItinerary = asyncHandler(async (req, res) => {
  const { prompt, destination, days, nights, variationSeed } = req.body || {};

  if (!prompt?.trim()) {
    throw new ApiError('prompt is required', 400);
  }

  const result = await generateItineraryFromPrompt({
    prompt: prompt.trim(),
    destination,
    days: days ? Number(days) : undefined,
    nights: nights != null ? Number(nights) : undefined,
    variationSeed: Number(variationSeed) || 0,
  });

  if (result.source === 'unavailable') {
    return res.status(503).json({
      success: false,
      code: 'AI_NOT_CONFIGURED',
      message: 'Add GEMINI_API_KEY or OPENAI_API_KEY in backend .env (Gemini: https://aistudio.google.com/apikey)',
    });
  }

  res.json({
    success: true,
    ...result,
  });
});

module.exports = {
  generateItinerary,
};
