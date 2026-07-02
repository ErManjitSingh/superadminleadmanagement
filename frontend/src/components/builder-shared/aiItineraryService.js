import { defaultItineraryDay } from '../quotations/quotationUtils';

const KNOWN_CITIES = [
  'new delhi', 'delhi', 'ncr', 'chandigarh', 'ambala', 'kalka', 'pathankot',
  'amritsar', 'dehradun', 'haridwar', 'rishikesh', 'shimla', 'manali',
  'dharamshala', 'dalhousie', 'kasol', 'kullu', 'mumbai', 'jaipur', 'agra',
];

const ROUTE_HINTS = {
  delhi: 'Chandigarh → Kalka → scenic hill roads',
  'new delhi': 'Chandigarh → Kalka → scenic hill roads',
  chandigarh: 'Kalka → Solan → winding mountain highways',
  ambala: 'Kalka → Solan → hill route',
  kalka: 'Solan → Shimla ridge road (or toy train option nearby)',
  pathankot: 'Kangra Valley → Palampur → mountain route',
  amritsar: 'Pathankot → Kangra → Dharamshala/Manali direction',
  dehradun: 'Mussoorie road or Rishikesh-Haridwar belt',
  haridwar: 'Rishikesh → Devprayag → mountain ascent',
};

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

function titleCase(str = '') {
  return String(str)
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function normalizeCity(name = '') {
  const n = String(name).trim().toLowerCase();
  if (n === 'ncr' || n.includes('delhi')) return 'Delhi';
  return titleCase(n);
}

/** Extract pickup & drop cities from natural language prompt */
export function extractTravelLogistics(prompt = '') {
  const text = String(prompt).toLowerCase().replace(/\s+/g, ' ').trim();
  let pickup = '';
  let drop = '';

  const cityPattern = KNOWN_CITIES.map((c) => c.replace(/\s+/g, '\\s+')).join('|');

  // "from Delhi to Delhi" / "from delhi to delhi" round-trip
  const roundTrip = text.match(
    new RegExp(`\\bfrom\\s+(${cityPattern}|[a-z][a-z\\s]{2,18}?)\\s+to\\s+(${cityPattern}|[a-z][a-z\\s]{2,18}?)(?:\\s|$|,|\\.|\\band\\b)`, 'i'),
  );
  if (roundTrip?.[1] && roundTrip?.[2]) {
    return {
      pickup: normalizeCity(roundTrip[1]),
      drop: normalizeCity(roundTrip[2]),
      roundTrip: normalizeCity(roundTrip[1]) === normalizeCity(roundTrip[2]),
    };
  }

  const pickupPatterns = [
    new RegExp(`(?:pick\\s*up|pickup|starting|start)\\s+(?:from\\s+)?(${cityPattern})`, 'i'),
    new RegExp(`(?:pick\\s*up|pickup|starting|start)\\s+(?:from\\s+)?([a-z][a-z\\s]{2,20}?)(?:\\s+to|\\s+for|\\s+and|,|\\.|$)`, 'i'),
    new RegExp(`\\bfrom\\s+(${cityPattern})\\b`, 'i'),
    new RegExp(`\\bfrom\\s+([a-z][a-z\\s]{2,20}?)(?:\\s+to|\\s+for|\\s+covering|,|\\.|$)`, 'i'),
  ];

  for (const re of pickupPatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      pickup = normalizeCity(m[1]);
      break;
    }
  }

  const dropPatterns = [
    new RegExp(`\\bto\\s+(${cityPattern})(?:\\s*$|\\s*,|\\s*\\.|\\s+and\\b|\\s+with\\b)`, 'i'),
    new RegExp(`(?:drop|return|ending|end)\\s+(?:to\\s+|at\\s+)?(${cityPattern})`, 'i'),
    new RegExp(`(?:drop|return)\\s+(?:to\\s+)?([a-z][a-z\\s]{2,20}?)(?:\\s|$|,|\\.)`, 'i'),
    new RegExp(`\\bto\\s+(${cityPattern})\\s+(?:and\\s+back|return)`, 'i'),
    new RegExp(`\\bback\\s+to\\s+(${cityPattern})`, 'i'),
  ];

  for (const re of dropPatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      drop = normalizeCity(m[1]);
      break;
    }
  }

  if (pickup && !drop) drop = pickup;

  return { pickup, drop, roundTrip: Boolean(pickup && drop && pickup === drop) };
}

function extractPromptFlags(prompt = '') {
  const text = String(prompt).toLowerCase();
  return {
    hasShimla: text.includes('shimla'),
    hasManali: text.includes('manali'),
    hasRohtang: text.includes('rohtang'),
    hasSolang: text.includes('solang'),
    hasKufri: text.includes('kufri'),
    hasHimachal: text.includes('himachal'),
    isHoneymoon: text.includes('honeymoon'),
  };
}

function detectCuratedRoute(prompt = '', logistics = {}) {
  const flags = extractPromptFlags(prompt);
  const text = String(prompt).toLowerCase();
  const fromDelhi = logistics.pickup === 'Delhi' || /\bfrom\s+delhi\b/.test(text) || /\bdelhi\s*to\s*delhi\b/.test(text);
  const toDelhi = logistics.drop === 'Delhi' || /\bto\s+delhi\b/.test(text) || logistics.roundTrip;

  if (flags.hasShimla && flags.hasManali && fromDelhi && toDelhi) {
    if (flags.hasRohtang || flags.hasSolang) return 'delhi_shimla_manali_rohtang';
    return 'delhi_shimla_manali';
  }
  if (flags.hasShimla && flags.hasManali && flags.hasRohtang) return 'delhi_shimla_manali_rohtang';
  if (flags.hasShimla && flags.hasManali) return 'delhi_shimla_manali';
  return null;
}

function inferDurationFromPrompt(prompt = '', logistics = {}, curatedRoute = null) {
  const parsed = parseDurationFromPrompt(prompt);
  if (parsed) return parsed;

  const routes = {
    delhi_shimla_manali_rohtang: { days: 6, nights: 5 },
    delhi_shimla_manali: { days: 5, nights: 4 },
  };
  if (curatedRoute && routes[curatedRoute]) return routes[curatedRoute];

  const flags = extractPromptFlags(prompt);
  if (flags.hasShimla && flags.hasManali && (flags.hasRohtang || flags.hasSolang) && logistics.roundTrip) {
    return { days: 6, nights: 5 };
  }
  if (flags.hasShimla && flags.hasManali && logistics.roundTrip) {
    return { days: 5, nights: 4 };
  }
  if (flags.hasShimla && flags.hasManali) {
    return { days: 4, nights: 3 };
  }
  return null;
}

function dayRow(day, location, title, description, extras = {}) {
  return {
    ...defaultItineraryDay(day, location),
    day,
    title,
    description,
    accommodation: extras.accommodation || (day < 6 ? `Overnight stay in ${location}` : ''),
    meals: extras.meals || 'Breakfast & Dinner',
    activities: extras.activities || '',
    transport: extras.transport || '',
    ...extras,
  };
}

/** ChatGPT-quality curated routes for common Himachal packages */
function buildDelhiShimlaManaliRohtang(logistics, variationSeed = 0) {
  const pickup = logistics.pickup || 'Delhi';
  const drop = logistics.drop || pickup;
  const v = variationSeed % 2;

  const days = [
    dayRow(
      1,
      'Shimla',
      `${pickup} → Shimla (Approx. 340 km | 8–9 hours)`,
      v === 0
        ? `Early morning pickup from ${pickup} — hotel, home, airport (DEL), or railway station as per your convenience.

En Route (optional sightseeing):
• Pinjore Gardens — Mughal-style terraced gardens, perfect for a photo break

Afternoon/Evening:
• Arrive in Shimla and complete hotel check-in
• Evening free to explore The Ridge, Mall Road & Christ Church

Dinner & overnight stay in Shimla.`
        : `Day 1 — ${pickup} to Shimla by private AC cab (340 km | 8–9 hrs).

Morning: Depart ${pickup} after breakfast/pickup. Drive via Chandigarh → Kalka → scenic hill roads with comfort stops for meals.

Optional en route: Pinjore Gardens.

Evening: Reach Shimla, check-in at hotel. Stroll on Mall Road, The Ridge & visit Christ Church.

Overnight in Shimla.`,
      {
        meals: 'Dinner',
        activities: `Pickup ${pickup}, Pinjore Gardens (optional), Mall Road, The Ridge, Christ Church`,
        transport: `Private AC cab · Pickup: ${pickup} → Shimla`,
        accommodation: 'Overnight stay in Shimla (1 night)',
      },
    ),
    dayRow(
      2,
      'Manali',
      'Shimla Sightseeing → Manali (Approx. 250 km | 7–8 hours)',
      `Morning — Shimla:
• Jakhoo Temple (Lord Hanuman temple with valley views)
• Kufri — snow activities in winter, Himalayan Nature Park, scenic viewpoints

Afternoon:
• Drive to Manali via Mandi & Kullu Valley
• Enjoy riverside views, apple orchards & mountain scenery en route
• Hotel check-in on arrival

Overnight stay in Manali.`,
      {
        meals: 'Breakfast & Dinner',
        activities: 'Jakhoo Temple, Kufri, drive to Manali, valley views',
        transport: 'Private AC cab · Shimla → Manali (full day transfer + sightseeing)',
        accommodation: 'Overnight stay in Manali (1 night)',
      },
    ),
    dayRow(
      3,
      'Manali',
      'Rohtang Pass / Solang Valley Excursion (Full Day)',
      `Full-day excursion to Rohtang Pass (subject to weather, permit availability & seasonal opening).

Snow activities (optional, on direct payment):
• Skiing · Snow scooter · Tube sliding · Yak ride

If Rohtang Pass is closed (common in winter):
• Visit Solang Valley — paragliding, zorbing, cable car & meadow views

Return to Manali by evening.

Overnight stay in Manali.`,
      {
        meals: 'Breakfast & Dinner',
        activities: 'Rohtang Pass or Solang Valley, snow/adventure activities (optional)',
        transport: 'Private cab for Rohtang/Solang day excursion',
        accommodation: 'Overnight stay in Manali (1 night)',
      },
    ),
    dayRow(
      4,
      'Manali',
      'Manali Local Sightseeing',
      `After breakfast, explore Manali town & nearby attractions:

• Hadimba Devi Temple — ancient wooden temple in cedar forest
• Vashisht Temple & Hot Springs — natural sulphur springs
• Club House & Van Vihar — leisure spots by the Beas River

Evening:
• Shopping at Mall Road — Kullu shawls, local honey & souvenirs

Overnight stay in Manali.`,
      {
        meals: 'Breakfast & Dinner',
        activities: 'Hadimba Temple, Vashisht, Hot Springs, Club House, Van Vihar, Mall Road',
        transport: 'Private cab for local sightseeing',
        accommodation: 'Overnight stay in Manali (1 night)',
      },
    ),
    dayRow(
      5,
      'Delhi',
      `Manali → ${drop} (Approx. 540 km | 11–13 hours)`,
      `Breakfast at hotel. Check-out and begin the long downhill drive to ${drop}.

• Scenic drive via Kullu → Mandi → Chandigarh route
• Optional stops for meals & refreshments en route
• ${drop === pickup ? 'Overnight journey or hotel stay in ' + drop + ' (as per package)' : 'Arrive ' + drop + ' by late evening'}

Overnight in ${drop} or en route (as per package plan).`,
      {
        meals: 'Breakfast',
        activities: `Checkout Manali, drive to ${drop}, en route meal stops`,
        transport: `Private AC cab · Manali → ${drop}`,
        accommodation: drop === pickup ? `Overnight in ${drop} or en route` : `Overnight in ${drop}`,
      },
    ),
    dayRow(
      6,
      drop,
      `Departure from ${drop}`,
      `Tour concludes with drop at your preferred location in ${drop}:
• Airport (DEL) · Railway Station · Hotel · Home (within city limits, if included)

Thank you for choosing us — wishing you safe travels & wonderful memories of Himachal!`,
      {
        meals: 'Breakfast',
        activities: `Drop at airport/railway/hotel/home in ${drop}`,
        transport: `Drop · ${drop}`,
        accommodation: '',
      },
    ),
  ];

  return days.map((d, i) => ({
    ...d,
    id: `curated-rohtang-d${d.day}-v${variationSeed}-${Date.now()}-${i}`,
  }));
}

function buildDelhiShimlaManali(logistics, variationSeed = 0) {
  const pickup = logistics.pickup || 'Delhi';
  const drop = logistics.drop || pickup;

  const days = [
    dayRow(1, 'Shimla', `${pickup} → Shimla (Approx. 340 km | 8–9 hours)`, buildPickupDayDescription(pickup, 'Shimla', variationSeed), {
      meals: 'Dinner',
      activities: `Pickup ${pickup}, en route Pinjore Gardens (optional), Shimla check-in`,
      transport: `Private AC cab · Pickup: ${pickup} → Shimla`,
      accommodation: 'Overnight stay in Shimla',
    }),
    dayRow(2, 'Shimla', 'Shimla Local Sightseeing', DESTINATION_PLANS.shimla.sightseeing, {
      meals: 'Breakfast & Dinner',
      activities: 'Jakhoo Temple, Kufri, Mall Road, The Ridge',
      transport: 'Private cab for Shimla sightseeing',
      accommodation: 'Overnight stay in Shimla',
    }),
    dayRow(3, 'Manali', 'Shimla → Manali (Approx. 250 km | 7–8 hours)', `Morning checkout from Shimla. Drive to Manali via Kullu Valley with scenic stops.

Afternoon: Arrive Manali, hotel check-in. Evening at leisure on Mall Road.

Overnight stay in Manali.`, {
      meals: 'Breakfast & Dinner',
      activities: 'Drive Shimla to Manali, Kullu Valley views',
      transport: 'Private AC cab · Shimla → Manali',
      accommodation: 'Overnight stay in Manali',
    }),
    dayRow(4, 'Manali', 'Manali Sightseeing (Solang Valley)', DESTINATION_PLANS.manali.sightseeing, {
      meals: 'Breakfast & Dinner',
      activities: 'Hadimba Temple, Vashisht, Solang Valley',
      transport: 'Private cab for sightseeing',
      accommodation: 'Overnight stay in Manali',
    }),
    dayRow(5, drop, `Manali → ${drop} & Departure`, buildDropDayDescription(drop, 'Manali', variationSeed), {
      meals: 'Breakfast',
      activities: `Checkout, drive to ${drop}, tour ends`,
      transport: `Private AC cab · Manali → Drop: ${drop}`,
      accommodation: '',
    }),
  ];

  return days.map((d, i) => ({
    ...d,
    id: `curated-sm-d${d.day}-v${variationSeed}-${Date.now()}-${i}`,
  }));
}

const CURATED_BUILDERS = {
  delhi_shimla_manali_rohtang: buildDelhiShimlaManaliRohtang,
  delhi_shimla_manali: buildDelhiShimlaManali,
};

function buildCuratedItinerary(routeKey, logistics, variationSeed) {
  const builder = CURATED_BUILDERS[routeKey];
  if (!builder) return null;
  return builder(logistics, variationSeed);
}

function getRouteHint(pickup, destination) {
  const key = pickup.toLowerCase();
  const via = ROUTE_HINTS[key] || ROUTE_HINTS[key.replace('new ', '')];
  if (via) return via;
  return `scenic highways towards ${destination}`;
}

function buildPickupDayDescription(pickup, firstStop, variationSeed = 0) {
  const via = getRouteHint(pickup, firstStop);
  const variants = [
    `Day 1 — Pickup from ${pickup}

Morning: Our chauffeur will pick you up from your preferred location in ${pickup} — hotel, home, airport (DEL), or railway station (on prior intimation). Settle into your private AC vehicle for a comfortable hill journey.

En Route: Drive via ${via}. Enjoy panoramic views, optional refreshment breaks at dhabas/cafés, and photo stops at scenic viewpoints. Your driver knows the best routes and timing for a smooth ride.

Afternoon/Evening: Arrive in ${firstStop}. Hotel check-in, freshen up, and relax after the drive.

Dinner & overnight stay in ${firstStop}.`,

    `Pickup & Transfer: ${pickup} → ${firstStop}

Start your trip with a doorstep pickup in ${pickup}. Whether you are starting from Connaught Place, Karol Bagh, Noida, Gurgaon, or the airport — we coordinate the pickup point as per your convenience.

The journey follows ${via}, with well-timed breaks for meals and stretching. Window views shift from cityscapes to pine-covered hills as you climb towards ${firstStop}.

Reach ${firstStop}, complete check-in, and spend the evening exploring nearby markets or resting at the hotel.

Meals: Dinner | Overnight: ${firstStop}`,
  ];
  return variants[variationSeed % variants.length];
}

function buildDropDayDescription(drop, lastStop, variationSeed = 0) {
  const via = getRouteHint(drop, lastStop);
  const variants = [
    `Checkout & Drop to ${drop}

Morning: Breakfast at the hotel in ${lastStop}. Complete check-out formalities and load luggage into the cab.

Journey: Descend via ${via} on your return leg to ${drop}. The drive is relaxed with comfort stops en route.

Evening: Drop at your preferred location in ${drop} — home, hotel, airport, or railway station as discussed with your travel advisor.

Tour concludes with happy memories. Safe travels!`,

    `Final Day — ${lastStop} to ${drop}

After breakfast, bid farewell to the mountains and begin your downhill drive towards ${drop}. Your private cab will drop you at the agreed point in ${drop} (hotel/residence/airport/railway station).

Route highlights: ${via}. Keep your camera ready for last glimpses of the valleys.

Package ends on arrival in ${drop}.`,
  ];
  return variants[variationSeed % variants.length];
}

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
  const ordered = [
    { key: 'shimla', name: 'Shimla' },
    { key: 'manali', name: 'Manali' },
    { key: 'kasol', name: 'Kasol' },
    { key: 'dalhousie', name: 'Dalhousie' },
    { key: 'dharamshala', name: 'Dharamshala' },
    { key: 'kullu', name: 'Kullu' },
  ];
  const found = ordered
    .map((d) => ({ ...d, index: text.indexOf(d.key) }))
    .filter((d) => d.index >= 0)
    .sort((a, b) => a.index - b.index)
    .map((d) => d.name);
  if (found.length) return found;
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

function getRichDescription(day, totalDays, destination, prompt, logistics, variationSeed = 0) {
  const planKey = getPlanKey(day, totalDays, prompt);

  if (day === 1 && logistics.pickup) {
    return buildPickupDayDescription(logistics.pickup, destination, variationSeed);
  }
  if (day === totalDays && logistics.drop && logistics.drop !== destination) {
    return buildDropDayDescription(logistics.drop, destination, variationSeed);
  }

  const key = destination.toLowerCase();
  const plans = DESTINATION_PLANS[key];

  if (plans?.[planKey]) return plans[planKey];
  if (plans?.sightseeing && planKey === 'sightseeing') return plans.sightseeing;

  const fallback = DEFAULT_PLAN[planKey] || DEFAULT_PLAN.sightseeing;
  return typeof fallback === 'function' ? fallback(destination) : fallback;
}

function buildDayTitle(day, destination, prompt, totalDays, logistics) {
  const planKey = getPlanKey(day, totalDays, prompt);

  if (day === 1 && logistics.pickup) {
    return `Pickup from ${logistics.pickup} → ${destination}`;
  }
  if (day === totalDays && logistics.drop && logistics.drop !== destination) {
    return `${destination} → Drop at ${logistics.drop}`;
  }

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

function buildActivities(day, destination, planKey, logistics) {
  if (day === 1 && logistics.pickup) {
    return `Pickup from ${logistics.pickup}, hill drive, hotel check-in in ${destination}`;
  }
  if (planKey === 'departure' && logistics.drop) {
    return `Checkout, drive to ${logistics.drop}, tour ends`;
  }
  const acts = {
    arrival: `Transfer, hotel check-in, local market visit`,
    sightseeing: `Local sightseeing, major attractions, photography stops`,
    honeymoon: `Scenic viewpoints, couple activities, romantic dinner (optional)`,
    leisure: `Free time, optional activities, shopping`,
    departure: `Hotel check-out, onward transfer`,
  };
  return acts[planKey] || `Sightseeing in ${destination}`;
}

function buildTransport(day, totalDays, planKey, logistics, destination) {
  if (day === 1 && logistics.pickup) {
    return `Private AC cab · Pickup: ${logistics.pickup} → ${destination}`;
  }
  if (day === totalDays && logistics.drop) {
    return `Private AC cab · ${destination} → Drop: ${logistics.drop}`;
  }
  if (planKey === 'sightseeing') return 'Private cab for full-day sightseeing';
  return 'Private transfer';
}

const OPENAI_SYSTEM_PROMPT = `You are an expert Indian travel itinerary writer for a premium tour operator (Himachal, Uttarakhand, Rajasthan, Kerala, etc.).

Write day-wise itineraries that read like a professional travel brochure — detailed, engaging, and practical.

RULES:
- Each day description must be 100–200 words (use Morning / Afternoon / Evening structure).
- If the user mentions pickup from a city (e.g. Delhi, Chandigarh), Day 1 MUST clearly state:
  • Exact pickup city and pickup point options (hotel/home/airport/railway)
  • Route en route to the first destination
  • Drive duration feel and comfort stops
- If return/drop to a city is implied, the LAST day MUST state drop location in that city.
- Mention specific landmarks, experiences, and local flavour.
- Match trip type (honeymoon, family, adventure) from the prompt.
- Use warm, professional tone for customer-facing PDF quotations.

Return ONLY valid JSON:
{
  "days": [
    {
      "day": 1,
      "title": "Pickup from Delhi → Shimla",
      "description": "Full detailed description with pickup location...",
      "meals": "Dinner",
      "activities": "Pickup Delhi, drive to Shimla, check-in",
      "transport": "Private AC cab · Pickup: Delhi → Shimla"
    }
  ]
}`;

function mapGeneratedDays(dayList, stops, destination, variationSeed) {
  return dayList.map((d, i) => ({
    ...defaultItineraryDay(d.day || i + 1, stops[Math.min(i, stops.length - 1)] || destination),
    ...d,
    id: `ai-day-${d.day || i + 1}-${variationSeed}-${Date.now()}`,
    description: String(d.description || '').trim(),
    transport: d.transport || d.transportNotes || '',
  }));
}

/**
 * Generates itinerary days. Uses OpenAI when VITE_OPENAI_API_KEY is set; otherwise rich local templates.
 * @param variationSeed — increment on regenerate for alternate wording
 */
export async function generateItineraryFromAI({
  prompt,
  destination = 'Himachal Pradesh',
  days,
  nights,
  variationSeed = 0,
}) {
  const logistics = extractTravelLogistics(prompt);
  const curatedRoute = detectCuratedRoute(prompt, logistics);
  const inferred = inferDurationFromPrompt(prompt, logistics, curatedRoute);
  const parsed = parseDurationFromPrompt(prompt);

  const totalDays = parsed?.days || inferred?.days || days || 4;
  const totalNights = parsed?.nights ?? inferred?.nights ?? nights ?? Math.max(0, totalDays - 1);
  const stops = extractDestinations(prompt, destination);
  const firstStop = stops[0] || destination;
  const lastStop = stops[stops.length - 1] || destination;

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (apiKey) {
    try {
      const logisticsNote = [
        logistics.pickup ? `Pickup city: ${logistics.pickup} (must appear clearly on Day 1)` : '',
        logistics.drop ? `Drop city: ${logistics.drop} (must appear clearly on last day)` : '',
        curatedRoute === 'delhi_shimla_manali_rohtang'
          ? 'Route: Delhi → Shimla → Manali → Rohtang/Solang day → Manali local → Delhi. Include distances & drive hours.'
          : '',
      ].filter(Boolean).join('\n');

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
          temperature: variationSeed > 0 ? 0.9 : 0.75,
          max_tokens: 4096,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: OPENAI_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Create a ${totalNights} Nights / ${totalDays} Days travel itinerary.

User request: ${prompt}

Primary destination region: ${destination}
Route stops: ${logistics.pickup || 'Start'} → ${stops.join(' → ')} → ${logistics.drop || 'End'}
${logisticsNote}

Requirements:
- Exactly ${totalDays} days
- Rich descriptions with Morning / Afternoon / Evening sections
- Include approximate km & drive hours on transfer days
- Day 1 must mention pickup location if specified
- Dedicated Rohtang Pass / Solang Valley day if mentioned in prompt
- Last day must mention drop/return if applicable
- Variation #${variationSeed + 1} — ${variationSeed > 0 ? 'use fresh wording different from a previous draft' : 'first draft'}`,
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
            days: mapGeneratedDays(dayList, stops, destination, variationSeed),
            totalDays: dayList.length,
            totalNights: Math.max(0, dayList.length - 1),
            logistics,
          };
        }
      }
    } catch {
      // Fall through to local generator
    }
  }

  // Curated route templates (Delhi–Shimla–Manali–Rohtang etc.)
  if (curatedRoute) {
    const curatedDays = buildCuratedItinerary(curatedRoute, logistics, variationSeed);
    if (curatedDays?.length) {
      return {
        days: curatedDays,
        totalDays: curatedDays.length,
        totalNights: Math.max(0, curatedDays.length - 1),
        logistics,
      };
    }
  }

  const itinerary = Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const stopIndex = totalDays <= stops.length
      ? index
      : Math.floor((index / totalDays) * stops.length);
    const stop = stops[Math.min(stopIndex, stops.length - 1)] || destination;
    const planKey = getPlanKey(day, totalDays, prompt);
    const dayDest = day === 1 ? firstStop : day === totalDays ? lastStop : stop;

    return {
      ...defaultItineraryDay(day, dayDest),
      id: `ai-day-${day}-v${variationSeed}-${Date.now()}`,
      title: buildDayTitle(day, dayDest, prompt, totalDays, logistics),
      description: getRichDescription(day, totalDays, dayDest, prompt, logistics, variationSeed),
      accommodation: day < totalDays ? `Overnight at hotel in ${dayDest}` : '',
      meals: buildMeals(day, totalDays),
      activities: buildActivities(day, dayDest, planKey, logistics),
      transport: buildTransport(day, totalDays, planKey, logistics, dayDest),
    };
  });

  return { days: itinerary, totalDays, totalNights, logistics };
}
