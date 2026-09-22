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
10. Do NOT mention any specific pickup time, reporting time, or departure clock time (never write 9:00 AM / 8:00 AM). Use day/date wording only for pickups.

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
    '- Do NOT include pickup time, reporting time, or any clock time for departures — day/date wording only.',
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
  try {
    return JSON.parse(candidate);
  } catch (err) {
    throw new ApiError(502, `AI returned invalid JSON: ${err.message}`);
  }
}

function getAiProvider() {
  const forced = String(process.env.AI_ITINERARY_PROVIDER || '').toLowerCase();
  if (forced === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (forced === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientGeminiStatus(status) {
  return status === 429 || status === 503 || status === 500;
}

function friendlyAiBusyMessage(status, detail = '') {
  const overloaded =
    /high demand|overloaded|unavailable|try again later/i.test(detail) || status === 503;
  if (overloaded) {
    return 'AI is temporarily busy (high demand). Please tap Generate again in a few seconds.';
  }
  if (status === 429) {
    return 'AI rate limit hit. Please wait ~30 seconds and try again.';
  }
  return `AI service error (${status}). Please try again.`;
}

/** Primary + fallbacks — flash family often returns 503 under load. */
function getGeminiModelCandidates() {
  const primary = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const extras = String(process.env.GEMINI_FALLBACK_MODELS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  // Prefer models that still accept generateContent for this API key.
  // Skip retired 2.0 / gated lite ids that return 404 for new projects.
  const defaults = [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-latest',
  ];
  return [...new Set([primary, ...extras, ...defaults])];
}

async function callGeminiOnce({ apiKey, model, prompt, destination, days, nights, variationSeed }) {
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
    const err = new Error(errText || `HTTP ${res.status}`);
    err.status = res.status;
    err.detail = errText.slice(0, 400);
    throw err;
  }

  const data = await res.json();
  const raw =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('\n') || '';
  if (!raw) {
    const blockReason = data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason;
    throw new ApiError(502, `Gemini returned empty response${blockReason ? `: ${blockReason}` : ''}`);
  }

  return parseJsonFromText(raw);
}

async function callGemini({ prompt, destination, days, nights, variationSeed }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const models = getGeminiModelCandidates();
  const maxAttemptsPerModel = Math.max(1, Number(process.env.GEMINI_RETRY_ATTEMPTS) || 3);
  let lastErr;

  for (const model of models) {
    for (let attempt = 0; attempt < maxAttemptsPerModel; attempt += 1) {
      try {
        const parsed = await callGeminiOnce({
          apiKey,
          model,
          prompt,
          destination,
          days,
          nights,
          variationSeed,
        });
        if (attempt > 0 || model !== models[0]) {
          console.info(`[AI itinerary] OK via ${model} (attempt ${attempt + 1})`);
        }
        return parsed;
      } catch (err) {
        lastErr = err;
        const status = err?.status || err?.statusCode;
        console.warn(
          `[AI itinerary] ${model} failed status=${status || 'n/a'} attempt=${attempt + 1}:`,
          String(err?.detail || err?.message || '').slice(0, 160),
        );
        // Non-transient (bad key, invalid/retired model) — try next model, don't burn retries.
        if (status && !isTransientGeminiStatus(status)) {
          break;
        }
        if (attempt < maxAttemptsPerModel - 1) {
          // Longer backoff helps Gemini "high demand" 503 spikes settle.
          await sleep(1200 * 2 ** attempt + Math.floor(Math.random() * 600));
        }
      }
    }
  }

  const status = lastErr?.status || 503;
  throw new ApiError(
    status >= 500 ? 502 : 400,
    friendlyAiBusyMessage(status, lastErr?.detail || lastErr?.message || ''),
  );
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
      res.status >= 500 ? 502 : 400,
      `OpenAI error (${res.status})${errText ? `: ${errText.slice(0, 200)}` : ''}`,
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
  if (!text) throw new ApiError(400, 'Prompt is required');

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
    // Auto-failover to the other provider when both keys exist (covers Gemini 503 spikes).
    const other = provider === 'gemini' ? 'openai' : 'gemini';
    const hasOther =
      (other === 'openai' && process.env.OPENAI_API_KEY) ||
      (other === 'gemini' && process.env.GEMINI_API_KEY);
    if (!hasOther) throw err;
    try {
      parsed = other === 'gemini' ? await callGemini(params) : await callOpenAI(params);
    } catch (err2) {
      throw err; // surface the original (usually clearer) busy message
    }
    const result = normalizeDays(parsed, variationSeed);
    if (!result) throw new ApiError(502, 'AI returned empty itinerary');
    return { source: other, ...result };
  }

  const result = normalizeDays(parsed, variationSeed);
  if (!result) throw new ApiError(502, 'AI returned empty itinerary');

  return { source: provider, ...result };
}

module.exports = {
  generateItineraryFromPrompt,
  getAiProvider,
};
