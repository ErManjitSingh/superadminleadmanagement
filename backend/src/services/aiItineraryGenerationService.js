const ApiError = require('../utils/apiError');

/**
 * ChatGPT-style itinerary writer.
 * Follow the user's request exactly — do not invent a different route.
 */
const SYSTEM_PROMPT = `You are a senior travel consultant writing day-wise itineraries for Indian and international holidays.

Your output must feel like a high-quality ChatGPT travel plan: specific, practical, and customer-ready for a quotation PDF.

CRITICAL RULES:
1. Follow the USER REQUEST exactly. Do not change destinations, nights, or route unless the user is vague.
2. If the user names cities (e.g. Shimla, Manali, Goa), use ONLY those cities in the correct order.
3. If the user gives nights/days (e.g. 3N/4D), produce exactly that many days.
4. If pickup/drop cities are mentioned (Delhi, Chandigarh, etc.), Day 1 and last day must include them clearly.
5. Never default to a random Himachal template when the user asked for something else.
6. Each day description: 120–220 words with Morning / Afternoon / Evening structure.
7. Use real landmarks, approximate drive times (hrs) and distances (km) on transfer days.
8. Match trip style: honeymoon, family, adventure, pilgrimage, luxury, etc.
9. Warm, professional brochure tone — no filler, no generic "enjoy your day" lines.
10. Whenever you mention a morning pickup, cab pickup, or departure time, use 9:00 AM as the standard time. Do NOT use 8:00 AM or any earlier time.

Return ONLY valid JSON (no markdown):
{
  "days": [
    {
      "day": 1,
      "title": "Clear day title (include route on transfer days)",
      "description": "Morning: ...\\n\\nAfternoon: ...\\n\\nEvening: ...",
      "meals": "Breakfast / Breakfast & Dinner / etc.",
      "activities": "Short comma-separated highlights",
      "transport": "Private cab · details",
      "accommodation": "City or hotel area if known"
    }
  ],
  "totalDays": 4,
  "totalNights": 3,
  "pickup": "City or empty string",
  "drop": "City or empty string"
}`;

function buildUserMessage({ prompt, destination, days, nights, variationSeed }) {
  const lines = [
    'Create a complete day-wise travel itinerary for the following customer request.',
    '',
    '=== CUSTOMER REQUEST (follow exactly) ===',
    prompt,
    '=== END REQUEST ===',
    '',
    'Instructions:',
    '- Build the itinerary ONLY from the customer request above.',
    '- Do not substitute different destinations.',
    '- Write detailed Morning / Afternoon / Evening content for every day.',
    '- Any morning pickup / cab pickup / departure time must be 9:00 AM (never 8:00 AM or earlier).',
    '- Titles should be specific (e.g. "Delhi → Shimla (Approx. 350 km | 8–9 hrs)").',
  ];

  if (days) {
    lines.push(
      `- Produce exactly ${days} days (${nights ?? Math.max(0, days - 1)} nights) unless the request clearly states a different duration — then follow the request.`,
    );
  } else {
    lines.push('- Infer nights/days from the request if mentioned; otherwise choose a sensible duration.');
  }

  if (destination && String(destination).trim()) {
    lines.push(
      `- Package destination field (hint only, do not override explicit cities in the request): ${destination}`,
    );
  }

  if (variationSeed > 0) {
    lines.push(`- This is regenerate #${variationSeed + 1}: keep the same route but fresher wording and alternate experiences.`);
  }

  lines.push('', 'Return JSON only.');
  return lines.join('\n');
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
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return null;
}

async function callGemini({ prompt, destination, days, nights, variationSeed }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Prefer a strong model; allow override via env.
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
        temperature: variationSeed > 0 ? 0.85 : 0.65,
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

  // gpt-4o is much closer to ChatGPT quality than mini.
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: variationSeed > 0 ? 0.8 : 0.6,
      max_tokens: 8000,
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
    accommodation: d.accommodation || d.hotel || '',
    hotel: d.hotel || d.accommodation || '',
    id: `ai-${Number(d.day) || i + 1}-v${variationSeed}-${Date.now()}-${i}`,
  }));

  const totalDays = Number(parsed.totalDays) || days.length;
  const totalNights =
    parsed.totalNights != null && parsed.totalNights !== ''
      ? Number(parsed.totalNights)
      : Math.max(0, totalDays - 1);

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
      reason: 'Set OPENAI_API_KEY or GEMINI_API_KEY in backend .env',
    };
  }

  // Prefer letting the model read duration from the prompt; only pass package days as a soft hint.
  const params = {
    prompt: text,
    destination: destination || '',
    days: days ? Number(days) : undefined,
    nights: nights != null ? Number(nights) : undefined,
    variationSeed,
  };

  let parsed;
  try {
    parsed = provider === 'gemini' ? await callGemini(params) : await callOpenAI(params);
  } catch (err) {
    // One retry with the other provider if both keys exist.
    const other = provider === 'gemini' ? 'openai' : 'gemini';
    const hasOther =
      (other === 'openai' && process.env.OPENAI_API_KEY) ||
      (other === 'gemini' && process.env.GEMINI_API_KEY);
    if (!hasOther) throw err;
    parsed = other === 'gemini' ? await callGemini(params) : await callOpenAI(params);
    const result = normalizeDays(parsed, variationSeed);
    if (!result) throw new ApiError('AI returned empty itinerary', 502);
    return { source: other, ...result };
  }

  const result = normalizeDays(parsed, variationSeed);
  if (!result) throw new ApiError('AI returned empty itinerary', 502);

  return { source: provider, ...result };
}

module.exports = {
  generateItineraryFromPrompt,
  getAiProvider,
};
