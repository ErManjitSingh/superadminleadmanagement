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

function buildUserMessage({ prompt, destination, days, nights, variationSeed }) {
  const dayHint = days
    ? `Target: ${nights ?? Math.max(0, days - 1)} Nights / ${days} Days`
    : 'Infer suitable duration from the prompt if not specified';

  return `User request (follow this exactly):
${prompt}

${dayHint}
${destination ? `Default region hint: ${destination}` : ''}
Variation #${variationSeed + 1}${variationSeed > 0 ? ' — use different wording from previous draft' : ''}

Build the complete day-wise itinerary for THIS specific request only.`;
}

function parseJsonFromText(raw = '') {
  const text = String(raw).trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || text;
  return JSON.parse(candidate);
}

function getAiProvider() {
  const forced = String(process.env.AI_ITINERARY_PROVIDER || '').toLowerCase();
  if (forced === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (forced === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return null;
}

async function callGemini({ prompt, destination, days, nights, variationSeed }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: 'user',
          parts: [{ text: buildUserMessage({ prompt, destination, days, nights, variationSeed }) }],
        },
      ],
      generationConfig: {
        temperature: variationSeed > 0 ? 0.9 : 0.75,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new ApiError(
      `Gemini API error (${res.status})${errText ? `: ${errText.slice(0, 300)}` : ''}`,
      res.status >= 500 ? 502 : 400,
    );
  }

  const data = await res.json();
  const raw =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('\n') || '';
  if (!raw) {
    const blockReason = data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason;
    throw new ApiError(`Gemini returned empty response${blockReason ? `: ${blockReason}` : ''}`, 502);
  }

  return parseJsonFromText(raw);
}

async function callOpenAI({ prompt, destination, days, nights, variationSeed }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

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
          content: buildUserMessage({ prompt, destination, days, nights, variationSeed }),
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new ApiError(
      `OpenAI error (${res.status})${errText ? `: ${errText.slice(0, 200)}` : ''}`,
      res.status >= 500 ? 502 : 400,
    );
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '';
  return parseJsonFromText(raw);
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

  const provider = getAiProvider();
  if (!provider) {
    return {
      source: 'unavailable',
      reason: 'Set GEMINI_API_KEY or OPENAI_API_KEY in backend .env',
    };
  }

  const params = { prompt: text, destination, days, nights, variationSeed };
  const parsed =
    provider === 'gemini' ? await callGemini(params) : await callOpenAI(params);

  const result = normalizeDays(parsed, variationSeed);
  if (!result) throw new ApiError('AI returned empty itinerary', 502);

  return { source: provider, ...result };
}

module.exports = {
  generateItineraryFromPrompt,
  getAiProvider,
};
