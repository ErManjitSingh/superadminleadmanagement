import { forwardRef } from 'react';
import { COMPANY_INFO } from './constants';
import { formatINR } from './quotationUtils';

const QuotePdfPreview = forwardRef(function QuotePdfPreview({ quote }, ref) {
  if (!quote) return null;
  const lead = quote.lead || {};
  const pkg = quote.package || {};
  const p = quote.pricing || {};

  return (
    <div ref={ref} className="bg-white text-slate-900 p-8 sm:p-12 max-w-[800px] mx-auto print:p-8" style={{ fontFamily: 'Georgia, serif' }}>
      <div className="flex items-start justify-between border-b-2 border-amber-500 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-amber-700">{COMPANY_INFO.name}</h1>
          <p className="text-sm text-slate-600 mt-1">{COMPANY_INFO.tagline}</p>
          <p className="text-xs text-slate-500 mt-2">{COMPANY_INFO.phone} · {COMPANY_INFO.email}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-slate-500">Travel Quotation</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{quote.quoteNumber}</p>
          <p className="text-xs text-slate-500 mt-1">{new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
        <div>
          <p className="text-xs uppercase text-slate-500 mb-1">Prepared For</p>
          <p className="font-bold">{lead.name}</p>
          <p className="text-slate-600">{lead.phone}</p>
          <p className="text-slate-600">{lead.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500 mb-1">Package</p>
          <p className="font-bold">{pkg.name}</p>
          <p className="text-slate-600">{pkg.destination} · {pkg.duration} Days</p>
        </div>
      </div>

      <h2 className="text-lg font-bold text-amber-800 border-b border-amber-200 pb-2 mb-4">Day-wise Itinerary</h2>
      <div className="space-y-4 mb-8">
        {(pkg.itinerary || []).map((day) => (
          <div key={day.id} className="border border-slate-200 rounded-lg p-4">
            <p className="font-bold text-amber-700">Day {day.day}: {day.title}</p>
            <p className="text-sm text-slate-600 mt-1">{day.description}</p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-500">
              <span>Hotel: {day.hotel}</span>
              <span>Meals: {day.meals}</span>
              <span>Activities: {day.activities}</span>
              <span>Transport: {day.transport}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-amber-800 border-b border-amber-200 pb-2 mb-4">Pricing Breakdown</h2>
      <table className="w-full text-sm mb-8">
        <tbody>
          {[
            ['Base Package Cost', p.baseCost],
            ['Hotel Cost', p.hotelCost],
            ['Transport / Cab', p.cabCost],
            ['Flights', p.flightCost],
            ['Activities', p.activityCost],
            ['Taxes & Fees', p.taxes],
            ['Markup', p.markup],
            ['Discount', p.discount ? -p.discount : 0],
          ].map(([label, amt]) => (
            <tr key={label} className="border-b border-slate-100">
              <td className="py-2 text-slate-600">{label}</td>
              <td className="py-2 text-right font-medium">{formatINR(amt)}</td>
            </tr>
          ))}
          <tr className="bg-amber-50">
            <td className="py-3 font-bold text-lg">Grand Total</td>
            <td className="py-3 text-right font-bold text-lg text-amber-800">{formatINR(p.total)}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-sm font-bold text-slate-700 mb-2">Terms & Conditions</h2>
      <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
        <li>Quote valid for 7 days from date of issue.</li>
        <li>50% advance required to confirm booking.</li>
        <li>Cancellation charges apply as per company policy.</li>
        <li>Prices subject to availability at time of booking.</li>
        <li>GST and applicable taxes included unless stated otherwise.</li>
      </ul>

      <p className="text-center text-xs text-slate-400 mt-10 pt-6 border-t border-slate-200">
        {COMPANY_INFO.address} · Thank you for choosing {COMPANY_INFO.name}
      </p>
    </div>
  );
});

export default QuotePdfPreview;
