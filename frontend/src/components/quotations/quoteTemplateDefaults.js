/** Quotation PDF & builder defaults — Explore My Bharat standard terms */

import { isNoHotelMealPlan } from './constants';

export const QUOTE_WELCOME_TEXT = `Greetings from Explore My Bharat. Your journey surely deserves warm hospitality, comfortable stay, hassle-free transportation and proper guidance which Explore My Bharat, a reliable and growing travel organization, promises to cater at the best possible rates.

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

export const QUOTE_REFUND_POLICY = [
  'Before 30 days of starting of tour: 90% of amount paid will be refunded. Afterwards 50% of amount will be refunded.',
  '30-15 days before starting of tour: 50% of amount will be refunded.',
  '15 days before starting of the tour: 30% of the amount will be refunded.',
  '1 week before starting of your tour: 10% of the amount will be refunded.',
  'Day before or same day of tour commencement: No refund.',
  'Cancellation after the day of commencement of tour: You won\'t get any refund if cancellation is done on or after the day of starting of tour.',
  'There will be no refund in case your taxi faces technical or mechanical issues during tour.',
  'No refund in case sightseeing is restricted as a result of natural calamities such as landslides, earthquake, heavy rainfall or snowfall and any other possibilities which are beyond our control.',
  'Token money will not be refunded in any case.',
  'You\'ll be refunded within 2 months from date of initiation of refund.',
];

export const QUOTE_PAYMENT_DETAILS = [
  'Please pay advance 30% of total amount and rest of the amount 3 days prior to your trip.',
  'We\'ll mail you our company\'s voucher and final itinerary as your payment reflects in our account. Please share screenshots of payment for convenience.',
];

export const QUOTE_TERMS_OF_SERVICE = [
  'Please take a printout of this itinerary and bring it along with you on tour. Only the itinerary will be applicable for future reference.',
  'Please note that sightseeing timing in Himachal is 9:00 a.m. to 5 p.m. in winter season and 8 a.m. to 6 p.m. in rest of the year. You\'ll go for sightseeing in these specified hours.',
  'All sites mentioned in package will be covered once during the tour. Please note that you won\'t be driven for a particular sight more than once.',
  'Check-In time in hotels is 12:00 p.m. or after and Check-Out time is 11:00 a.m. or before. In case of early Check-In or late Check-Out, you might be charged early check-in fee or late check-out fee respectively by hotels, which will be directly payable on-spot.',
  'Himachal govt. has introduced a \'No-Smoking\' legislation for hotels, restaurants and all public places. As a consequence, smoking is prohibited in all parts of hotel/s.',
  'In Himachali culture, we respect food utmost and wastage of food or drinkables is considered as disgrace. We request you not to waste any eatables or drinkables in hotel or outside during sightseeing once you enter Himachal Pradesh.',
  'Please note that in winter and rainy seasons, access to certain places for sightseeing falling outside of National Highways might be blocked due to snow or landslides. In such case, sightseeing of that particular spot might not be possible.',
  'Because of heavy tourist rush in famous spots like Shimla and Manali, sometimes it is not possible to cover all the sights we have mentioned in the package due to traffic jams. But we assure you that important places will be covered.',
  'Sometimes it is difficult to provide said taxi because of lesser availability. In such case you\'ll be provided with similar taxi if not same.',
  'If you are visiting Kufri, please note that Himalayan Nature Park is closed on Tuesdays.',
  'Note that Rohtang Pass tour is possible only in the months between May and October. Also it is closed on Tuesdays.',
  'Please note that hotel in Shimla and Manali are not like hotels in metro cities. Hotels here are smaller in dimensions as they are structured in hilly area. We request you to inspect every element of hotels we provide.',
  'You might catch cold here in Himachal or can suffer from headache, stomach ache etc. because of temperature difference. Journey in curvy roads of Himachal can lead to vomiting as well. We suggest you to carry personal medics during your tour for all these ailments.',
  'We have prepared the package as per your requirement and request. Note that our quotation is customizable only before finalization of the quote. When package gets finalize, no change will be entertained in this final package itinerary.',
  'In case customer refuses to take the benefits of the service on commencement of the tour or during the tour, s/he still have to pay according to voucher we have created and shared with the customer. No relaxation will be given in the amount whether s/he accomplish whole tour according to quotation or not.',
  'It is advisable for clients not to modify the tour plan or quote during tour. But in case customer wishes to include new place for sightseeing which is not mentioned in final quote or package, s/he will be charged accordingly on spot for sightseeing s/he wishes for. Explore My Bharat would assist you in this case, but should not be held responsible for failure of service or any other issue arose during modified tour.',
  'In case customer wishes to terminate the tour in between travel dates, s/he still have to pay the amount according to voucher we have created and shared with the customer.',
  'Client will have to pay according to voucher even if s/he does not check in to hotels we provide.',
  'In case you have paid for MAP plan and upon check-in to hotel decide not to have breakfast and dinner, you still have to pay as per your voucher.',
  'We take utmost care of our service, be it the cab we provide, our drivers or hotels we have booked for you. We request you not to misbehave or abuse with our drivers and hotel staff that you are staying in at any circumstances. If you face any problems with our driver or hotel we have provided, call us anytime, we will surely assist you in resolving the issue.',
  'A valid photo ID is required during check-in to hotel, kindly carry a valid ID proof with you during tour.',
  'AC service will be switched off in hilly areas. In case you want to enable AC during journey in hilly areas, you have to pay extra, which will be charged on-spot.',
  'Explore My Bharat in any case what so ever, is not responsible for the damage or misplacement of the belongings of the client.',
  'Call or WhatsApp +91 62305 57851 for any queries. We assure you that any issues raised before or during tour will be resolved at earliest note.',
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

/** @deprecated — legacy policy buckets; PDF uses structured defaults above */
export const QUOTE_POLICIES = {
  remarks: [],
  terms: QUOTE_TERMS_OF_SERVICE.slice(0, 4),
  confirmation: QUOTE_PAYMENT_DETAILS,
  cancellation: QUOTE_REFUND_POLICY.slice(0, 4),
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
  const mealPlan = quote.packageInfo?.mealPlan || '';
  if (isNoHotelMealPlan(mealPlan)) return false;
  const hotels = quote.selectedHotels || [];
  if (hotels.length > 0) return true;
  const snap = quote.packageSnapshot || quote.package || {};
  if (snap.hotels?.length) return true;
  const category = String(quote.packageInfo?.hotelCategory || '').trim();
  return Boolean(category && category.toLowerCase() !== 'no hotel');
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
  if (custom.length > 0) return custom;
  return buildDefaultInclusions(quote);
}

export function resolveQuoteExclusions(quote = {}) {
  const pkg = quote.packageSnapshot || quote.package || {};
  const custom = (pkg.exclusions || []).filter(Boolean);
  if (custom.length > 0) return custom;
  return QUOTE_DEFAULT_EXCLUSIONS;
}
