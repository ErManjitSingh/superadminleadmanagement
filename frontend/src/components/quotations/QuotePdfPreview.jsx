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
  resolveQuoteVehicles,
  resolveDayHotelForItinerary,
  resolveTripPlanner,
  resolvePolicies,
  resolveBankAccounts,
  resolveTravelerCounts,
  resolvePaymentPlan,
  resolveQuoteTotal,
} from './quotePdfHelpers';
import DestinationGallery from './DestinationGallery';

const DEMO_QR_URL =
  'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi%3A%2F%2Fpay%3Fpa%3Ddemo%40travelcrm%26pn%3DTravel%2520CRM%26cu%3DINR';

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

function PdfImage({ src, alt, className }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      crossOrigin={src.startsWith('data:') ? undefined : 'anonymous'}
    />
  );
}

const QuotePdfPreview = forwardRef(function QuotePdfPreview({ quote }, ref) {
  if (!quote) return null;

  const lead = resolveQuoteLead(quote);
  const pkg = resolveQuotePackage(quote);
  const packageInfo = quote.packageInfo || {};
  const vehicles = resolveQuoteVehicles(quote);
  const planner = resolveTripPlanner(quote);
  const policies = resolvePolicies(quote);
  const banks = resolveBankAccounts(quote);
  const pax = resolveTravelerCounts(quote);
  const duration = Number(packageInfo.duration || pkg.duration || 0);
  const nights = Math.max(0, duration > 0 ? duration - 1 : 0);
  const packageName = packageInfo.packageName || pkg.name || 'Travel Package';
  const destination = packageInfo.destination || pkg.routing || pkg.destination || lead.destination || '—';
  const travelDate = packageInfo.travelDate || lead.travelDate;
  const coverImage =
    pkg.coverImage ||
    packageInfo.coverImage ||
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80';
  const displayTotal = resolveQuoteTotal(quote);
  const paymentPlan = resolvePaymentPlan(quote, displayTotal);
  const importantNotes = quote.importantNotes || {};
  const itinerary = pkg.itinerary || [];

  return (
    <div ref={ref} className="quote-ht-pdf">
      {/* Premium cover */}
      <section className="quote-ht-cover">
        <PdfImage src={coverImage} alt="" className="quote-ht-cover-bg" />
        <div className="quote-ht-cover-overlay" />
        <div className="quote-ht-cover-content">
          <img
            src={COMPANY_INFO.logoUrl}
            alt={COMPANY_INFO.name}
            className="quote-ht-cover-logo"
            crossOrigin="anonymous"
          />
          <p className="quote-ht-cover-eyebrow">Premium Travel Quotation</p>
          <h1 className="quote-ht-cover-title">{packageName}</h1>
          <p className="quote-ht-cover-dest">{destination}</p>
          <div className="quote-ht-cover-chips">
            {duration > 0 && (
              <span>{nights} Nights · {duration} Days</span>
            )}
            {packageInfo.hotelCategory && <span>{packageInfo.hotelCategory}</span>}
            {packageInfo.mealPlan && <span>{packageInfo.mealPlan}</span>}
          </div>
          <div className="quote-ht-cover-price">
            <span className="lbl">Total Package Cost</span>
            <span className="amt">{formatINR(displayTotal)}</span>
            <span className="ref">{quote.quoteNumber}</span>
          </div>
        </div>
      </section>

      <div className="quote-ht-topbar">
        <div className="quote-ht-brand-row">
          <img
            src={COMPANY_INFO.logoUrl}
            alt={COMPANY_INFO.name}
            className="quote-ht-logo-img"
            crossOrigin="anonymous"
          />
        </div>
        <div className="quote-ht-quote-meta">
          <div className="qnum">{quote.quoteNumber}</div>
          <div>{COMPANY_INFO.phone}</div>
          <div>{COMPANY_INFO.email}</div>
        </div>
      </div>

      <div className="quote-ht-header-block">
        <div className="quote-ht-package-hero">
          <div className="quote-ht-package-hero-main">
            <span className="pkg-code">{quote.quoteNumber}</span>
            <h2 className="pkg-title">{packageName}</h2>
            <div className="pkg-meta-row">
              {duration > 0 && (
                <span className="pkg-chip pkg-chip-duration">
                  {nights} Nights · {duration} Days
                </span>
              )}
              <span className="pkg-chip pkg-chip-route">{destination}</span>
              {lead.name && (
                <span className="pkg-chip">For {lead.name}</span>
              )}
            </div>
          </div>
          <div className="quote-ht-package-hero-price">
            <span className="price-label">Grand Total</span>
            <span className="price-value">{formatINR(displayTotal)}</span>
            <span className="price-note">All inclusive · {quote.quoteNumber}</span>
          </div>
        </div>

        <DestinationGallery
          quote={quote}
          destination={destination}
          compact
        />
      </div>

      <div className="quote-ht-welcome">
        <strong>Hello {lead.name || 'Guest'},</strong>
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

      {/* Package Overview — no category / package type */}
      <div className="quote-ht-section-title">Package Overview</div>
      <table className="quote-ht-overview">
        <tbody>
          {[
            ['Name of Package', `${packageName} [${quote.quoteNumber}]`],
            ['Quotation Date', formatQuoteDate(quote.createdAt)],
            ['Destination', destination],
            ['Travel Date', formatQuoteDate(travelDate)],
            ['Duration', duration ? `${duration} Days & ${nights} Nights` : '—'],
            ['No. of Travellers', `Adult: ${pax.adults}${pax.kids ? ` | Kids: ${pax.kids}` : ''}`],
            ['Meal Plan', packageInfo.mealPlan || '—'],
            ...(packageInfo.hotelCategory ? [['Hotel Category', packageInfo.hotelCategory]] : []),
            ['Prepared For', lead.name || 'Guest'],
            ...(lead.phone ? [['Customer Phone', lead.phone]] : []),
            ['Total Package Cost', `${formatINR(displayTotal)}/-`],
          ].map(([label, value]) => (
            <tr key={label}>
              <td className="label">{label}</td>
              <td className="value">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total cost highlight */}
      <div className="quote-ht-total-banner">
        <div>
          <span className="quote-ht-total-banner-lbl">Total Package Cost</span>
          <span className="quote-ht-total-banner-amt">{formatINR(displayTotal)}</span>
        </div>
        <span className="quote-ht-total-banner-note">Inclusive of taxes as applicable</span>
      </div>

      {/* Vehicles — clear details */}
      {vehicles.length > 0 && (
        <>
          <div className="quote-ht-section-title" style={{ marginTop: 18 }}>Vehicle Details</div>
          <div className="quote-ht-vehicle-grid">
            {vehicles.map((v) => (
              <div key={`${v.name}-${v.type}`} className="quote-ht-vehicle-card">
                <div className="quote-ht-vehicle-name">{v.name}</div>
                <div className="quote-ht-vehicle-meta">
                  {v.type && <span>{v.type}</span>}
                  <span>{v.count || 1} Vehicle{(v.count || 1) > 1 ? 's' : ''}</span>
                  {v.cost > 0 && <span>{formatINR(v.cost)}</span>}
                </div>
                <div className="quote-ht-vehicle-dates">
                  {v.startDate ? formatQuoteDateShort(v.startDate) : '—'}
                  {' → '}
                  {v.endDate ? formatQuoteDateShort(v.endDate) : '—'}
                </div>
                {v.notes && <div className="quote-ht-vehicle-notes">{v.notes}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Day-wise itinerary with hotel (no separate hotel section) */}
      {itinerary.length > 0 && (
        <>
          <div className="quote-ht-section-title" style={{ marginTop: 18 }}>Day Wise Itinerary</div>
          {itinerary.map((day, index) => {
            const dayNum = day.day || index + 1;
            const dayDate = getDayDate(travelDate, dayNum);
            const dayHotel = resolveDayHotelForItinerary(quote, dayNum);
            return (
              <div key={day.id || `day-${dayNum}`} className="quote-ht-day-card">
                <div className="quote-ht-day-head">
                  <div className="day-title">
                    <span className="quote-ht-day-num">{dayNum}</span>
                    <span>{day.title || `Day ${dayNum}`}</span>
                  </div>
                  <div className="quote-ht-day-meta">
                    {dayDate && (
                      <span className="quote-ht-meta-pill">
                        <span className="lbl">Date</span> {formatQuoteDate(dayDate)}
                      </span>
                    )}
                    {(day.meals || dayHotel?.meals) && (
                      <span className="quote-ht-meta-pill">
                        <span className="lbl">Meals</span> {day.meals || dayHotel?.meals}
                      </span>
                    )}
                    {(day.transport || vehicles[0]?.name) && (
                      <span className="quote-ht-meta-pill">
                        <span className="lbl">Cab</span> {day.transport || vehicles[0]?.name}
                      </span>
                    )}
                  </div>
                </div>

                {day.description && (
                  <div className="quote-ht-day-body">{day.description}</div>
                )}

                {dayHotel?.name && (
                  <div className="quote-ht-day-hotel-inline">
                    <div className="quote-ht-day-hotel-inline-title">Stay</div>
                    <div className="quote-ht-day-hotel-inline-body">
                      <strong>{dayHotel.name}</strong>
                      {dayHotel.roomType && <span> · {dayHotel.roomType}</span>}
                      {dayHotel.meals && <span> · {dayHotel.meals}</span>}
                      {dayHotel.city && dayHotel.city !== '—' && <span> · {dayHotel.city}</span>}
                    </div>
                  </div>
                )}

                {(day.sightseeing || day.activities || day.activityNotes) && (
                  <div className="quote-ht-day-extra">
                    {day.sightseeing && (
                      <div><strong>Sightseeing:</strong> {day.sightseeing}</div>
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

      {/* Payment schedule — 30 / 50 / 20 */}
      <div className="quote-ht-section-title" style={{ marginTop: 18 }}>Payment Schedule</div>
      <div className="quote-ht-payment-grid">
        {paymentPlan.map((row) => (
          <div key={row.label} className="quote-ht-payment-card">
            <span className="quote-ht-payment-pct">{row.percent}%</span>
            <span className="quote-ht-payment-label">{row.label}</span>
            <span className="quote-ht-payment-amt">{formatINR(row.amount)}</span>
          </div>
        ))}
      </div>

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

      {/* Policies */}
      <div className="quote-ht-section-title" style={{ marginTop: 16 }}>Policies &amp; Terms</div>
      <div className="quote-ht-body">
        {importantNotes.travelGuidelines && (
          <PolicyBlock title="Travel Guidelines" items={[importantNotes.travelGuidelines]} />
        )}
        <PolicyBlock title="Remarks" items={policies.remarks} />
        <PolicyBlock
          title="Terms & Conditions"
          items={
            importantNotes.termsAndConditions
              ? [importantNotes.termsAndConditions, ...(policies.terms || [])]
              : policies.terms
          }
        />
        <PolicyBlock
          title="Cancellation Policy"
          items={
            importantNotes.cancellationPolicy
              ? [importantNotes.cancellationPolicy, ...(policies.cancellation || [])]
              : policies.cancellation
          }
        />
      </div>

      {/* Bank details — single account + QR */}
      <div className="quote-ht-section-title" style={{ marginTop: 8 }}>Bank Details</div>
      <div className="quote-ht-bank-qr-wrap">
        <table className="quote-ht-bank-table quote-ht-bank-table-single">
          <thead>
            <tr>
              <th>Bank</th>
              <th>Account Name</th>
              <th>Account No.</th>
              <th>IFSC</th>
              <th>Branch</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((b) => (
              <tr key={b.bank}>
                <td><strong>{b.bank}</strong></td>
                <td>{b.accountName}</td>
                <td>{b.accountNo}</td>
                <td>{b.ifsc}</td>
                <td>{b.branch}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="quote-ht-qr-block">
          <img
            src={DEMO_QR_URL}
            alt="Payment QR Code"
            className="quote-ht-qr-img"
            crossOrigin="anonymous"
          />
          <p className="quote-ht-qr-label">Scan to Pay</p>
          <p className="quote-ht-qr-demo">Demo QR · UPI payment</p>
        </div>
      </div>

      <div className="quote-ht-planner">
        <div className="quote-ht-planner-box">
          <h4>Trip Planner Details</h4>
          <div><strong>Name:</strong> {planner.name}</div>
          <div><strong>Contact No.:</strong> {planner.phone || COMPANY_INFO.phone}</div>
        </div>
        <div className="quote-ht-planner-box">
          <h4>Address &amp; Contact Info</h4>
          <div>{COMPANY_INFO.address}</div>
          <div className="quote-ht-contact-line">Phone: {COMPANY_INFO.phone}</div>
          <div className="quote-ht-contact-line">Email: {COMPANY_INFO.email}</div>
          <div className="quote-ht-contact-line">Web: {COMPANY_INFO.website}</div>
        </div>
      </div>

      <div className="quote-ht-footer">
        <img
          src={COMPANY_INFO.logoUrl}
          alt={COMPANY_INFO.name}
          className="quote-ht-footer-logo"
          crossOrigin="anonymous"
        />
        <p>{COMPANY_INFO.tagline}</p>
        <p>{COMPANY_INFO.address}</p>
        <p>{COMPANY_INFO.phone} · {COMPANY_INFO.email}</p>
        <p style={{ marginTop: 8, opacity: 0.9 }}>Thank you for choosing {COMPANY_INFO.name}</p>
      </div>
    </div>
  );
});

export default QuotePdfPreview;
