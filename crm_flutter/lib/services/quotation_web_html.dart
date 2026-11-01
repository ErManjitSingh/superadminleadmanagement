import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../models/models.dart';
import 'quotation_pdf_builder.dart';

const _brandName = 'Explore My Bharat';
const _brandTagline = 'True to their Commitment';
const _brandEmail = 'exploremybharat01@gmail.com';
const _brandPhone = '+91 62305 57851';
const _brandAddress = 'Himachal Pradesh, India';
const _upiId = 'exploremybharat@ucobank';
const _defaultCover =
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80';

const _welcomeHotel =
    'Greetings from Explore My Bharat. Your journey surely deserves warm hospitality, comfortable stay, hassle-free transportation and proper guidance which Explore My Bharat, a reliable and growing travel organization, promises to cater at the best possible rates.\n\n'
    'We are proud to offer packages that can\'t be more perfect and take you to such an enhanced experience that the only words you have for us are "True to their Commitment."\n\n'
    'So, let our executives assist you 24/7 and create magical moments just for you.';

const _welcomeNoHotel =
    'Greetings from Explore My Bharat. Your journey surely deserves hassle-free transportation and proper guidance which Explore My Bharat, a reliable and growing travel organization, promises to cater at the best possible rates.\n\n'
    'We are proud to offer packages that can\'t be more perfect and take you to such an enhanced experience that the only words you have for us are "True to their Commitment."\n\n'
    'So, let our executives assist you 24/7 and create magical moments just for you.';

const _defaultExclusionsHotel = [
  'Meals outside hotels and beverages during tour.',
  'Travel insurance and personal expenses (Telephone, liquor or other charges of personal nature).',
  'Air/rail/bus fare or entry fee to parks and monument.',
  'Expense of adventurous activities (rafting, paragliding, toy train ride, yak ride, horse ride, skiing, skating, etc.), laundry and personal guide.',
  'Increase in taxes or fuel price which may cause hike in cost of surface transportation, prior to departure, hence affecting the final cost.',
  'Services which are not mentioned in tour package.',
  'Any cost incurred due to extension, change of itinerary due to natural calamities, road blocks, vehicle breakdown, union issues and factors beyond our control.',
];

const _defaultExclusionsCabOnly = [
  'Hotel stay, breakfast, dinner or any meals (cab-only package).',
  'Travel insurance and personal expenses (Telephone, liquor or other charges of personal nature).',
  'Air/rail/bus fare or entry fee to parks and monument.',
  'Expense of adventurous activities (rafting, paragliding, toy train ride, yak ride, horse ride, skiing, skating, etc.), laundry and personal guide.',
  'Increase in taxes or fuel price which may cause hike in cost of surface transportation, prior to departure, hence affecting the final cost.',
  'Services which are not mentioned in tour package.',
  'Any cost incurred due to extension, change of itinerary due to natural calamities, road blocks, vehicle breakdown, union issues and factors beyond our control.',
];

/// Remove breakfast / dinner / meals lines from itinerary text (cab-only quotes).
String stripMealMentionsFromItinerary(String text) {
  if (text.trim().isEmpty) return text;
  final cleaned = text
      .split('\n')
      .where((line) {
        final l = line.trim().toLowerCase();
        if (l.isEmpty) return true;
        if (l.startsWith('meals:') || l.startsWith('meal:')) return false;
        if (RegExp(r'^(breakfast|dinner|lunch)(\s|&|and|,|/)').hasMatch(l) && l.length < 60) {
          return false;
        }
        if (l == 'breakfast' || l == 'dinner' || l == 'lunch') return false;
        if (l == 'breakfast & dinner' || l == 'breakfast and dinner') return false;
        return true;
      })
      .join('\n');
  return cleaned
      .replaceAll(RegExp(r'\n?Meals?:\s*[^\n]+', caseSensitive: false), '')
      .replaceAll(RegExp(r'\bafter\s+(a\s+hearty\s+)?breakfast(\s+at\s+the\s+hotel)?[,.]?\s*', caseSensitive: false), '')
      .replaceAll(RegExp(r'\benjoy\s+breakfast(\s+at\s+the\s+hotel)?[,.]?\s*', caseSensitive: false), '')
      .replaceAll(RegExp(r'\bbreakfast\s+at\s+(the\s+)?hotel[,.]?\s*', caseSensitive: false), '')
      .replaceAll(RegExp(r'\bBreakfast\s*(&|and|\+)\s*Dinner\b', caseSensitive: false), '')
      .replaceAll(RegExp(r'\bBreakfast\s*/\s*Dinner\b', caseSensitive: false), '')
      .replaceAll(RegExp(r'\b(morning\s+)?breakfast(\s+&|\s+and)?\s*(dinner)?\b', caseSensitive: false), '')
      .replaceAll(RegExp(r'[ \t]{2,}'), ' ')
      .replaceAll(RegExp(r'\n{3,}'), '\n\n')
      .trim();
}

const _paymentDetails = [
  'Token amount is non-refundable and is mandatory to confirm any booking.',
  'The remaining balance must be paid before the tour begins.',
  'We\'ll mail you our company\'s voucher and final itinerary as your payment reflects in our account. Please share screenshots of payment for convenience.',
];

const _terms = [
  (
    '1. Booking Confirmation',
    [
      'Token amount is non-refundable and is mandatory to confirm any booking.',
      'Bookings are confirmed only after receipt of the token / advance payment and written confirmation from Explore My Bharat Tours.',
    ]
  ),
  (
    '2. Full Payment',
    [
      'The remaining balance must be paid before the tour begins.',
      'Failure to make full payment may result in automatic cancellation without any refund of the token amount.',
    ]
  ),
  (
    '3. Cancellation Policy',
    [
      'More than 30 days before departure: 25% cancellation charges',
      '15–30 days before departure: 50% cancellation charges',
      '7–14 days before departure: 75% cancellation charges',
      'Less than 7 days before departure or No Show: 100% cancellation charges',
      'Token amount is non-refundable in all cases.',
      'No refund will be provided after the tour has commenced or for any unused services.',
    ]
  ),
  (
    '4. Itinerary Changes',
    [
      'The company reserves the right to modify the itinerary, hotel, vehicle, sightseeing order, or route due to weather, road conditions, government restrictions, operational requirements, or force majeure without prior notice.',
      'No refund or compensation shall be payable for such changes.',
    ]
  ),
  (
    '5. Vehicle Usage',
    [
      'The vehicle will operate strictly as per the confirmed itinerary.',
      'Extra sightseeing, route diversions, waiting charges, or additional kilometers will be charged separately.',
      'Night driving (after 7:30 PM) is subject to driver discretion, local regulations, and additional charges.',
    ]
  ),
  (
    '6. Hill Area Operations',
    [
      'Air conditioning may be switched off on steep mountain roads for safety and vehicle performance.',
      'Rohtang Pass, Nathula Pass, and other restricted destinations are subject to permits, weather, and government regulations. No refund shall be applicable if access is denied.',
    ]
  ),
  (
    '7. Hotel Policy',
    [
      'Hotels are subject to availability. In case of non-availability, an equivalent category hotel will be provided.',
      'Early check-in and late check-out are subject to hotel policies and additional charges.',
    ]
  ),
  (
    '8. Force Majeure',
    [
      'The company shall not be responsible for delays, cancellations, road closures, landslides, snowfall, floods, strikes, political disturbances, flight/train delays, pandemics, or any circumstances beyond its control.',
      'Any additional expenses arising from such situations shall be borne entirely by the guest.',
    ]
  ),
  (
    '9. Guest Responsibility',
    [
      'Guests must carry valid government-issued photo identification throughout the tour.',
      'The company is not responsible for the loss, theft, or damage of luggage, valuables, cash, or personal belongings.',
      'Any damage caused by the guest to the vehicle or hotel property shall be recovered from the guest.',
    ]
  ),
  (
    '10. Liability',
    [
      'Explore My Bharat Tours acts only as a travel organizer and shall not be liable for any accident, injury, illness, death, loss, delay, or consequential damages arising during the tour.',
    ]
  ),
  (
    '11. Jurisdiction',
    ['All disputes shall be subject exclusively to the jurisdiction of the courts at Solan, Himachal Pradesh.']
  ),
  (
    '12. Acceptance',
    ['Payment of the booking amount shall be deemed as unconditional acceptance of all the above Terms & Conditions.']
  ),
];

String _esc(String? v) => (v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

String _money(num n) {
  final f = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
  return f.format(n);
}

String _fmtDate(String? raw, {bool short = false}) {
  if (raw == null || raw.trim().isEmpty) return '—';
  final d = DateTime.tryParse(raw);
  if (d == null) return raw;
  return DateFormat(short ? 'dd MMM' : 'dd MMM yyyy').format(d);
}

String? _addDays(String? raw, int dayNum) {
  final d = DateTime.tryParse(raw ?? '');
  if (d == null || dayNum < 1) return null;
  return d.add(Duration(days: dayNum - 1)).toIso8601String();
}

Future<String> _assetDataUri(String assetPath, String mime) async {
  final bytes = await rootBundle.load(assetPath);
  final b64 = base64Encode(bytes.buffer.asUint8List());
  return 'data:$mime;base64,$b64';
}

Future<({String css, String logo, String qr, String certificate})> _loadAssets() async {
  final template = await rootBundle.loadString('assets/quote_pdf/quotePdfTemplate.css');
  final emb = await rootBundle.loadString('assets/quote_pdf/quotePdfEmbDesign.css');
  final logo = await _assetDataUri('assets/quote_pdf/emb_logo.png', 'image/png');
  final qr = await _assetDataUri('assets/quote_pdf/payment-qr.png', 'image/png');
  final certificate =
      await _assetDataUri('assets/quote_pdf/hp-travel-agent-certificate.png', 'image/png');
  return (css: '$template\n$emb', logo: logo, qr: qr, certificate: certificate);
}

/// Website-identical quotation HTML (QuotePdfPreview + EMB CSS).
Future<String> buildWebsiteQuotationHtml(QuotationPdfData data) async {
  final assets = await _loadAssets();
  final money = _money(data.amount);
  final nights = data.duration > 0 ? data.duration - 1 : 0;
  final hasHotel = data.hasHotels;
  final welcome = (hasHotel ? _welcomeHotel : _welcomeNoHotel).split('\n\n');
  final travelEnd = _addDays(data.travelDate, data.duration);
  final quoteNo = data.quoteNumber.isEmpty ? 'DRAFT' : data.quoteNumber;
  final created = DateFormat('dd MMM yyyy').format(DateTime.now());

  final overviewIcons = ['📦', '📋', '📍', '📅', '🏁', '⏱', '👥', '🍽', '🏨', '👤', '📞', '💼'];
  final overviewColors = ['qp-ico-blue', 'qp-ico-green', 'qp-ico-orange', 'qp-ico-purple'];
  final overview = <List<String>>[
    ['Package', data.packageName],
    ['Quote No.', quoteNo],
    ['Destination', data.destination.isEmpty ? '—' : data.destination],
    ['Tour Start Date', _fmtDate(data.travelDate)],
    ['Tour End Date', _fmtDate(travelEnd)],
    ['Duration', data.duration > 0 ? '${data.duration} Days / $nights Nights' : '—'],
    [
      'Travellers',
      'Adults: ${data.adults}${data.children > 0 ? ' · Kids: ${data.children}' : ''}',
    ],
    if (hasHotel) ['Meal Plan', data.mealPlan.isEmpty ? '—' : data.mealPlan],
    if (hasHotel && data.hotelCategory.isNotEmpty) ['Hotel Category', data.hotelCategory],
    ['Customer', data.leadName.isEmpty ? 'Guest' : data.leadName],
    if (data.leadPhone.isNotEmpty) ['Customer Phone', data.leadPhone],
    if (data.executiveName.isNotEmpty) ['Sales Executive', data.executiveName],
  ];

  final overviewHtml = overview.asMap().entries.map((e) {
    final i = e.key;
    final label = e.value[0];
    final value = e.value[1];
    final color = overviewColors[i % overviewColors.length];
    final icon = overviewIcons[i % overviewIcons.length];
    return '''
      <div class="qp-overview-item">
        <span class="qp-overview-icon $color" aria-hidden="true">$icon</span>
        <div class="qp-overview-text">
          <span class="qp-overview-lbl">${_esc(label)}</span>
          <span class="qp-overview-val">${_esc(value)}</span>
        </div>
      </div>''';
  }).join();

  final hotelsHtml = !hasHotel
      ? ''
      : '''
      <section class="qp-section-block">
        <h2 class="qp-section-head"><span class="qp-section-icon">🏨</span>Hotel Stay</h2>
        ${data.hotels.where((h) => h.name.trim().isNotEmpty).map((h) => '''
          <div class="qp-stay-block">
            <p class="qp-stay-meta">${h.nights} Night${h.nights > 1 ? 's' : ''}</p>
            <div class="qp-choice-card">
              <p class="qp-choice-name">${_esc(h.name)}</p>
              <p class="qp-choice-meta">${_esc([h.roomType, h.mealPlan.isEmpty ? data.mealPlan : h.mealPlan].where((s) => s.trim().isNotEmpty).join(' · '))}</p>
            </div>
          </div>''').join()}
      </section>''';

  final cabs = data.cabs.where((c) => c.vehicleName.trim().isNotEmpty).toList();
  final vehiclesHtml = cabs.isEmpty
      ? ''
      : '''
      <section class="qp-section-block">
        <h2 class="qp-section-head"><span class="qp-section-icon">🚗</span>${cabs.length > 1 ? 'Cab Options — Choose One' : 'Vehicle Details'}</h2>
        <div class="${cabs.length > 1 ? 'qp-choice-grid' : ''}">
          ${cabs.asMap().entries.map((e) {
            final v = e.value;
            final multi = cabs.length > 1;
            return '''
              <div class="${multi ? 'qp-choice-card qp-cab-option' : 'qp-vehicle-banner'}">
                ${multi ? '<span class="qp-choice-badge">Option ${e.key + 1}</span>' : '<div class="qp-vehicle-thumb qp-vehicle-thumb-placeholder">🚐</div>'}
                <div class="qp-vehicle-body">
                  <p class="qp-vehicle-name">${_esc(v.vehicleName)}</p>
                  <p class="qp-vehicle-meta">${v.vehicleCount} Vehicle${v.vehicleCount > 1 ? 's' : ''}</p>
                  ${v.cost > 0 ? '<p class="qp-choice-price">${_esc(_money(v.cost))}</p>' : ''}
                </div>
              </div>''';
          }).join()}
        </div>
      </section>''';

  final itineraryHtml = data.itinerary.isEmpty
      ? ''
      : '''
      <section class="qp-section-block">
        <h2 class="qp-section-head"><span class="qp-section-icon">🗺</span>Day Wise Itinerary</h2>
        <div class="qp-timeline">
          ${data.itinerary.asMap().entries.map((e) {
            final i = e.key;
            final day = e.value;
            final dayNum = day.day > 0 ? day.day : i + 1;
            final dayDate = _addDays(data.travelDate, dayNum);
            final isLast = i == data.itinerary.length - 1;
            final title = day.title.trim().isEmpty ? 'Day $dayNum' : day.title.trim();
            final rawDesc = day.description.trim();
            final desc = hasHotel ? rawDesc : stripMealMentionsFromItinerary(rawDesc);
            return '''
              <div class="qp-timeline-row">
                <div class="qp-timeline-rail">
                  <span class="qp-timeline-dot${isLast ? ' is-last' : ''}">Day $dayNum</span>
                  ${isLast ? '' : '<span class="qp-timeline-line" aria-hidden="true"></span>'}
                </div>
                <div class="qp-timeline-body">
                  <h3>${_esc(title)}</h3>
                  <div class="qp-timeline-meta">
                    ${dayDate != null ? '<span>📅 ${_esc(_fmtDate(dayDate))}</span>' : ''}
                    ${cabs.isNotEmpty ? '<span>🚗 ${_esc(cabs.first.vehicleName)}</span>' : ''}
                  </div>
                  ${desc.isEmpty ? '' : '<p class="qp-timeline-desc">${_esc(desc)}</p>'}
                </div>
              </div>''';
          }).join()}
        </div>
      </section>''';

  final payRows = [
    ('Booking Confirmation (Advance)', 30, (data.amount * 0.3).round()),
    ('Before Tour Begins', 50, (data.amount * 0.5).round()),
    ('On Arrival (Balance)', 20, (data.amount * 0.2).round()),
  ];
  final payHtml = payRows.asMap().entries.map((e) {
    final i = e.key;
    final row = e.value;
    return '''
      <div class="qp-pay-step-card">
        <div class="qp-pay-step-head">
          <span class="qp-pay-step-num">${i + 1}</span>
          <span class="qp-pay-step-pct">${row.$2}%</span>
        </div>
        <div class="qp-pay-step-title">${_esc(row.$1)}</div>
        ${data.amount > 0 ? '<div class="qp-pay-step-amt">${_esc(_money(row.$3))}</div>' : ''}
        ${i < payRows.length - 1 ? '<span class="qp-pay-step-arrow">→</span>' : ''}
      </div>''';
  }).join();

  final vehicleLabel = cabs.isNotEmpty ? cabs.first.vehicleName : 'Dzire/Etios or similar';
  final inclusions = <String>[
    'Transportation using $vehicleLabel for all sightseeing as per tour itinerary on non-sharable basis.',
    hasHotel
        ? 'Fuel charges, road tax, toll tax, driver\'s allowance, interstate taxes, per day taxes of Himachal & parking fee.'
        : 'Fuel charges, road tax, toll tax, driver\'s allowance, interstate taxes & parking fee.',
    if (hasHotel)
      'Hotels as per above schedule, meals as per your plan (${data.mealPlan.isEmpty ? 'MAP' : data.mealPlan}, veg only). Extra charges for non-veg food.',
  ];

  String listItems(List<String> items, {required bool inc}) => items
      .map((item) =>
          '<li><span class="qp-list-icon ${inc ? 'qp-list-icon-inc' : 'qp-list-icon-exc'}">${inc ? '✓' : '✕'}</span><span>${_esc(item)}</span></li>')
      .join();

  final termsHtml = _terms.map((t) {
    return '''
      <div class="quote-ht-policy">
        <div class="quote-ht-policy-head">${_esc(t.$1)}</div>
        <ul>${t.$2.map((i) => '<li>${_esc(i)}</li>').join()}</ul>
      </div>''';
  }).join();

  final notesBlock = data.notes.trim().isEmpty
      ? ''
      : '''
      <div class="quote-ht-policy">
        <div class="quote-ht-policy-head">Additional Notes</div>
        <ul><li>${_esc(data.notes.trim())}</li></ul>
      </div>''';

  return '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${_esc(quoteNo)} · $_brandName</title>
<style>
${assets.css}
body { margin: 0; background: #e8eef5; }
.quote-pdf-preview-shell { padding: 12px; }
.quote-pdf-preview-paper { max-width: 794px; margin: 0 auto; }
</style>
</head>
<body>
<div class="quote-pdf-preview-shell">
<div class="quote-pdf-preview-paper">
<div class="quote-ht-pdf quote-ht-pdf-v2">
  <header class="qp-header">
    <div class="qp-header-left">
      <img src="${assets.logo}" alt="$_brandName" class="qp-logo" />
      <div>
        <p class="qp-brand">$_brandName</p>
        <p class="qp-tagline">$_brandTagline</p>
      </div>
    </div>
    <div class="qp-header-right">
      <p class="qp-quote-no">Quote No: ${_esc(quoteNo)}</p>
      <p>$created</p>
      <p>${_esc(data.leadPhone.isNotEmpty ? data.leadPhone : _brandPhone)}</p>
    </div>
  </header>

  <section class="qp-hero qp-hero-with-image">
    <img src="$_defaultCover" alt="" class="qp-hero-bg" />
    <div class="qp-hero-overlay"></div>
    <div class="qp-hero-content">
      <div class="qp-hero-main">
        <p class="qp-eyebrow">Travel Quotation</p>
        <h1 class="qp-title">${_esc(data.packageName)}</h1>
        <p class="qp-dest">${_esc(data.destination.isEmpty ? '—' : data.destination)}</p>
        <div class="qp-chips">
          ${data.duration > 0 ? '<span>$nights Nights / ${data.duration} Days</span>' : ''}
          ${data.travelDate.isNotEmpty ? '<span>${_esc(_fmtDate(data.travelDate, short: true))}${travelEnd != null ? ' → ${_esc(_fmtDate(travelEnd, short: true))}' : ''}</span>' : ''}
        </div>
        ${data.leadName.isNotEmpty ? '<span class="qp-customer-pill">For ${_esc(data.leadName)}</span>' : ''}
      </div>
      <div class="qp-hero-price">
        <span class="qp-price-lbl">Total Package Cost</span>
        <span class="qp-price-amt">${_esc(money)}</span>
        <span class="qp-price-sub">All Inclusive</span>
      </div>
    </div>
  </section>

  <section class="qp-welcome">
    <div class="qp-welcome-icon">⛰</div>
    <div class="qp-welcome-body">
      <p><strong>Hello ${_esc(data.leadName.isEmpty ? 'Guest' : data.leadName)},</strong></p>
      <p>Welcome to <span class="qp-welcome-highlight">$_brandName</span>.</p>
      ${welcome.map((p) => '<p>${_esc(p)}</p>').join()}
    </div>
  </section>

  <section class="qp-section-block">
    <h2 class="qp-section-head"><span class="qp-section-icon">📄</span>Package Overview</h2>
    <div class="qp-overview-grid">$overviewHtml</div>
  </section>

  $hotelsHtml
  $vehiclesHtml
  $itineraryHtml

  <div class="qp-trust-bar">
    <div class="qp-trust-item"><div class="qp-trust-icon">🏍</div><div class="qp-trust-label">Premium Fleet</div></div>
    <div class="qp-trust-item"><div class="qp-trust-icon">🚗</div><div class="qp-trust-label">Private Cabs</div></div>
    <div class="qp-trust-item"><div class="qp-trust-icon">😊</div><div class="qp-trust-label">Happy Travellers</div></div>
    <div class="qp-trust-item"><div class="qp-trust-icon">🛡</div><div class="qp-trust-label">Safe & Secure</div></div>
    <div class="qp-trust-item"><div class="qp-trust-icon">🎧</div><div class="qp-trust-label">24/7 Support</div></div>
  </div>

  <section class="qp-section-block qp-pay-section">
    <h2 class="qp-section-head"><span class="qp-section-icon">💳</span>Payment Schedule</h2>
    <div class="qp-pay-schedule" style="--qp-pay-cols: 3">
      <div class="qp-pay-steps-grid">$payHtml</div>
      <div class="qp-pay-secure-bar">
        <span class="qp-pay-secure-icon">🛡</span>
        <strong class="qp-pay-secure-title">Flexible Payments</strong>
        <span class="qp-pay-secure-dot">·</span>
        <span class="qp-pay-secure-sub">100% Secure Transactions</span>
      </div>
    </div>
  </section>

  <section class="qp-section-block">
    <h2 class="qp-section-head"><span class="qp-section-icon">✓</span>Inclusions & Exclusions</h2>
    <div class="qp-inc-exc-premium">
      <div class="qp-inc-panel">
        <div class="qp-inc-exc-head qp-inc-head"><span class="qp-inc-exc-badge">✓</span><h3>What's Included</h3></div>
        <ul class="qp-inc-exc-list">${listItems(inclusions, inc: true)}</ul>
      </div>
      <div class="qp-exc-panel">
        <div class="qp-inc-exc-head qp-exc-head"><span class="qp-inc-exc-badge qp-exc-badge">✕</span><h3>What's Not Included</h3></div>
        <ul class="qp-inc-exc-list">${listItems(hasHotel ? _defaultExclusionsHotel : _defaultExclusionsCabOnly, inc: false)}</ul>
      </div>
    </div>
  </section>

  <section class="qp-section-block">
    <h2 class="qp-section-head"><span class="qp-section-icon">💰</span>Payment Details</h2>
    <div class="qp-policies">
      <div class="quote-ht-policy">
        <div class="quote-ht-policy-head">Payment Instructions</div>
        <ul>${_paymentDetails.map((i) => '<li>${_esc(i)}</li>').join()}</ul>
      </div>
    </div>
  </section>

  <section class="qp-section-block">
    <h2 class="qp-section-head"><span class="qp-section-icon">📜</span>Terms & Conditions</h2>
    <div class="qp-policies">$termsHtml$notesBlock</div>
  </section>

  <section class="qp-section-block">
    <h2 class="qp-section-head"><span class="qp-section-icon">🏦</span>Bank Details</h2>
    <div class="qp-bank-wrap">
      <div class="qp-bank-card">
        <p class="qp-bank-name">RBL Bank</p>
        <div class="qp-bank-rows">
          <div><span>Account Name</span><strong>Explore My Bharat</strong></div>
          <div><span>Account No.</span><strong>409001680639</strong></div>
          <div><span>IFSC</span><strong>RATN0000319</strong></div>
          <div><span>Branch</span><strong>—</strong></div>
        </div>
      </div>
      <div class="qp-qr-card">
        <img src="${assets.qr}" alt="Payment QR" class="qp-qr-img" />
        <p class="qp-qr-title">Scan QR to Pay</p>
        <p class="qp-qr-demo">UPI ID: $_upiId</p>
        <p class="qp-qr-name">$_brandName</p>
      </div>
    </div>
  </section>

  <div class="qp-contact">
    <div>
      <h4>Sales Executive</h4>
      <p>${_esc(data.executiveName.isEmpty ? _brandName : data.executiveName)}</p>
    </div>
    <div>
      <h4>Contact Us</h4>
      <p>$_brandAddress</p>
      <p>$_brandPhone</p>
      <p>$_brandEmail</p>
    </div>
  </div>

  <footer class="qp-footer">
    <p>Thank you for choosing $_brandName</p>
    <p>$_brandPhone · $_brandEmail</p>
  </footer>

  <section class="qp-certificate-page">
    <p class="qp-certificate-title">Certificate of Registration of Travel Agent</p>
    <img src="${assets.certificate}" alt="Travel agent certificate" class="qp-certificate-img" />
  </section>
</div>
</div>
</div>
</body>
</html>''';
}

/// Convenience from saved quotation detail.
Future<String> buildWebsiteQuotationHtmlFromDetail(
  QuotationDetail q, {
  String executiveName = _brandName,
}) {
  return buildWebsiteQuotationHtml(
    QuotationPdfData.fromDetail(q, executiveName: executiveName),
  );
}
