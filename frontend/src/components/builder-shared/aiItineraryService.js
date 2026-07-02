import { defaultItineraryDay } from '../quotations/quotationUtils';

const HIMACHAL_TEMPLATES = {
  shimla: 'Explore Mall Road, Ridge & local sightseeing in Shimla',
  manali: 'Visit Solang Valley, Hadimba Temple & Mall Road in Manali',
  kasol: 'Relax by Parvati River, café hopping & nature walks in Kasol',
  dalhousie: 'Scenic viewpoints and colonial charm in Dalhousie',
  kullu: 'River rafting option and Kullu valley exploration',
};

function parseDurationFromPrompt(prompt = '') {
  const text = String(prompt).toLowerCase();
  const nightsMatch = text.match(/(\d+)\s*night/);
  const daysMatch = text.match(/(\d+)\s*day/);
  if (nightsMatch) {
    const nights = Number(nightsMatch[1]);
    return { days: nights + 1, nights };
  }
  if (daysMatch) {
    const days = Number(daysMatch[1]);
    return { days, nights: Math.max(0, days - 1) };
  }
  return null;
}

function extractDestinations(prompt = '', fallback = 'Himachal Pradesh') {
  const text = String(prompt).toLowerCase();
  const found = Object.keys(HIMACHAL_TEMPLATES).filter((key) => text.includes(key));
  if (found.length) return found.map((k) => k.charAt(0).toUpperCase() + k.slice(1));
  if (text.includes('himachal')) return ['Shimla', 'Manali'];
  return [fallback];
}

function buildDayTitle(day, destination, prompt) {
  const lower = String(prompt).toLowerCase();
  if (day === 1) return `Arrival in ${destination}`;
  if (lower.includes('honeymoon') && day === 2) return `Romantic day in ${destination}`;
  if (day <= 3) return `Sightseeing in ${destination}`;
  return `Explore ${destination} & leisure time`;
}

function buildDayDescription(day, destination, prompt) {
  const key = destination.toLowerCase();
  if (day === 1) {
    return `Welcome to ${destination}. Transfer to hotel, check-in and evening at leisure. Briefing about the trip.`;
  }
  const template = HIMACHAL_TEMPLATES[key];
  if (template) return template;
  if (String(prompt).toLowerCase().includes('honeymoon')) {
    return `Private sightseeing, scenic spots and couple-friendly experiences in ${destination}.`;
  }
  return `Full day local sightseeing and experiences in ${destination} as per agent notes.`;
}

/**
 * Generates itinerary days. Designed for future OpenAI integration via VITE_OPENAI_API_KEY.
 */
export async function generateItineraryFromAI({ prompt, destination = 'Himachal Pradesh', days, nights }) {
  const parsed = parseDurationFromPrompt(prompt);
  const totalDays = days || parsed?.days || 4;
  const totalNights = nights ?? parsed?.nights ?? Math.max(0, totalDays - 1);
  const stops = extractDestinations(prompt, destination);

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content:
                'You are a travel itinerary writer for Indian tour packages. Return JSON array only: [{day,title,description}].',
            },
            {
              role: 'user',
              content: `Create a ${totalNights} Nights ${totalDays} Days itinerary for: ${prompt}. Destination region: ${destination}.`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || '';
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedDays = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsedDays) && parsedDays.length) {
            return {
              days: parsedDays.map((d, i) => ({
                ...defaultItineraryDay(d.day || i + 1, destination),
                ...d,
                id: `ai-day-${d.day || i + 1}`,
              })),
              totalDays: parsedDays.length,
              totalNights: Math.max(0, parsedDays.length - 1),
            };
          }
        }
      }
    } catch {
      // Fall through to local generator
    }
  }

  const itinerary = Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const stop = stops[Math.min(index, stops.length - 1)] || destination;
    return {
      ...defaultItineraryDay(day, stop),
      id: `ai-day-${day}`,
      title: buildDayTitle(day, stop, prompt),
      description: buildDayDescription(day, stop, prompt),
      accommodation: day < totalDays ? `${stop} hotel` : '',
      meals: day === 1 ? 'Dinner' : day === totalDays ? 'Breakfast' : 'Breakfast & Dinner',
    };
  });

  return { days: itinerary, totalDays, totalNights };
}
