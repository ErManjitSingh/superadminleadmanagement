import { forwardRef } from 'react';
import './quotePdfTemplate.css';
import { COMPANY_INFO } from './constants';
import { useTenant } from '../../context/TenantContext';
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
  'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi%3A%2F%2Fpay%3Fpa%3Ddemo%40travelcrm%26pn%3DTravel%2520CRM%26cu%3DINR';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80';

function PolicyBlock({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="quote-ht-policy">
      <div className="quote-ht-policy-head">{title}</div>
      <ul>
        {items.map((item) => (
          <li key={String(item).slice(0, 40)}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const QuotePdfPreview = forwardRef(function QuotePdfPreview({ quote }, ref) {
  const { company } = useTenant();
  const brandName = company?.name || COMPANY_INFO.name;
  if (!quote) return null;

  const lead = resolveQuoteLead(quote);
  const pkg = resolveQuotePackage(quote);
  const packageInfo = quote.packageInfo || {};
  const vehicles = resolveQuoteVehicles(quote);
  const planner = resolveTripPlanner(quote);
  const policies = resolvePolicies(quote);
  const banks = resolveBankAccounts(quote);
  const bank = banks[0] || null;
  const pax = resolveTravelerCounts(quote);
  const duration = Number(packageInfo.duration || pkg.duration || 0);
  const nights = Math.max(0, duration > 0 ? duration - 1 : 0);
  const packageName = packageInfo.packageName || pkg.name || 'Travel Package';
  const destination =
    packageInfo.destination || pkg.routing || pkg.destination || lead.destination || '—';
  const travelDate = packageInfo.travelDate || lead.travelDate;
  const displayTotal = resolveQuoteTotal(quote);
  const paymentPlan = resolvePaymentPlan(quote, displayTotal);
  const importantNotes = quote.importantNotes || {};
  const itinerary = pkg.itinerary || [];
  const quoteNo = quote.quoteNumber || 'QUOTE';
  const coverImage = pkg.coverImage || packageInfo.coverImage || DEFAULT_COVER;

  return (
    <div ref={ref} className="quote-ht-pdf quote-ht-pdf-v2">
      {/* Watermark — company name */}
      <div className="qp-watermark" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="qp-watermark-text">{brandName}</span>
        ))}
      </div>

      {/* Header */}
      <header className="qp-header">
        <div className="qp-header-left">
          <img
            src={COMPANY_INFO.logoUrl}
            alt={COMPANY_INFO.name}
            className="qp-logo"
            crossOrigin="anonymous"
          />
          <div>
            <p className="qp-brand">{COMPANY_INFO.name}</p>
            <p className="qp-tagline">{COMPANY_INFO.tagline}</p>
          </div>
        </div>
        <div className="qp-header-right">
          <p className="qp-quote-no">{quoteNo}</p>
          <p>{formatQuoteDate(quote.createdAt)}</p>
          <p>{COMPANY_INFO.phone}</p>
        </div>
      </header>

      {/* Hero with cover image */}
      <section className="qp-hero qp-hero-with-image">
        <img
          src={coverImage}
          alt=""
          className="qp-hero-bg"
          crossOrigin="anonymous"
        />
        <div className="qp-hero-overlay" />
        <div className="qp-hero-content">
          <div className="qp-hero-main">
            <p className="qp-eyebrow">Travel Quotation</p>
            <h1 className="qp-title">{packageName}</h1>
            <p className="qp-dest">{destination}</p>
            <div className="qp-chips">
              {duration > 0 && (
                <span>{nights} Nights / {duration} Days</span>
              )}
              {travelDate && <span>{formatQuoteDate(travelDate)}</span>}
              {lead.name && <span>For {lead.name}</span>}
            </div>
          </div>
          <div className="qp-hero-price">
            <span className="qp-price-lbl">Total Package Cost</span>
            <span className="qp-price-amt">{formatINR(displayTotal)}</span>
            <span className="qp-price-sub">All inclusive</span>
          </div>
        </div>
      </section>

      {/* Destination images */}
      <div className="qp-gallery-wrap">
        <DestinationGallery quote={quote} destination={destination} compact />
      </div>

      {/* Welcome */}
      <section className="qp-welcome">
        <p><strong>Hello {lead.name || 'Guest'},</strong></p>
        <p>Welcome to {COMPANY_INFO.name}.</p>
        {QUOTE_WELCOME_TEXT.split('\n\n').slice(0, 2).map((para) => (
          <p key={para.slice(0, 20)}>{para}</p>
        ))}
      </section>

      {/* Package Overview */}
      <section className="qp-section-block qp-section-block-keep">
        <h2 className="qp-section">Package Overview</h2>
        <div className="qp-overview-grid">
          {[
            ['Package', packageName],
            ['Quote No.', quoteNo],
            ['Destination', destination],
            ['Travel Date', formatQuoteDate(travelDate)],
            ['Duration', duration ? `${duration} Days / ${nights} Nights` : '—'],
            ['Travellers', `Adults: ${pax.adults}${pax.kids ? ` · Kids: ${pax.kids}` : ''}`],
            ['Meal Plan', packageInfo.mealPlan || '—'],
            ['Customer', lead.name || 'Guest'],
            ...(lead.phone ? [['Phone', lead.phone]] : []),
          ].map(([label, value]) => (
            <div key={label} className="qp-overview-item">
              <span className="qp-overview-lbl">{label}</span>
              <span className="qp-overview-val">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Vehicles */}
      {vehicles.length > 0 && (
        <section className="qp-section-block">
          <h2 className="qp-section">Vehicle Details</h2>
          <div className="qp-vehicle-list">
            {vehicles.map((v) => (
              <div key={`${v.name}-${v.type}`} className="qp-vehicle-row">
                <span className="qp-vehicle-icon" aria-hidden="true">🚐</span>
                <div className="qp-vehicle-body">
                  <p className="qp-vehicle-name">{v.name}</p>
                  <p className="qp-vehicle-meta">
                    {[v.type, `${v.count || 1} Vehicle${(v.count || 1) > 1 ? 's' : ''}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <p className="qp-vehicle-dates">
                    {v.startDate ? formatQuoteDateShort(v.startDate) : '—'}
                    {' → '}
                    {v.endDate ? formatQuoteDateShort(v.endDate) : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Day-wise itinerary + hotel */}
      {itinerary.length > 0 && (
        <section className="qp-section-block">
          <h2 className="qp-section">Day Wise Itinerary</h2>
          {itinerary.map((day, index) => {
            const dayNum = day.day || index + 1;
            const dayDate = getDayDate(travelDate, dayNum);
            const dayHotel = resolveDayHotelForItinerary(quote, dayNum);
            return (
              <article key={day.id || `day-${dayNum}`} className="qp-day">
                <div className="qp-day-head">
                  <span className="qp-day-num">Day {dayNum}</span>
                  <div className="qp-day-title-wrap">
                    <h3>{day.title || `Day ${dayNum}`}</h3>
                    <div className="qp-day-pills">
                      {dayDate && <span>{formatQuoteDate(dayDate)}</span>}
                      {(day.meals || dayHotel?.meals) && (
                        <span>{day.meals || dayHotel?.meals}</span>
                      )}
                      {(day.transport || vehicles[0]?.name) && (
                        <span>{day.transport || vehicles[0]?.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                {day.description && <p className="qp-day-desc">{day.description}</p>}
                {dayHotel?.name && (
                  <div className="qp-day-stay">
                    <span className="qp-day-stay-lbl">Stay</span>
                    <div className="qp-day-stay-body">
                      {(dayHotel.hotelImages?.[0] || dayHotel.thumbnailUrl || dayHotel.roomImage) && (
                        <img
                          src={dayHotel.hotelImages?.[0] || dayHotel.thumbnailUrl || dayHotel.roomImage}
                          alt={dayHotel.name}
                          className="qp-day-stay-img"
                          crossOrigin="anonymous"
                        />
                      )}
                      <p>
                        <strong>{dayHotel.name}</strong>
                        {dayHotel.roomType ? ` · ${dayHotel.roomType}` : ''}
                        {dayHotel.meals ? ` · ${dayHotel.meals}` : ''}
                        {dayHotel.city && dayHotel.city !== '—' ? ` · ${dayHotel.city}` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* Payment schedule — percentage only, no line-item amounts */}
      <section className="qp-section-block qp-section-block-keep">
        <h2 className="qp-section">Payment Schedule</h2>
        <div className="qp-pay-grid">
          {paymentPlan.map((row) => (
            <div key={row.label} className="qp-pay-card">
              <span className="qp-pay-pct">{row.percent}%</span>
              <span className="qp-pay-lbl">{row.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Inclusions & Exclusions — premium side-by-side */}
      <section className="qp-section-block qp-section-block-keep">
        <h2 className="qp-section">Inclusions &amp; Exclusions</h2>
        <div className="qp-inc-exc-premium">
        <div className="qp-inc-panel">
          <div className="qp-inc-exc-head qp-inc-head">
            <span className="qp-inc-exc-badge">✓</span>
            <h3>What&apos;s Included</h3>
          </div>
          <ul className="qp-inc-exc-list">
            {policies.inclusions.map((item) => (
              <li key={item}>
                <span className="qp-list-icon qp-list-icon-inc" aria-hidden="true">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="qp-exc-panel">
          <div className="qp-inc-exc-head qp-exc-head">
            <span className="qp-inc-exc-badge qp-exc-badge">✕</span>
            <h3>What&apos;s Not Included</h3>
          </div>
          <ul className="qp-inc-exc-list">
            {policies.exclusions.map((item) => (
              <li key={item}>
                <span className="qp-list-icon qp-list-icon-exc" aria-hidden="true">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </section>

      {/* Payment details text */}
      <section className="qp-section-block">
        <h2 className="qp-section">Payment Details</h2>
        <div className="qp-policies">
          <PolicyBlock title="Payment Instructions" items={policies.paymentDetails} />
        </div>
      </section>

      {/* Terms & Conditions */}
      <section className="qp-section-block">
        <h2 className="qp-section">Terms &amp; Conditions</h2>
        <div className="qp-policies">
          {policies.termsAndConditions.map((section) => (
            <PolicyBlock key={section.title} title={section.title} items={section.items} />
          ))}
          {importantNotes.termsAndConditions && (
            <PolicyBlock title="Additional Notes" items={[importantNotes.termsAndConditions]} />
          )}
        </div>
      </section>

      {/* Bank details — card layout, one account + QR */}
      <section className="qp-section-block qp-section-block-keep">
        <h2 className="qp-section">Bank Details</h2>
        <div className="qp-bank-wrap">
        {bank ? (
          <div className="qp-bank-card">
            <p className="qp-bank-name">{bank.bank}</p>
            <div className="qp-bank-rows">
              <div><span>Account Name</span><strong>{bank.accountName}</strong></div>
              <div><span>Account No.</span><strong>{bank.accountNo}</strong></div>
              <div><span>IFSC</span><strong>{bank.ifsc}</strong></div>
              <div><span>Branch</span><strong>{bank.branch}</strong></div>
              {bank.upi && bank.upi !== '—' && (
                <div><span>UPI</span><strong>{bank.upi}</strong></div>
              )}
            </div>
          </div>
        ) : (
          <div className="qp-bank-card">
            <p className="qp-bank-name">Bank details unavailable</p>
          </div>
        )}
        <div className="qp-qr-card">
          <img
            src={DEMO_QR_URL}
            alt="Scan to pay"
            className="qp-qr-img"
            crossOrigin="anonymous"
          />
          <p className="qp-qr-title">Scan to Pay</p>
          <p className="qp-qr-demo">Demo QR Code</p>
        </div>
      </div>
      </section>

      {/* Contact */}
      <div className="qp-contact">
        <div>
          <h4>Trip Planner</h4>
          <p>{planner.name}</p>
          <p>{planner.phone || COMPANY_INFO.phone}</p>
        </div>
        <div>
          <h4>Contact Us</h4>
          <p>{COMPANY_INFO.address}</p>
          <p>{COMPANY_INFO.phone}</p>
          <p>{COMPANY_INFO.email}</p>
        </div>
      </div>

      <footer className="qp-footer">
        <p>Thank you for choosing {COMPANY_INFO.name}</p>
        <p>{COMPANY_INFO.phone} · {COMPANY_INFO.email}</p>
      </footer>
    </div>
  );
});

export default QuotePdfPreview;
