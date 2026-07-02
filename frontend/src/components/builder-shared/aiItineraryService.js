import { defaultItineraryDay } from '../quotations/quotationUtils';

/** Rich day-wise content templates — used when OpenAI key is not set */
const DESTINATION_PLANS = {
  shimla: {
    arrival: `Upon arrival in Shimla, our representative will greet you and assist with a comfortable transfer to your hotel. Complete check-in formalities and take some time to freshen up after the journey.

In the evening, take a leisurely stroll along the famous Mall Road and The Ridge — Shimla's heart with colonial-era buildings, cosy cafés, and panoramic views of the surrounding hills. Visit Christ Church, one of North India's oldest churches, and enjoy the pleasant mountain air.

Dinner at the hotel or a local restaurant. Overnight stay in Shimla.`,
    sightseeing: `After a hearty breakfast at the hotel, proceed for a full day of sightseeing in and around Shimla.

Morning: Visit Jakhu Temple, dedicated to Lord Hanuman, perched atop Jakhu Hill with sweeping valley views (ropeway ride optional). Explore the historic Gaiety Theatre and the Viceregal Lodge (Indian Institute of Advanced Study) — a masterpiece of British architecture.

Afternoon: Drive to Kufri (approx. 16 km), a popular hill station known for snow activities in winter, horse riding, and the Himalayan Nature Park. Capture photos at Green Valley and the scenic viewpoints en route.

Evening: Return to Shimla for leisure time at Lakkar Bazaar — famous for wooden crafts and souvenirs. Overnight stay in Shimla.`,
    honeymoon: `Begin the day with breakfast at your hotel, followed by a romantic morning walk along The Ridge and Scandal Point — one of Shimla's most picturesque spots.

Mid-morning: Visit Chadwick Falls or take a private cab to Naldehra for a peaceful picnic amidst pine forests and rolling meadows — perfect for couples seeking quiet time together.

Afternoon: Enjoy couple spa session (optional) or explore Mall Road cafés. Stop at a viewpoint for memorable photographs with the Himalayas in the background.

Even evening: Candlelight dinner arrangement at a scenic restaurant (on direct payment basis). Overnight stay in Shimla.`,
    leisure: `After breakfast, the day is kept flexible for leisure and personal exploration. You may revisit Mall Road for shopping, try local Himachali cuisine, or simply relax at the hotel.

Optional activities (on direct payment): Toy train ride on the Kalka-Shimla UNESCO heritage railway, visit to Tara Devi Temple, or a short trek in the surrounding pine forests.

Evening at leisure. Overnight stay in Shimla.`,
    departure: `Enjoy breakfast at the hotel. Check-out and proceed for departure with wonderful memories of Shimla. Our team will assist with your onward transfer to the railway station or bus stand as per your travel plan.`,
  },
  manali: {
    arrival: `Arrive in Manali and transfer to your hotel nestled amid apple orchards and deodar forests. Complete check-in and unwind after the scenic mountain drive.

Evening: Take a relaxed walk on Mall Road — Manali's bustling lane lined with shops, restaurants, and adventure gear stores. Visit the historic Hadimba Devi Temple area nearby and soak in the cool mountain breeze.

Dinner and overnight stay in Manali.`,
    sightseeing: `After breakfast, embark on a comprehensive Manali sightseeing tour.

Morning: Visit Hadimba Devi Temple — an ancient wooden temple set in a cedar forest, followed by the Manu Temple and Vashisht Village, famous for its natural hot water springs.

Afternoon: Drive to Solang Valley — a paradise for adventure lovers offering paragliding, zorbing, and cable car rides (activities on direct payment). Continue to Rohtang Pass viewpoint area if road and permits allow (seasonal).

Evening: Return to Manali. Explore Old Manali's café culture and riverside walks along the Beas. Overnight stay in Manali.`,
    honeymoon: `Wake up to a beautiful mountain morning and enjoy breakfast together at the hotel.

Late morning: Private cab to Solang Valley for scenic photography and couple activities — paragliding or a quiet picnic by the meadows (optional, on direct payment).

Afternoon: Visit Naggar Castle or Jana Waterfall for a romantic offbeat experience away from the crowds.

Evening: Stroll through Old Manali lanes, riverside dinner at a café overlooking the Beas River. Overnight stay in Manali.`,
    leisure: `Breakfast at the hotel. Day at leisure to explore Manali at your own pace — shop for Kullu shawls and local honey on Mall Road, visit the Tibetan Monastery, or relax at a riverside café.

Optional: River rafting on the Beas, hamlet walks in Vashisht, or a day trip to Naggar (on direct payment).

Overnight stay in Manali.`,
    departure: `Breakfast at the hotel. Check-out from the hotel and transfer for your onward journey. Depart Manali with cherished memories of the mountains.`,
  },
  kasol: {
    arrival: `Arrive in Kasol — the backpacker hub of Parvati Valley. Transfer to your hotel/camp and check in.

Evening: Walk along the Parvati River, explore the laid-back Israeli café culture, and enjoy the peaceful riverside ambience. Kasol is perfect for unwinding amid pine forests and mountain streams.

Dinner and overnight in Kasol.`,
    sightseeing: `After breakfast, explore the best of Parvati Valley.

Morning: Visit Manikaran Sahib — a sacred gurudwara known for its hot springs, located just 4 km from Kasol. Experience the spiritual atmosphere and langar prasad.

Afternoon: Trek or drive to Chalal village — a short scenic walk through pine forests along the river. Alternatively visit Tosh or Kheerganga trailhead for valley views.

Evening: Return to Kasol for café hopping and stargazing. Overnight in Kasol.`,
    honeymoon: `A relaxed morning with breakfast by the riverside. Take a private walk through Chalal's forest trail hand in hand, with the sound of the Parvati River alongside.

Afternoon: Picnic-style lunch at a scenic café. Optional visit to Manikaran hot springs for a unique couple experience.

Evening: Quiet dinner at a riverside restaurant under the stars. Overnight in Kasol.`,
    leisure: `Breakfast at leisure. Spend the day café hopping, reading by the river, or exploring local handicraft shops. Kasol is ideal for slow travel and nature connection.

Optional: Day trek to Kheerganga, visit Malana village, or yoga sessions (on direct payment).

Overnight in Kasol.`,
    departure: `Breakfast and check-out. Transfer for departure from Kasol with memories of the serene Parvati Valley.`,
  },
  dalhousie: {
    arrival: `Arrive in Dalhousie — a charming colonial hill town spread across five hills. Transfer to hotel and check in.

Evening: Stroll along Gandhi Chowk and Subhash Chowk, browse local shops, and enjoy the crisp mountain air. Visit St. John's Church if time permits.

Dinner and overnight in Dalhousie.`,
    sightseeing: `After breakfast, full day exploration of Dalhousie and Khajjiar.

Morning: Drive to Khajjiar — often called "Mini Switzerland of India" — with its lush meadow, lake, and dense deodar forests. Enjoy photography and optional zorbing/horse riding.

Afternoon: Visit Kalatop Wildlife Sanctuary for nature walks, then Panchpula waterfalls — a scenic spot with streams and memorials.

Evening: Return to Dalhousie. Overnight stay.`,
    honeymoon: `Romantic breakfast followed by a private drive to Khajjiar meadow for couple photos and quiet time amid rolling greens.

Afternoon: Visit Dainkund Peak viewpoint for panoramic Himalayan vistas — on clear days, views stretch across the Pir Panjal range.

Evening: Leisure walk at Gandhi Chowk. Overnight in Dalhousie.`,
    leisure: `Day at leisure in Dalhousie. Explore colonial architecture, visit churches, or simply enjoy hotel amenities.

Optional: Day trip to Chamba town for ancient temples and Bhuri Singh Museum.

Overnight in Dalhousie.`,
    departure: `Breakfast, check-out, and transfer for onward journey from Dalhousie.`,
  },
  kullu: {
    arrival: `Arrive in Kullu Valley. Transfer to hotel and check in amid apple orchards and the Beas River valley.

Evening: Visit the famous Kullu Shawl factories and local market. Enjoy riverside views and mountain sunset.

Overnight in Kullu.`,
    sightseeing: `After breakfast, explore Kullu Valley highlights.

Morning: Visit Bijli Mahadev Temple — known for its stunning valley views and lightning-struck Shiva lingam legend. Drive through scenic apple belt villages.

Afternoon: Optional river rafting on the Beas (on direct payment) or visit Naggar Castle and Roerich Art Gallery.

Evening: Return to hotel. Overnight in Kullu.`,
    honeymoon: `Private valley drive through apple orchards, riverside picnic, and visit to secluded viewpoints. Romantic dinner with mountain views. Overnight in Kullu.`,
    leisure: `Leisure day in Kullu — shopping, riverside walks, or optional adventure activities. Overnight in Kullu.`,
    departure: `Breakfast, check-out, and departure from Kullu.`,
  },
};

const DEFAULT_PLAN = {
  arrival: (dest) => `Welcome to ${dest}! Upon arrival, our representative will assist you with a smooth transfer to your hotel. After check-in, take time to freshen up and acclimatise to the destination.

In the evening, explore the local market and nearby attractions at a relaxed pace. Enjoy dinner at the hotel or a recommended local restaurant.

Overnight stay in ${dest}.`,
  sightseeing: (dest) => `After breakfast at the hotel, proceed for a full day of sightseeing in ${dest}.

Morning: Cover the major landmarks and viewpoints with your private cab — your driver will take you to the most popular attractions as per local recommendations.

Afternoon: Continue exploring cultural sites, scenic spots, and photo points. Stop for lunch at a local restaurant (on direct payment).

Evening: Return to the hotel for leisure time. You may explore nearby markets for souvenirs and local specialities.

Overnight stay in ${dest}.`,
  honeymoon: (dest) => `Start your romantic day with breakfast at the hotel. Morning at leisure for a couple walk or private sightseeing to scenic viewpoints around ${dest}.

Afternoon: Visit handpicked romantic spots — quiet meadows, lakeside areas, or heritage sites perfect for memorable photographs together.

Evening: Leisure time and dinner at a scenic location. Overnight stay in ${dest}.`,
  leisure: (dest) => `Breakfast at the hotel. Day kept at leisure to explore ${dest} at your own pace — shopping, café visits, optional activities, or simply relaxing at the hotel.

Evening free for personal plans. Overnight stay in ${dest}.`,
  departure: (dest) => `Enjoy breakfast at the hotel. Check-out and transfer for your onward journey from ${dest}. Depart with wonderful travel memories.`,
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
  const keys = Object.keys(DESTINATION_PLANS);
  const found = keys.filter((key) => text.includes(key));
  if (found.length) return found.map((k) => k.charAt(0).toUpperCase() + k.slice(1));
  if (text.includes('himachal')) return ['Shimla', 'Manali'];
  return [fallback];
}

function isHoneymoonPrompt(prompt = '') {
  return String(prompt).toLowerCase().includes('honeymoon');
}

function getPlanKey(day, totalDays, prompt) {
  if (day === 1) return 'arrival';
  if (day === totalDays) return 'departure';
  if (isHoneymoonPrompt(prompt) && day === 2) return 'honeymoon';
  if (day === totalDays - 1 && totalDays > 3) return 'leisure';
  return 'sightseeing';
}

function getRichDescription(day, totalDays, destination, prompt) {
  const key = destination.toLowerCase();
  const planKey = getPlanKey(day, totalDays, prompt);
  const plans = DESTINATION_PLANS[key];

  if (plans?.[planKey]) return plans[planKey];
  if (plans?.sightseeing && planKey === 'sightseeing') return plans.sightseeing;

  const fallback = DEFAULT_PLAN[planKey] || DEFAULT_PLAN.sightseeing;
  return typeof fallback === 'function' ? fallback(destination) : fallback;
}

function buildDayTitle(day, destination, prompt, totalDays) {
  const planKey = getPlanKey(day, totalDays, prompt);
  const titles = {
    arrival: `Arrival & Welcome in ${destination}`,
    departure: `Departure from ${destination}`,
    honeymoon: `Romantic Experiences in ${destination}`,
    leisure: `Leisure Day in ${destination}`,
    sightseeing: `Full Day Sightseeing in ${destination}`,
  };
  return titles[planKey] || `Day ${day} — ${destination}`;
}

function buildMeals(day, totalDays) {
  if (day === 1) return 'Dinner';
  if (day === totalDays) return 'Breakfast';
  return 'Breakfast & Dinner';
}

function buildActivities(day, destination, planKey) {
  const acts = {
    arrival: `Airport/Railway station transfer, hotel check-in, Mall Road / local market visit`,
    sightseeing: `Local sightseeing, major attractions, photography stops`,
    honeymoon: `Scenic viewpoints, couple activities, romantic dinner (optional)`,
    leisure: `Free time, optional activities, shopping`,
    departure: `Hotel check-out, onward transfer`,
  };
  return acts[planKey] || `Sightseeing in ${destination}`;
}

const OPENAI_SYSTEM_PROMPT = `You are an expert Indian travel itinerary writer for a premium tour operator (Himachal, Uttarakhand, Rajasthan, Kerala, etc.).

Write day-wise itineraries that read like a professional travel brochure — detailed, engaging, and practical.

RULES:
- Each day description must be 100–180 words (4–6 sentences minimum, can use short paragraphs).
- Structure descriptions with Morning / Afternoon / Evening when it fits naturally.
- Mention specific landmarks, experiences, and local flavour — not generic one-liners.
- Match the trip type (honeymoon, family, adventure) from the user prompt.
- Day 1 = arrival & transfer; last day = checkout & departure.
- Use warm, professional tone suitable for customer-facing PDF quotations.

Return ONLY valid JSON in this exact shape (no markdown):
{
  "days": [
    {
      "day": 1,
      "title": "Short catchy title",
      "description": "Full detailed description...",
      "meals": "Breakfast & Dinner",
      "activities": "Brief activity summary",
      "transport": "Private Cab"
    }
  ]
}`;

/**
 * Generates itinerary days. Uses OpenAI when VITE_OPENAI_API_KEY is set; otherwise rich local templates.
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
          temperature: 0.75,
          max_tokens: 4096,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: OPENAI_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Create a ${totalNights} Nights / ${totalDays} Days travel itinerary.

User request: ${prompt}

Primary destination region: ${destination}
Route stops to cover: ${stops.join(' → ')}

Requirements:
- Exactly ${totalDays} days
- Rich, detailed descriptions (100–180 words each day)
- Specific place names and experiences
- Appropriate for the trip type mentioned in the prompt`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || '';
        const parsedJson = JSON.parse(raw);
        const parsedDays = parsedJson.days || parsedJson.itinerary || parsedJson;
        const dayList = Array.isArray(parsedDays) ? parsedDays : [];
        if (dayList.length) {
          return {
            days: dayList.map((d, i) => ({
              ...defaultItineraryDay(d.day || i + 1, stops[Math.min(i, stops.length - 1)] || destination),
              ...d,
              id: `ai-day-${d.day || i + 1}`,
              description: String(d.description || '').trim(),
            })),
            totalDays: dayList.length,
            totalNights: Math.max(0, dayList.length - 1),
          };
        }
      }
    } catch {
      // Fall through to local generator
    }
  }

  const itinerary = Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const stopIndex = totalDays <= stops.length
      ? index
      : Math.floor((index / totalDays) * stops.length);
    const stop = stops[Math.min(stopIndex, stops.length - 1)] || destination;
    const planKey = getPlanKey(day, totalDays, prompt);

    return {
      ...defaultItineraryDay(day, stop),
      id: `ai-day-${day}`,
      title: buildDayTitle(day, stop, prompt, totalDays),
      description: getRichDescription(day, totalDays, stop, prompt),
      accommodation: day < totalDays ? `Overnight at hotel in ${stop}` : '',
      meals: buildMeals(day, totalDays),
      activities: buildActivities(day, stop, planKey),
      transport: day === 1 || day === totalDays ? 'Private transfer' : 'Private Cab for sightseeing',
    };
  });

  return { days: itinerary, totalDays, totalNights };
}
