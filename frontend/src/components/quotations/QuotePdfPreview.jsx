import { forwardRef } from 'react';
import { COMPANY_INFO } from './constants';
import { formatINR } from './quotationUtils';
import {
  resolveQuotePackage,
  resolveQuoteLead,
  formatQuoteDate,
  getQuoteTypeLabel,
  perPersonAmount,
} from './quotePdfHelpers';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1400&q=80';

const PricingRow = ({ label, amount, accent = false, negative = false }) => {
  if (amount == null || (Number(amount) === 0 && !accent)) return null;
  return (
    <tr className={accent ? 'bg-gradient-to-r from-amber-50 to-orange-50' : ''}>
      <td className={`py-2.5 px-4 ${accent ? 'font-bold text-lg text-slate-900' : 'text-slate-600'}`}>{label}</td>
      <td className={`py-2.5 px-4 text-right font-semibold tabular-nums ${accent ? 'text-xl text-amber-700' : negative ? 'text-emerald-600' : 'text-slate-800'}`}>
        {negative && Number(amount) > 0 ? '−' : ''}{formatINR(Math.abs(Number(amount)))}
      </td>
    </tr>
  );
};

const QuotePdfPreview = forwardRef(function QuotePdfPreview({ quote }, ref) {
  if (!quote) return null;

  const lead = resolveQuoteLead(quote);
  const pkg = resolveQuotePackage(quote);
  const p = quote.pricing || {};
  const travelers = lead.travelers || 2;
  const coverImage = pkg.coverImage || DEFAULT_COVER;
  const validUntil = new Date(quote.createdAt || Date.now());
  validUntil.setDate(validUntil.getDate() + 7);

  return (
    <div
      ref={ref}
      className="bg-white text-slate-900 mx-auto print:shadow-none"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: '820px' }}
    >
      {/* ── Hero cover ── */}
      <div className="relative overflow-hidden print:break-after-avoid">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,58,138,0.78) 45%, rgba(180,83,9,0.55) 100%)' }}
        />
        <div className="relative px-8 sm:px-12 pt-10 pb-12 text-white">
          <div className="flex flex-wrap items-start justify-between gap-6 mb-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-amber-200/90 font-medium">Premium Travel Quotation</p>
              <h1 className="text-3xl sm:text-4xl font-bold mt-2 tracking-tight">{COMPANY_INFO.name}</h1>
              <p className="text-sm text-white/75 mt-1">{COMPANY_INFO.tagline}</p>
            </div>
            <div className="text-right bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/20">
              <p className="text-[10px] uppercase tracking-widest text-amber-200">Quote No.</p>
              <p className="text-2xl font-bold font-mono mt-0.5">{quote.quoteNumber}</p>
              <p className="text-xs text-white/70 mt-2">{formatQuoteDate(quote.createdAt)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/25 text-amber-100 border border-amber-300/40">
              {getQuoteTypeLabel(quote)} Package
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight max-w-xl">{pkg.name || 'Custom Travel Package'}</h2>
            <p className="text-lg text-white/85">
              {pkg.destination} · {pkg.duration || '—'} Days / {(pkg.duration || 1) - 1} Nights
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Grand Total', value: formatINR(p.total), highlight: true },
              { label: 'Per Person', value: formatINR(perPersonAmount(p, travelers)) },
              { label: 'Travelers', value: `${travelers} Pax` },
              { label: 'Valid Until', value: formatQuoteDate(validUntil) },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl px-4 py-3 border ${item.highlight ? 'bg-amber-400/20 border-amber-300/50' : 'bg-white/10 border-white/15'}`}
              >
                <p className="text-[10px] uppercase tracking-wider text-white/60">{item.label}</p>
                <p className={`font-bold mt-1 tabular-nums ${item.highlight ? 'text-xl text-amber-200' : 'text-sm text-white'}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8 sm:px-12 py-10 space-y-10">
        {/* ── Guest & trip info ── */}
        <div className="grid sm:grid-cols-2 gap-5 print:break-inside-avoid">
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
              <p className="text-xs uppercase tracking-widest font-medium text-slate-300">Prepared For</p>
            </div>
            <div className="p-5 space-y-2 text-sm">
              <p className="text-lg font-bold text-slate-900">{lead.name || 'Guest'}</p>
              {lead.phone && <p className="text-slate-600">{lead.phone}</p>}
              {lead.email && <p className="text-slate-600">{lead.email}</p>}
              {lead.travelDate && (
                <p className="text-slate-500 pt-1">
                  Travel date: <span className="font-medium text-slate-700">{formatQuoteDate(lead.travelDate)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gradient-to-r from-blue-800 to-indigo-700 text-white">
              <p className="text-xs uppercase tracking-widest font-medium text-blue-200">Trip Overview</p>
            </div>
            <div className="p-5 space-y-2 text-sm">
              <p className="font-bold text-slate-900">{pkg.destination}</p>
              <p className="text-slate-600">{pkg.duration} Days curated itinerary</p>
              {quote.customizations && (
                <p className="text-slate-500 italic pt-1 border-t border-slate-100 mt-2 pt-3">{quote.customizations}</p>
              )}
              <p className="text-xs text-slate-400 pt-2">{COMPANY_INFO.phone} · {COMPANY_INFO.email}</p>
            </div>
          </div>
        </div>

        {/* ── Highlights ── */}
        {pkg.highlights?.length > 0 && (
          <section className="print:break-inside-avoid">
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-700 mb-4 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-amber-400 rounded" />
              Trip Highlights
            </h3>
            <div className="flex flex-wrap gap-2">
              {pkg.highlights.map((h) => (
                <span
                  key={h}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border border-amber-200/80"
                >
                  ✦ {h}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Itinerary ── */}
        {pkg.itinerary?.length > 0 && (
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-700 mb-5 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-amber-400 rounded" />
              Day-wise Itinerary
            </h3>
            <div className="space-y-4">
              {pkg.itinerary.map((day) => (
                <div
                  key={day.id}
                  className="flex gap-4 rounded-2xl border border-slate-200 overflow-hidden shadow-sm print:break-inside-avoid"
                >
                  <div
                    className="shrink-0 w-16 sm:w-20 flex flex-col items-center justify-center text-white font-bold"
                    style={{ background: 'linear-gradient(180deg, #1e40af 0%, #0f766e 100%)' }}
                  >
                    <span className="text-[10px] uppercase opacity-80">Day</span>
                    <span className="text-2xl">{day.day}</span>
                  </div>
                  <div className="flex-1 p-4 sm:p-5 min-w-0">
                    <p className="font-bold text-slate-900 text-base">{day.title}</p>
                    {day.description && <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{day.description}</p>}
                    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500">
                      {day.hotel && <p><span className="font-semibold text-slate-700">Stay:</span> {day.hotel}</p>}
                      {day.meals && <p><span className="font-semibold text-slate-700">Meals:</span> {day.meals}</p>}
                      {day.activities && <p><span className="font-semibold text-slate-700">Activities:</span> {day.activities}</p>}
                      {day.transport && <p><span className="font-semibold text-slate-700">Transport:</span> {day.transport}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Inclusions / Exclusions ── */}
        {(pkg.inclusions?.length > 0 || pkg.exclusions?.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-5 print:break-inside-avoid">
            {pkg.inclusions?.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <h4 className="text-sm font-bold text-emerald-800 mb-3">✓ Inclusions</h4>
                <ul className="space-y-1.5 text-sm text-emerald-900/80">
                  {pkg.inclusions.map((item) => (
                    <li key={item} className="flex gap-2"><span className="text-emerald-500">•</span>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {pkg.exclusions?.length > 0 && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
                <h4 className="text-sm font-bold text-rose-800 mb-3">✗ Exclusions</h4>
                <ul className="space-y-1.5 text-sm text-rose-900/80">
                  {pkg.exclusions.map((item) => (
                    <li key={item} className="flex gap-2"><span className="text-rose-400">•</span>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Pricing ── */}
        <section className="print:break-inside-avoid">
          <h3 className="text-sm font-bold uppercase tracking-widest text-amber-700 mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-amber-400 rounded" />
            Cost Breakdown
          </h3>
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <PricingRow label="Base Package Cost" amount={p.baseCost} />
                <PricingRow label="Hotels & Accommodation" amount={p.hotelCost} />
                <PricingRow label="Transport / Cab" amount={p.cabCost} />
                <PricingRow label="Flights" amount={p.flightCost} />
                <PricingRow label="Activities & Experiences" amount={p.activityCost} />
                <PricingRow label="Taxes & Government Fees" amount={p.taxes} />
                <PricingRow label="Service & Handling" amount={p.markup} />
                <PricingRow label="Special Discount" amount={p.discount} negative />
                <PricingRow label="Grand Total" amount={p.total} accent />
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Per person estimate ({travelers} travelers): <strong className="text-amber-700">{formatINR(perPersonAmount(p, travelers))}</strong>
          </p>
        </section>

        {/* ── Payment & terms ── */}
        <div className="grid sm:grid-cols-2 gap-5 print:break-inside-avoid">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Payment Schedule</h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex justify-between"><span>Booking advance (50%)</span><strong>{formatINR(Math.round((p.total || 0) * 0.5))}</strong></li>
              <li className="flex justify-between"><span>Balance before travel</span><strong>{formatINR(Math.round((p.total || 0) * 0.5))}</strong></li>
            </ul>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Terms & Conditions</h4>
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Quotation valid for 7 days from date of issue.</li>
              <li>50% advance required to confirm booking; balance due 15 days before departure.</li>
              <li>Cancellation charges apply as per company policy.</li>
              <li>Prices subject to availability at time of confirmation.</li>
              <li>GST and applicable taxes included unless stated otherwise.</li>
            </ul>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer
          className="text-center pt-8 pb-4 border-t-2 border-amber-400/40 print:break-inside-avoid"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(251,191,36,0.06))' }}
        >
          <p className="text-lg font-bold text-slate-800">{COMPANY_INFO.name}</p>
          <p className="text-xs text-slate-500 mt-1">{COMPANY_INFO.address}</p>
          <p className="text-sm text-amber-700 font-medium mt-3">
            Thank you for choosing {COMPANY_INFO.name} — Your journey, perfectly planned.
          </p>
          <p className="text-[10px] text-slate-400 mt-4">This is a computer-generated quotation. For queries: {COMPANY_INFO.phone}</p>
        </footer>
      </div>
    </div>
  );
});

export default QuotePdfPreview;
