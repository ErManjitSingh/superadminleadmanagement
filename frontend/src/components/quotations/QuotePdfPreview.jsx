import { forwardRef } from 'react';
import './quotePdfTemplate.css';
import { COMPANY_INFO } from './constants';
import { formatINR } from './quotationUtils';
import { QUOTE_WELCOME_TEXT } from './quoteTemplateDefaults';
import {
  resolveQuotePackage,
  resolveQuoteLead,
  formatQuoteDate,
  formatQuoteDateShort,
  getDayDate,
  resolveQuoteHotels,
  resolveQuoteVehicles,
  resolveTripPlanner,
  resolvePolicies,
  resolveBankAccounts,
  resolveTravelerCounts,
} from './quotePdfHelpers';

function PolicyBlock({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="quote-ht-policy">
      <div className="quote-ht-policy-head">{title}</div>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const QuotePdfPreview = forwardRef(function QuotePdfPreview({ quote }, ref) {
  if (!quote) return null;

  const lead = resolveQuoteLead(quote);
  const pkg = resolveQuotePackage(quote);
  const p = quote.pricing || {};
  const hotels = resolveQuoteHotels(quote);
  const vehicles = resolveQuoteVehicles(quote);
  const planner = resolveTripPlanner(quote);
  const policies = resolvePolicies(quote);
  const banks = resolveBankAccounts(quote);
  const pax = resolveTravelerCounts(quote);
  const nights = Math.max(1, (pkg.duration || 1) - 1);
  const shortName = pkg.shortName || pkg.name?.split(' ').slice(0, 2).join(' ') || 'Package';

  return (
    <div ref={ref} className="quote-ht-pdf">
      {/* Top company bar */}
      <div className="quote-ht-topbar">
        <div className="quote-ht-logo-block">
          <h1>{COMPANY_INFO.name}</h1>
          <p>{COMPANY_INFO.tagline}</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 10 }}>
          <div style={{ fontWeight: 700 }}>{quote.quoteNumber}</div>
          <div style={{ opacity: 0.9 }}>{COMPANY_INFO.phone}</div>
          <div style={{ opacity: 0.9 }}>{COMPANY_INFO.email}</div>
        </div>
      </div>

      {/* Package banner — same as reference PDF header row */}
      <div className="quote-ht-package-banner">
        <span className="pkg-short">{shortName}</span>
        <span className="pkg-name">
          {pkg.name}
          {nights > 0 && ` · ${nights} Nights ${pkg.duration} Days`}
        </span>
        <span className="pkg-price">{formatINR(p.total)}</span>
        <span className="pkg-badge">{pkg.packageCategory}</span>
      </div>

      <h2 className="quote-ht-main-title">Detailed Day Wise Itinerary</h2>

      {/* Welcome block */}
      <div className="quote-ht-welcome">
        <strong>Hello,</strong>
        <br />
        Welcome to {COMPANY_INFO.name}
        <br /><br />
        {QUOTE_WELCOME_TEXT.split('\n\n').map((para) => (
          <p key={para.slice(0, 24)} style={{ margin: '0 0 8px' }}>{para}</p>
        ))}
        <p style={{ margin: 0 }}>
          For assistance call us 24/7: <strong>{COMPANY_INFO.phone}</strong>
        </p>
      </div>

      {/* Package Overview */}
      <div className="quote-ht-section-title">Package Overview</div>
      <table className="quote-ht-overview">
        <tbody>
          {[
            ['Name of Package', `${pkg.name} [${quote.quoteNumber}]`],
            ['Quotation Date', formatQuoteDate(quote.createdAt)],
            ['Routing', pkg.routing || pkg.destination],
            ['Package Category', pkg.packageCategory],
            ['Duration', `${pkg.duration} Days & ${nights} Nights`],
            ['No. of Rooms', `${pax.rooms}${pax.extraBeds ? ` | Extra Bed: ${pax.extraBeds}` : ''}`],
            ['No. of Traveller', `Adult: ${pax.adults}${pax.kids ? ` | Kids: ${pax.kids}` : ''}`],
            ...(pkg.cabCategory || vehicles[0]?.name ? [['Cab Category', pkg.cabCategory || vehicles[0]?.name]] : []),
            ['Package Cost', `${formatINR(p.total)}/-`],
            ['Prepared For', lead.name || 'Guest'],
            ...(lead.phone ? [['Customer Phone', lead.phone]] : []),
          ].map(([label, value]) => (
            <tr key={label}>
              <td className="label">{label}</td>
              <td className="value">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Package type cost row */}
      <table className="quote-ht-table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Package Type</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ fontWeight: 700 }}>{pkg.packageCategory}</td>
            <td style={{ textAlign: 'right', fontWeight: 800, color: '#ea580c', fontSize: 13 }}>
              {formatINR(p.total)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Hotels */}
      {hotels.length > 0 && (
        <>
          <div className="quote-ht-section-title" style={{ marginTop: 16 }}>Hotel Details</div>
          <table className="quote-ht-table">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>City</th>
                <th style={{ width: '32%' }}>Hotel</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((h) => (
                <tr key={`${h.city}-${h.name}`}>
                  <td><strong>{h.city}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{h.name}</div>
                    {h.similarHotel && (
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Similar Hotel: {h.similarHotel}</div>
                    )}
                  </td>
                  <td>
                    {(h.checkIn || h.checkOut) && (
                      <div>
                        {h.checkIn && formatQuoteDateShort(h.checkIn)}
                        {h.checkIn && h.checkOut && ' — '}
                        {h.checkOut && formatQuoteDateShort(h.checkOut)}
                      </div>
                    )}
                    {h.roomType && <div>Room Type: {h.roomType}</div>}
                    {h.meals && <div>Meals: {h.meals}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Vehicles */}
      {vehicles.length > 0 && (
        <>
          <div className="quote-ht-section-title" style={{ marginTop: 16 }}>Vehicle Details</div>
          <table className="quote-ht-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Start Date</th>
                <th>End Date</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.name}>
                  <td>{v.name}</td>
                  <td>{v.startDate ? formatQuoteDateShort(v.startDate) : '—'}</td>
                  <td>{v.endDate ? formatQuoteDateShort(v.endDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Day-wise itinerary */}
      {pkg.itinerary?.length > 0 && (
        <>
          <div className="quote-ht-section-title standalone" style={{ marginTop: 16, marginBottom: 10 }}>
            Day Wise Itinerary
          </div>
          {pkg.itinerary.map((day) => {
            const dayDate = getDayDate(lead.travelDate, day.day);
            return (
              <div key={day.id} className="quote-ht-day-card">
                <div className="quote-ht-day-head">
                  <div className="day-title">
                    Day : {day.day} — {day.title}
                  </div>
                  <div className="quote-ht-day-meta">
                    {dayDate && <span>📅 {formatQuoteDate(dayDate)}</span>}
                    {day.meals && <span>🍽 {day.meals}</span>}
                    {(day.transport || pkg.cabCategory) && (
                      <span>🚐 {day.transport || pkg.cabCategory}</span>
                    )}
                  </div>
                </div>
                {day.description && (
                  <div className="quote-ht-day-body">{day.description}</div>
                )}
                {(day.sightseeing || day.activities || day.activityNotes) && (
                  <div className="quote-ht-day-extra">
                    {day.sightseeing && (
                      <div><strong>Sightseeing for the day:</strong> {day.sightseeing}</div>
                    )}
                    {day.activities && (
                      <div><strong>Activities:</strong> {day.activities}</div>
                    )}
                    {day.activityNotes && (
                      <div style={{ marginTop: 4, fontStyle: 'italic' }}>{day.activityNotes}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Inclusion & Exclusion */}
      {(pkg.inclusions?.length || pkg.exclusions?.length) && (
        <>
          <div className="quote-ht-section-title" style={{ marginTop: 16 }}>Inclusion &amp; Exclusion</div>
          <div className="quote-ht-inc-exc">
            <div className="inc">
              <h4>Inclusion</h4>
              <ul>
                {(pkg.inclusions || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="exc">
              <h4>Exclusion</h4>
              <ul>
                {(pkg.exclusions || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Policies — same sections as reference PDF */}
      <div className="quote-ht-section-title" style={{ marginTop: 16 }}>Policies &amp; Terms</div>
      <div className="quote-ht-body">
        <PolicyBlock title="Remarks" items={policies.remarks} />
        <PolicyBlock title="Terms & Conditions" items={policies.terms} />
        <PolicyBlock title="Confirmation Policy" items={policies.confirmation} />
        <PolicyBlock title="Cancellation Policy" items={policies.cancellation} />
        <PolicyBlock title="Amendment {Postpone & Prepone Policy}" items={policies.amendment} />
      </div>

      {/* Bank details */}
      <div className="quote-ht-section-title" style={{ marginTop: 8 }}>Bank Details: Cash / Cheque at Bank or Net Transfer</div>
      <table className="quote-ht-bank-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Bank</th>
            <th>Account Name</th>
            <th>Account No.</th>
            <th>IFSC</th>
            <th>Branch</th>
            <th>UPI</th>
          </tr>
        </thead>
        <tbody>
          {banks.map((b, i) => (
            <tr key={b.bank}>
              <td>{i + 1}</td>
              <td><strong>{b.bank}</strong></td>
              <td>{b.accountName}</td>
              <td>{b.accountNo}</td>
              <td>{b.ifsc}</td>
              <td>{b.branch}</td>
              <td>{b.upi || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Trip planner + address */}
      <div className="quote-ht-planner">
        <div className="quote-ht-planner-box">
          <h4>Trip Planner Details</h4>
          <div><strong>Name:</strong> {planner.name}</div>
          {planner.phone && <div><strong>Contact No.:</strong> {planner.phone}</div>}
          {!planner.phone && <div><strong>Contact No.:</strong> {COMPANY_INFO.phone}</div>}
        </div>
        <div className="quote-ht-planner-box">
          <h4>Address &amp; Contact Info</h4>
          <div>{COMPANY_INFO.address}</div>
          <div style={{ marginTop: 6 }}>📞 {COMPANY_INFO.phone}</div>
          <div>✉ {COMPANY_INFO.email}</div>
          <div>🌐 {COMPANY_INFO.website || 'unotrips.com'}</div>
        </div>
      </div>

      <div className="quote-ht-footer">
        <p className="brand">{COMPANY_INFO.name}</p>
        <p>{COMPANY_INFO.address}</p>
        <p>{COMPANY_INFO.phone} · {COMPANY_INFO.email}</p>
        <p style={{ marginTop: 8, opacity: 0.85 }}>Follow With Us · Thank you for choosing {COMPANY_INFO.name}</p>
      </div>
    </div>
  );
});

export default QuotePdfPreview;
