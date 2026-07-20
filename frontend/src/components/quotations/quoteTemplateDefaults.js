/** Quotation PDF & builder defaults — Explore My Bharat standard terms */

import { quoteHasHotels } from './constants';

export const QUOTE_WELCOME_TEXT = `Greetings from Explore My Bharat. Your journey surely deserves warm hospitality, comfortable stay, hassle-free transportation and proper guidance which Explore My Bharat, a reliable and growing travel organization, promises to cater at the best possible rates.

We are proud to offer packages that can't be more perfect and take you to such an enhanced experience that the only words you have for us are "True to their Commitment."

So, let our executives assist you 24/7 and create magical moments just for you.`;

export const QUOTE_WELCOME_TEXT_NO_HOTEL = `Greetings from Explore My Bharat. Your journey surely deserves hassle-free transportation and proper guidance which Explore My Bharat, a reliable and growing travel organization, promises to cater at the best possible rates.

We are proud to offer packages that can't be more perfect and take you to such an enhanced experience that the only words you have for us are "True to their Commitment."

So, let our executives assist you 24/7 and create magical moments just for you.`;

export const QUOTE_DEFAULT_EXCLUSIONS = [
  'Meals outside hotels and beverages during tour.',
  'Travel insurance and personal expenses (Telephone, liquor or other charges of personal nature).',
  'Air/rail/bus fare or entry fee to parks and monument.',
  'Expense of adventurous activities (rafting, paragliding, toy train ride, yak ride, horse ride, skiing, skating, etc.), laundry and personal guide.',
  'Increase in taxes or fuel price which may cause hike in cost of surface transportation, prior to departure, hence affecting the final cost.',
  'Services which are not mentioned in tour package.',
  'Any cost incurred due to extension, change of itinerary due to natural calamities, road blocks, vehicle breakdown, union issues and factors beyond our control.',
];

export const QUOTE_DEFAULT_EXCLUSIONS_NO_HOTEL = [
  'Meals and beverages during tour (unless mentioned in inclusions).',
  'Travel insurance and personal expenses (Telephone, liquor or other charges of personal nature).',
  'Air/rail/bus fare or entry fee to parks and monument.',
  'Expense of adventurous activities (rafting, paragliding, toy train ride, yak ride, horse ride, skiing, skating, etc.), laundry and personal guide.',
  'Increase in taxes or fuel price which may cause hike in cost of surface transportation, prior to departure, hence affecting the final cost.',
  'Services which are not mentioned in tour package.',
  'Any cost incurred due to extension, change of itinerary due to natural calamities, road blocks, vehicle breakdown, union issues and factors beyond our control.',
];

function lineMentionsHotel(text) {
  return /\bhotels?\b|\baccommodation\b|\bstay\b|\bcheck-?ins?\b|\bcheck-?outs?\b/i.test(String(text || ''));
}

function lineMentionsMeals(text) {
  return /\bbreakfast\b|\blunch\b|\bdinner\b|\bmeals?\b|\bmeal\s*plan\b/i.test(String(text || ''));
}

export function stripHotelMentionsFromLines(lines = []) {
  return (lines || [])
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .filter((line) => !lineMentionsHotel(line) && !lineMentionsMeals(line));
}

export function resolveQuoteWelcomeText(quote = {}) {
  return quoteHasHotels(quote) ? QUOTE_WELCOME_TEXT : QUOTE_WELCOME_TEXT_NO_HOTEL;
}

export const QUOTE_PAYMENT_DETAILS = [
  'Token amount is non-refundable and is mandatory to confirm any booking.',
  'The remaining balance must be paid before the tour begins.',
  'We\'ll mail you our company\'s voucher and final itinerary as your payment reflects in our account. Please share screenshots of payment for convenience.',
];

/** Official Terms & Conditions — Explore My Bharat Tours */
export const QUOTE_TERMS_AND_CONDITIONS = [
  {
    title: '1. Booking Confirmation',
    items: [
      'Token amount is non-refundable and is mandatory to confirm any booking.',
      'Bookings are confirmed only after receipt of the token / advance payment and written confirmation from Explore My Bharat Tours.',
    ],
  },
  {
    title: '2. Full Payment',
    items: [
      'The remaining balance must be paid before the tour begins.',
      'Failure to make full payment may result in automatic cancellation without any refund of the token amount.',
    ],
  },
  {
    title: '3. Cancellation Policy',
    items: [
      'More than 30 days before departure: 25% cancellation charges',
      '15–30 days before departure: 50% cancellation charges',
      '7–14 days before departure: 75% cancellation charges',
      'Less than 7 days before departure or No Show: 100% cancellation charges',
      'Token amount is non-refundable in all cases.',
      'No refund will be provided after the tour has commenced or for any unused services.',
    ],
  },
  {
    title: '4. Itinerary Changes',
    items: [
      'The company reserves the right to modify the itinerary, hotel, vehicle, sightseeing order, or route due to weather, road conditions, government restrictions, operational requirements, or force majeure without prior notice.',
      'No refund or compensation shall be payable for such changes.',
    ],
  },
  {
    title: '5. Vehicle Usage',
    items: [
      'The vehicle will operate strictly as per the confirmed itinerary.',
      'Extra sightseeing, route diversions, waiting charges, or additional kilometers will be charged separately.',
      'Night driving (after 7:30 PM) is subject to driver discretion, local regulations, and additional charges.',
    ],
  },
  {
    title: '6. Hill Area Operations',
    items: [
      'Air conditioning may be switched off on steep mountain roads for safety and vehicle performance.',
      'Rohtang Pass, Nathula Pass, and other restricted destinations are subject to permits, weather, and government regulations. No refund shall be applicable if access is denied.',
    ],
  },
  {
    title: '7. Hotel Policy',
    items: [
      'Hotels are subject to availability. In case of non-availability, an equivalent category hotel will be provided.',
      'Early check-in and late check-out are subject to hotel policies and additional charges.',
    ],
  },
  {
    title: '8. Force Majeure',
    items: [
      'The company shall not be responsible for delays, cancellations, road closures, landslides, snowfall, floods, strikes, political disturbances, flight/train delays, pandemics, or any circumstances beyond its control.',
      'Any additional expenses arising from such situations shall be borne entirely by the guest.',
    ],
  },
  {
    title: '9. Guest Responsibility',
    items: [
      'Guests must carry valid government-issued photo identification throughout the tour.',
      'The company is not responsible for the loss, theft, or damage of luggage, valuables, cash, or personal belongings.',
      'Any damage caused by the guest to the vehicle or hotel property shall be recovered from the guest.',
    ],
  },
  {
    title: '10. Liability',
    items: [
      'Explore My Bharat Tours acts only as a travel organizer and shall not be liable for any accident, injury, illness, death, loss, delay, or consequential damages arising during the tour.',
    ],
  },
  {
    title: '11. Jurisdiction',
    items: [
      'All disputes shall be subject exclusively to the jurisdiction of the courts at Solan, Himachal Pradesh.',
    ],
  },
  {
    title: '12. Acceptance',
    items: [
      'Payment of the booking amount shall be deemed as unconditional acceptance of all the above Terms & Conditions.',
    ],
  },
];

export const QUOTE_BANK_ACCOUNTS = [
  {
    bank: 'RBL Bank',
    accountName: 'Explore My Bharat',
    accountNo: '409001680639',
    ifsc: 'RATN0000319',
    branch: '—',
    upi: '—',
  },
];

export const QUOTE_SUPPORT_PHONE = '+91 62305 57851';

/** @deprecated — legacy policy buckets */
export const QUOTE_POLICIES = {
  remarks: [],
  terms: [],
  confirmation: QUOTE_PAYMENT_DETAILS,
  cancellation: QUOTE_TERMS_AND_CONDITIONS.find((s) => s.title.includes('Cancellation'))?.items || [],
  amendment: [],
};

export const PACKAGE_CATEGORY_LABELS = {
  luxury: 'Deluxe',
  family: 'Deluxe',
  honeymoon: 'Premium',
  group: 'Standard',
  adventure: 'Standard',
  corporate: 'Corporate',
  budget: 'Budget',
};

export function getPackageCategoryLabel(type) {
  return PACKAGE_CATEGORY_LABELS[type] || 'Deluxe';
}

export function resolveTransportLabel(quote = {}) {
  const packageInfo = quote.packageInfo || {};
  const vehicles = quote.selectedCabs || [];
  const firstCab = vehicles[0];
  const fromCab = firstCab?.vehicleName || firstCab?.vehicleType;
  const fromInfo = packageInfo.transportation;
  const label = fromCab || fromInfo || 'Dzire/Etios or similar';
  return String(label).trim();
}

export function quoteIncludesHotel(quote = {}) {
  return quoteHasHotels(quote);
}

export function buildDefaultInclusions(quote = {}) {
  const vehicle = resolveTransportLabel(quote);
  const withHotel = quoteIncludesHotel(quote);

  const rows = [
    `Transportation using ${vehicle} for all sightseeing as per tour itinerary on non-sharable basis.`,
    withHotel
      ? 'Fuel charges, road tax, toll tax, driver\'s allowance, interstate taxes, per day taxes of Himachal & parking fee.'
      : 'Fuel charges, road tax, toll tax, driver\'s allowance, interstate taxes & parking fee.',
  ];

  if (withHotel) {
    const mealPlan = quote.packageInfo?.mealPlan || 'your meal plan';
    rows.push(`Hotels as per above schedule, meals as per your plan meal plan (${mealPlan}, veg only). Extra charges for non-veg food.`);
  }

  return rows;
}

export function resolveQuoteInclusions(quote = {}) {
  const pkg = quote.packageSnapshot || quote.package || {};
  const custom = (pkg.inclusions || []).filter(Boolean);
  const rows = custom.length > 0 ? custom : buildDefaultInclusions(quote);
  if (quoteIncludesHotel(quote)) return rows;
  return stripHotelMentionsFromLines(rows);
}

export function resolveQuoteExclusions(quote = {}) {
  const pkg = quote.packageSnapshot || quote.package || {};
  const custom = (pkg.exclusions || []).filter(Boolean);
  const withHotel = quoteIncludesHotel(quote);
  if (custom.length > 0) {
    return withHotel ? custom : stripHotelMentionsFromLines(custom);
  }
  return withHotel ? QUOTE_DEFAULT_EXCLUSIONS : QUOTE_DEFAULT_EXCLUSIONS_NO_HOTEL;
}

export function resolveQuoteTermsAndConditions(quote = {}) {
  if (quoteIncludesHotel(quote)) return QUOTE_TERMS_AND_CONDITIONS;

  return QUOTE_TERMS_AND_CONDITIONS
    .filter((section) => !/hotel\s+policy/i.test(section.title || ''))
    .map((section) => ({
      ...section,
      items: (section.items || [])
        .map((item) => String(item || '')
          .replace(/,\s*hotel,/gi, ',')
          .replace(/\bhotel,\s*/gi, '')
          .replace(/\s+or hotel property/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim())
        .filter((item) => item && !lineMentionsHotel(item)),
    }))
    .filter((section) => (section.items || []).length > 0);
}
