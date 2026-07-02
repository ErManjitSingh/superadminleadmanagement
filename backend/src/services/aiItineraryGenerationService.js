const ApiError = require('../utils/apiError');

const SYSTEM_PROMPT = `You are an expert Indian and international travel itinerary writer for a premium tour operator.

Write day-wise itineraries exactly as requested in the user's prompt. Do NOT reuse a fixed template — every itinerary must be unique to that request.

FORMAT (like ChatGPT travel answers):
- Each day: clear title with route or activity (include Approx. km | hours on transfer days when known)
- Description uses Morning / Afternoon / Evening sections
- Use bullet points (•) for attractions and activities
- Mention pickup city & drop city when stated in the prompt
- Include real landmark names for the destinations mentioned
- Match trip type (honeymoon, family, adventure, pilgrimage, etc.)
- Professional, warm tone suitable for customer PDF quotations
- 80–180 words per day description

Return ONLY valid JSON:
{
  "days": [
    {
      "day": 1,
      "title": "Day title with route if transfer",
      "description": "Full formatted description...",
      "meals": "Breakfast & Dinner",
      "activities": "Short activity summary",
      "transport": "Private AC cab · details"
    }
  ],
  "totalDays": 5,
  "totalNights": 4,
  "pickup": "Delhi or null",
  "drop": "Delhi or null"
}`;

async function callOpenAI({ prompt, destination, days, nights, variationSeed }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const dayHint = days ? `Target: ${nights ?? Math.max(0, days - 1)} Nights / ${days} Days` : 'Infer suitable duration from the prompt if not specified';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: variationSeed > 0 ? 0.88 : 0.72,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `User request (follow this exactly):
${prompt}

${dayHint}
${destination ? `Default region hint: ${destination}` : ''}
Variation #${variationSeed + 1}${variationSeed > 0 ? ' — use different wording from previous draft' : ''}

Build the complete day-wise itinerary for THIS specific request only.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new ApiError(`AI service error (${res.status})${errText ? `: ${errText.slice(0, 200)}` : ''}`, res.status >= 500 ? 502 : 400);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '';
  return JSON.parse(raw);
}

function normalizeDays(parsed, variationSeed) {
  const list = parsed?.days || parsed?.itinerary;
  if (!Array.isArray(list) || !list.length) return null;

  const days = list.map((d, i) => ({
    day: Number(d.day) || i + 1,
    title: String(d.title || `Day ${i + 1}`).trim(),
    description: String(d.description || '').trim(),
    meals: d.meals || 'Breakfast & Dinner',
    activities: d.activities || '',
    transport: d.transport || d.transportNotes || 'Private transfer',
    accommodation: d.accommodation || '',
    id: `ai-${Number(d.day) || i + 1}-v${variationSeed}-${Date.now()}-${i}`,
  }));

  const totalDays = Number(parsed.totalDays) || days.length;
  const totalNights = Number(parsed.totalNights) ?? Math.max(0, totalDays - 1);

  return {
    days,
    totalDays,
    totalNights,
    logistics: {
      pickup: parsed.pickup || '',
      drop: parsed.drop || '',
    },
  };
}

async function generateItineraryFromPrompt({
  prompt,
  destination,
  days,
  nights,
  variationSeed = 0,
}) {
  const text = String(prompt || '').trim();
  if (!text) throw new ApiError('Prompt is required', 400);

  if (!process.env.OPENAI_API_KEY) {
    return { source: 'unavailable', reason: 'OPENAI_API_KEY not configured' };
  }

  const parsed = await callOpenAI({ prompt: text, destination, days, nights, variationSeed });
  const result = normalizeDays(parsed, variationSeed);
  if (!result) throw new ApiError('AI returned empty itinerary', 502);

  return { source: 'openai', ...result };
}

module.exports = {
  generateItineraryFromPrompt,
};
