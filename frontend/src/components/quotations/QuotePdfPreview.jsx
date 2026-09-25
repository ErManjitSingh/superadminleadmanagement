import { forwardRef } from 'react';
import './quotePdfTemplate.css';
import './quotePdfEmbDesign.css';
import { COMPANY_INFO, quoteHasHotels } from './constants';
import { useTenant } from '../../context/TenantContext';
import { formatINR } from './quotationUtils';
import { resolveQuoteWelcomeText } from './quoteTemplateDefaults';
import {
  resolveQuotePackage,
  resolveQuoteLead,
  formatQuoteDate,
  formatQuoteDateShort,
  getDayDate,
  resolveQuoteVehicles,
  resolveDayHotelForItinerary,
  resolveTripPlanner,
  quotationVisiblePhone,
  resolvePolicies,
  resolveBankAccounts,
  resolveTravelerCounts,
  resolvePaymentPlan,
  resolveQuoteTotal,
  resolveQuoteDisplayNumber,
  resolveHotelStayChoices,
  sanitizeTransportLabel,
  sanitizeItineraryDayTitle,
} from './quotePdfHelpers';
import { getPaymentQrSrc, PAYMENT_UPI_ID } from './paymentQr';
import travelAgentCertificate from '../../assets/hp-travel-agent-certificate.png';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80';

const OVERVIEW_ICONS = ['📦', '📋', '📍', '📅', '🏁', '⏱', '👥', '🍽', '🏨', '👤', '📞', '💼'];
const OVERVIEW_ICON_COLORS = ['qp-ico-blue', 'qp-ico-green', 'qp-ico-orange', 'qp-ico-purple'];
const TRUST_ITEMS = [
  { icon: '🏍', label: 'Premium Fleet' },
  { icon: '🚗', label: 'Private Cabs' },
  { icon: '😊', label: 'Happy Travellers' },
  { icon: '🛡', label: 'Safe & Secure' },
  { icon: '🎧', label: '24/7 Support' },
];

function SectionHead({ icon, title }) {
  return (
    <h2 className="qp-section-head">
      <span className="qp-section-icon" aria-hidden="true">{icon}</span>
      {title}
    </h2>
  );
}

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
  const companyAddress = [company?.address, company?.city, company?.state]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ');

  const brand = {
    name: company?.name || COMPANY_INFO.name,
    tagline: company?.tagline || COMPANY_INFO.tagline,
    logoUrl: company?.logo || company?.branding?.logo || COMPANY_INFO.logoUrl,
    phone: quotationVisiblePhone(company?.phone || COMPANY_INFO.phone),
    email: company?.email || COMPANY_INFO.email,
    website: company?.website || COMPANY_INFO.website,
    address: companyAddress || COMPANY_INFO.address,
  };
  if (!quote) return null;

  const lead = resolveQuoteLead(quote);
  const pkg = resolveQuotePackage(quote);
  const packageInfo = quote.packageInfo || {};
  const includesHotel = quoteHasHotels(quote);
  const welcomeText = resolveQuoteWelcomeText(quote);
  const vehicles = resolveQuoteVehicles(quote);
  const hotelStays = includesHotel ? resolveHotelStayChoices(quote) : [];
  const planner = resolveTripPlanner(quote);
  const policies = resolvePolicies(quote);
  const companyBanks = (company?.bankAccounts || []).filter((b) => b && (b.bank || b.accountNo || b.upi));
  const banks = companyBanks.length ? companyBanks : resolveBankAccounts(quote);
  const bank = banks[0] || null;
  const upiId = company?.upiId || bank?.upi || PAYMENT_UPI_ID;
  const qrUrl = getPaymentQrSrc();
  const pax = resolveTravelerCounts(quote);
  const duration = Number(packageInfo.duration || pkg.duration || 0);
  const nights = Math.max(0, duration > 0 ? duration - 1 : 0);
  const packageName = packageInfo.packageName || pkg.name || 'Travel Package';
  const destination =
    packageInfo.destination || pkg.routing || pkg.destination || lead.destination || '—';
  const travelDate = packageInfo.travelDate || lead.travelDate;
  const tourEndDate = duration > 0 ? getDayDate(travelDate, Math.max(1, duration)) : null;
  const displayTotal = resolveQuoteTotal(quote);
  const paymentPlan = resolvePaymentPlan(quote, displayTotal);
  const importantNotes = quote.importantNotes || {};
  const itinerary = pkg.itinerary || [];
  const quoteNo = resolveQuoteDisplayNumber(quote);
  const executivePhone = planner.phone || '';
  const coverImage = pkg.coverImage || packageInfo.coverImage || DEFAULT_COVER;

  return (
    <div
      ref={ref}
      className="quote-ht-pdf quote-ht-pdf-v2"
    >
      {/* Header */}
      <header className="qp-header">
        <div className="qp-header-left">
          <img
            src={brand.logoUrl}
            alt={brand.name}
            className="qp-logo"
            crossOrigin="anonymous"
          />
          <div>
            <p className="qp-brand">{brand.name}</p>
            <p className="qp-tagline">{brand.tagline}</p>
          </div>
        </div>
        <div className="qp-header-right">
          <p className="qp-quote-no">Quote No: {quoteNo}</p>
          <p>{formatQuoteDate(quote.createdAt)}</p>
          {(executivePhone || brand.phone) && <p>{executivePhone || brand.phone}</p>}
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
              {travelDate && (
                <span>
                  {formatQuoteDateShort(travelDate)}
                  {tourEndDate ? ` → ${formatQuoteDateShort(tourEndDate)}` : ''}
                </span>
              )}
            </div>
            {lead.name && <span className="qp-customer-pill">For {lead.name}</span>}
          </div>
          <div className="qp-hero-price">
            <span className="qp-price-lbl">Total Package Cost</span>
            <span className="qp-price-amt">{formatINR(displayTotal)}</span>
            <span className="qp-price-sub">All Inclusive</span>
          </div>
        </div>
      </section>

      {/* Welcome */}
      <section className="qp-welcome">
        <div className="qp-welcome-icon" aria-hidden="true">⛰</div>
        <div className="qp-welcome-body">
          <p><strong>Hello {lead.name || 'Guest'},</strong></p>
          <p>
            Welcome to <span className="qp-welcome-highlight">{brand.name}</span>.
          </p>
          {welcomeText.split('\n\n').slice(0, 2).map((para) => (
            <p key={para.slice(0, 20)}>{para}</p>
          ))}
        </div>
      </section>

      {/* Package Overview */}
      <section className="qp-section-block">
        <SectionHead icon="📄" title="Package Overview" />
        <div className="qp-overview-grid">
          {[
            ['Package', packageName],
            ['Quote No.', quoteNo],
            ['Destination', destination],
            ['Tour Start Date', formatQuoteDate(travelDate)],
            ['Tour End Date', formatQuoteDate(tourEndDate)],
            ['Duration', duration ? `${duration} Days / ${nights} Nights` : '—'],
            ['Travellers', `Adults: ${pax.adults}${pax.kids ? ` · Kids: ${pax.kids}` : ''}`],
            ...(includesHotel ? [['Meal Plan', packageInfo.mealPlan || '—']] : []),
            ...(includesHotel && packageInfo.hotelCategory
              ? [['Hotel Category', packageInfo.hotelCategory]]
              : []),
            ['Customer', lead.name || 'Guest'],
            ...(quotationVisiblePhone(lead.phone) ? [['Customer Phone', quotationVisiblePhone(lead.phone)]] : []),
            ...(planner.name ? [['Sales Executive', planner.name]] : []),
            ...(executivePhone ? [['Executive Phone', executivePhone]] : []),
          ].map(([label, value], index) => (
            <div key={label} className="qp-overview-item">
              <span
                className={`qp-overview-icon ${OVERVIEW_ICON_COLORS[index % OVERVIEW_ICON_COLORS.length]}`}
                aria-hidden="true"
              >
                {OVERVIEW_ICONS[index % OVERVIEW_ICONS.length]}
              </span>
              <div className="qp-overview-text">
                <span className="qp-overview-lbl">{label}</span>
                <span className="qp-overview-val">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hotel stay choices — Option 1 / Option 2 */}
      {hotelStays.length > 0 && (
        <section className="qp-section-block">
          <SectionHead
            icon="🏨"
            title={hotelStays.some((s) => s.hasChoice) ? 'Hotel Options — Choose One' : 'Hotel Stay'}
          />
          {hotelStays.some((s) => s.hasChoice) && (
            <p className="qp-choice-note">
              Har stay ke liye do hotel options diye gaye hain. Apni pasand ka ek hotel choose karein.
            </p>
          )}
          {hotelStays.map((stay) => (
            <div key={`stay-${stay.index}`} className="qp-stay-block">
              {(stay.location || stay.checkIn || stay.nights > 0) && (
                <p className="qp-stay-meta">
                  {[
                    stay.location,
                    stay.nights > 0 ? `${stay.nights} Night${stay.nights > 1 ? 's' : ''}` : null,
                    stay.checkIn
                      ? `${formatQuoteDateShort(stay.checkIn)}${stay.checkOut ? ` → ${formatQuoteDateShort(stay.checkOut)}` : ''}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              <div className={stay.hasChoice ? 'qp-choice-grid' : undefined}>
                {stay.options.map((opt) => (
                  <div key={`${stay.index}-${opt.label}`} className="qp-choice-card">
                    {stay.hasChoice && <span className="qp-choice-badge">{opt.label}</span>}
                    <p className="qp-choice-name">{opt.name}</p>
                    <p className="qp-choice-meta">
                      {[opt.category, opt.roomType, opt.mealPlan].filter(Boolean).join(' · ')}
                    </p>
                    {Number(opt.price) > 0 && (
                      <p className="qp-choice-price">{formatINR(opt.price)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Vehicles — Option 1 / Option 2 with prices */}
      {vehicles.length > 0 && (
        <section className="qp-section-block">
          <SectionHead icon="🚗" title={vehicles.length > 1 ? 'Cab Options — Choose One' : 'Vehicle Details'} />
          {vehicles.length > 1 && (
            <p className="qp-choice-note">Do cab options diye gaye hain. Apni pasand ki ek cab choose karein.</p>
          )}
          <div className={vehicles.length > 1 ? 'qp-choice-grid' : undefined}>
            {vehicles.map((v, i) => {
              const multi = vehicles.length > 1;
              return (
                <div
                  key={`${v.optionLabel}-${v.name}-${i}`}
                  className={multi ? 'qp-choice-card qp-cab-option' : 'qp-vehicle-banner'}
                >
                  {multi && (
                    <span className="qp-choice-badge">{v.optionLabel || `Option ${i + 1}`}</span>
                  )}
                  {!multi && (
                    <div className="qp-vehicle-thumb qp-vehicle-thumb-placeholder" aria-hidden="true">🚐</div>
                  )}
                  <div className="qp-vehicle-body">
                    <p className="qp-vehicle-name">{v.name}</p>
                    <p className="qp-vehicle-meta">
                      {[v.type, `${v.count || 1} Vehicle${(v.count || 1) > 1 ? 's' : ''}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {Number(v.cost) > 0 && (
                      <p className="qp-choice-price">{formatINR(v.cost)}</p>
                    )}
                    <p className="qp-vehicle-dates">
                      <span aria-hidden="true">📅</span>
                      {v.startDate ? formatQuoteDateShort(v.startDate) : '—'}
                      {' → '}
                      {v.endDate ? formatQuoteDateShort(v.endDate) : '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Day-wise itinerary — timeline layout */}
      {itinerary.length > 0 && (
        <section className="qp-section-block">
          <SectionHead icon="🗺" title="Day Wise Itinerary" />
          <div className="qp-timeline">
            {itinerary.map((day, index) => {
              const dayNum = day.day || index + 1;
              const dayDate = getDayDate(travelDate, dayNum);
              const dayHotel = includesHotel ? resolveDayHotelForItinerary(quote, dayNum) : null;
              const dayTitle = sanitizeItineraryDayTitle(
                day.title || `Day ${dayNum}`,
                destination,
              );
              const isLast = index === itinerary.length - 1;
              const stayDestination = dayHotel?.city && dayHotel.city !== '—' && dayHotel.city !== '-'
                ? dayHotel.city
                : '';
              return (
                <div key={day.id || `day-${dayNum}`} className="qp-timeline-row">
                  <div className="qp-timeline-rail">
                    <span className={`qp-timeline-dot${isLast ? ' is-last' : ''}`}>
                      Day {dayNum}
                    </span>
                    {!isLast && <span className="qp-timeline-line" aria-hidden="true" />}
                  </div>
                  <div className="qp-timeline-body">
                    <h3>{dayTitle}</h3>
                    <div className="qp-timeline-meta">
                      {dayDate && <span>📅 {formatQuoteDate(dayDate)}</span>}
                      {(day.transport || vehicles[0]?.name) && (
                        <span>🚗 {sanitizeTransportLabel(day.transport || vehicles[0]?.name)}</span>
                      )}
                    </div>
                    {day.description && <p className="qp-timeline-desc">{day.description}</p>}
                    {includesHotel && dayHotel?.name && (
                      <div className="qp-timeline-stay">
                        Stay: <strong>{dayHotel.name}</strong>
                        {stayDestination ? ` · ${stayDestination}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Trust bar */}
      <div className="qp-trust-bar">
        {TRUST_ITEMS.map((item) => (
          <div key={item.label} className="qp-trust-item">
            <div className="qp-trust-icon" aria-hidden="true">{item.icon}</div>
            <div className="qp-trust-label">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Payment schedule — full width */}
      <section className="qp-section-block qp-pay-section">
        <SectionHead icon="💳" title="Payment Schedule" />
        <div
          className="qp-pay-schedule"
          style={{ '--qp-pay-cols': paymentPlan.length }}
        >
          <div className="qp-pay-steps-grid">
            {paymentPlan.map((row, index) => (
              <div key={row.label} className="qp-pay-step-card">
                <div className="qp-pay-step-head">
                  <span className="qp-pay-step-num">{index + 1}</span>
                  <span className="qp-pay-step-pct">{row.percent}%</span>
                </div>
                <div className="qp-pay-step-title">{row.label}</div>
                {displayTotal > 0 && (
                  <div className="qp-pay-step-amt">{formatINR(row.amount)}</div>
                )}
                {index < paymentPlan.length - 1 && (
                  <span className="qp-pay-step-arrow" aria-hidden="true">→</span>
                )}
              </div>
            ))}
          </div>
          <div className="qp-pay-secure-bar">
            <span className="qp-pay-secure-icon" aria-hidden="true">🛡</span>
            <strong className="qp-pay-secure-title">Flexible Payments</strong>
            <span className="qp-pay-secure-dot" aria-hidden="true">·</span>
            <span className="qp-pay-secure-sub">100% Secure Transactions</span>
          </div>
        </div>
      </section>

      {/* Inclusions & Exclusions — premium side-by-side */}
      <section className="qp-section-block">
        <SectionHead icon="✓" title="Inclusions & Exclusions" />
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
        <SectionHead icon="💰" title="Payment Details" />
        <div className="qp-policies">
          <PolicyBlock title="Payment Instructions" items={policies.paymentDetails} />
        </div>
      </section>

      {/* Terms & Conditions */}
      <section className="qp-section-block">
        <SectionHead icon="📜" title="Terms & Conditions" />
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
      <section className="qp-section-block">
        <SectionHead icon="🏦" title="Bank Details" />
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
            src={qrUrl}
            alt="Scan to pay"
            className="qp-qr-img"
            crossOrigin="anonymous"
          />
          <p className="qp-qr-title">Scan to Pay</p>
          <p className="qp-qr-demo">UPI ID: {upiId || PAYMENT_UPI_ID}</p>
        </div>
      </div>
      </section>

      {/* Contact */}
      <div className="qp-contact">
        <div>
          <h4>Sales Executive</h4>
          <p>{planner.name}</p>
          {executivePhone ? <p>{executivePhone}</p> : null}
        </div>
        <div>
          <h4>Contact Us</h4>
          <p>{brand.address}</p>
          {(executivePhone || brand.phone) ? <p>{executivePhone || brand.phone}</p> : null}
          <p>{brand.email}</p>
        </div>
      </div>

      <footer className="qp-footer">
        <p>Thank you for choosing {brand.name}</p>
        <p>{[executivePhone || brand.phone, brand.email].filter(Boolean).join(' · ')}</p>
      </footer>

      <section className="qp-certificate-page" aria-label="Travel agent registration certificate">
        <p className="qp-certificate-title">Certificate of Registration of Travel Agent</p>
        <img
          src={travelAgentCertificate}
          alt="Certificate of Registration of Travel Agent — Government of Himachal Pradesh"
          className="qp-certificate-img"
        />
      </section>
    </div>
  );
});

export default QuotePdfPreview;
