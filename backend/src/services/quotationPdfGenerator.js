const pdfService = require('./pdfService');
const { COLORS } = pdfService;

function formatINR(amount) {
  const n = Number(amount || 0);
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function asList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => (typeof v === 'string' ? v : v?.name || v?.title || String(v))).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/\n|•|;/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function resolvePackage(quotation) {
  const snap = quotation?.packageSnapshot && typeof quotation.packageSnapshot === 'object' ? quotation.packageSnapshot : {};
  const pop = quotation?.package && typeof quotation.package === 'object' ? quotation.package : {};
  return { ...pop, ...snap };
}

function resolveHotels(quotation) {
  const selected = Array.isArray(quotation?.selectedHotels) ? quotation.selectedHotels : [];
  if (selected.length) {
    return selected.map((h) => ({
      name: h.name || h.hotelName || h.hotel?.name || 'Hotel',
      roomType: h.roomType || h.room?.name || '',
      city: h.city || h.location || '',
      meals: h.meals || h.mealPlan || '',
      nights: h.nights || h.nightCount || '',
    }));
  }
  const pkg = resolvePackage(quotation);
  return (pkg.hotels || []).map((h) => ({
    name: h.name || 'Hotel',
    roomType: h.roomType || '',
    city: h.city || '',
    meals: h.meals || '',
    nights: h.nights || '',
  }));
}

function resolveTransport(quotation) {
  const cabs = Array.isArray(quotation?.selectedCabs) ? quotation.selectedCabs : [];
  if (cabs.length) {
    return cabs.map((c) => ({
      name: c.name || c.vehicleName || c.vehicleType || 'Transport',
      type: c.type || c.category || '',
      seats: c.seats || c.capacity || '',
    }));
  }
  const pkg = resolvePackage(quotation);
  return (pkg.vehicles || []).map((v) => ({
    name: v.name || v.vehicleType || 'Transport',
    type: v.type || v.category || '',
    seats: v.seats || '',
  }));
}

function resolveItinerary(quotation) {
  const pkg = resolvePackage(quotation);
  const itinerary = pkg.itinerary || quotation?.packageInfo?.itinerary || [];
  return (itinerary || []).map((day, index) => ({
    day: day.day || day.dayNumber || index + 1,
    title: day.title || day.name || `Day ${index + 1}`,
    description: day.description || day.activities || day.sightseeing || '',
    hotel: day.hotel || day.accommodation || '',
    meals: day.meals || day.mealPlan || '',
    transport: day.transport || '',
  }));
}

function buildContentHashPayload(quotation, company = {}) {
  return JSON.stringify({
    quoteNumber: quotation.quoteNumber,
    packageInfo: quotation.packageInfo,
    packageSnapshot: quotation.packageSnapshot,
    pricing: quotation.pricing,
    costing: quotation.costing,
    selectedHotels: quotation.selectedHotels,
    selectedCabs: quotation.selectedCabs,
    selectedFlights: quotation.selectedFlights,
    selectedActivities: quotation.selectedActivities,
    paymentPlan: quotation.paymentPlan,
    importantNotes: quotation.importantNotes,
    customizations: quotation.customizations,
    companyName: company.name,
    companyLogo: company.logo || company.whiteLabel?.quotationLogoUrl,
    companyPhone: company.phone,
    companyEmail: company.email,
  });
}

/**
 * Generate a premium travel-brochure PDF buffer for a quotation.
 */
async function generateQuotationPdfBuffer({ quotation, lead = {}, company = {} }) {
  const pkg = resolvePackage(quotation);
  const packageInfo = quotation.packageInfo || {};
  const packageName =
    packageInfo.packageName || pkg.name || pkg.shortName || 'Travel Package';
  const destination =
    packageInfo.destination || pkg.destination || pkg.routing || lead.destination || '—';
  const duration = packageInfo.duration || pkg.duration || 0;
  const travelDate = packageInfo.travelDate || lead.travelDate;
  const nights = duration > 0 ? Math.max(0, duration - 1) : 0;
  const hotels = resolveHotels(quotation);
  const transport = resolveTransport(quotation);
  const itinerary = resolveItinerary(quotation);
  const inclusions = asList(pkg.inclusions);
  const exclusions = asList(pkg.exclusions);
  const notes = quotation.importantNotes || {};
  const terms = asList(notes.termsAndConditions || notes.cancellationPolicy);
  const total = quotation.pricing?.total || quotation.costing?.grandTotal || 0;
  const companyName = company.name || 'Travel Company';
  const companyPhone = company.phone || company.tenantSettings?.supportPhone || '';
  const companyEmail = company.email || company.tenantSettings?.supportEmail || '';
  const companyAddress = company.address || '';

  return pdfService.renderToBuffer(
    (doc, colors) => {
      pdfService.drawHeaderBar(doc, colors);

      // Cover / brand header
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor(colors.primary)
        .text(companyName, { align: 'left' });
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(colors.muted)
        .text('Premium Travel Quotation', { align: 'left' });
      doc.moveDown(0.8);

      // Quote meta strip
      const metaY = doc.y;
      const metaWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      doc.save();
      doc.roundedRect(doc.page.margins.left, metaY, metaWidth, 54, 10).fill(colors.softGold);
      doc.restore();
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(colors.accent)
        .text(`Quotation ${quotation.quoteNumber || ''}`, doc.page.margins.left + 14, metaY + 12);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(colors.primary)
        .text(`Prepared for ${lead.name || 'Valued Guest'}`, doc.page.margins.left + 14, metaY + 30);
      doc.y = metaY + 66;

      // Package hero
      doc
        .font('Helvetica-Bold')
        .fontSize(18)
        .fillColor(colors.primary)
        .text(packageName);
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(colors.gold)
        .text(destination);
      doc.moveDown(0.6);

      pdfService.keyValueRow(doc, 'Customer', lead.name || '—', colors);
      pdfService.keyValueRow(doc, 'Destination', destination, colors);
      pdfService.keyValueRow(doc, 'Travel Date', formatDate(travelDate), colors);
      pdfService.keyValueRow(
        doc,
        'Duration',
        duration ? `${duration} Days / ${nights} Nights` : '—',
        colors
      );
      pdfService.keyValueRow(
        doc,
        'Travelers',
        [
          packageInfo.adults != null ? `${packageInfo.adults} Adults` : null,
          packageInfo.children ? `${packageInfo.children} Children` : null,
          packageInfo.infants ? `${packageInfo.infants} Infants` : null,
        ]
          .filter(Boolean)
          .join(', ') || '—',
        colors
      );
      doc.moveDown(0.5);

      // Total cost highlight
      pdfService.ensureSpace(doc, 70);
      const totalY = doc.y;
      doc.save();
      doc.roundedRect(doc.page.margins.left, totalY, metaWidth, 56, 10).fill(colors.primary);
      doc.restore();
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(colors.white)
        .text('TOTAL PACKAGE COST', doc.page.margins.left + 16, totalY + 12);
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor(colors.gold)
        .text(formatINR(total), doc.page.margins.left + 16, totalY + 26);
      doc.y = totalY + 70;

      // Itinerary
      if (itinerary.length) {
        pdfService.sectionTitle(doc, 'Itinerary', colors);
        itinerary.forEach((day) => {
          pdfService.card(doc, {
            title: `Day ${day.day} — ${day.title}`,
            lines: [
              day.description,
              day.hotel ? `Stay: ${day.hotel}` : '',
              day.meals ? `Meals: ${day.meals}` : '',
              day.transport ? `Transport: ${day.transport}` : '',
            ],
            colors,
          });
        });
      }

      // Hotels
      if (hotels.length) {
        pdfService.sectionTitle(doc, 'Hotels', colors);
        hotels.forEach((hotel) => {
          pdfService.card(doc, {
            title: hotel.name,
            lines: [
              [hotel.roomType, hotel.city].filter(Boolean).join(' · '),
              [hotel.meals, hotel.nights ? `${hotel.nights} night(s)` : ''].filter(Boolean).join(' · '),
            ],
            colors,
          });
        });
      }

      // Transport
      if (transport.length) {
        pdfService.sectionTitle(doc, 'Transport', colors);
        transport.forEach((item) => {
          pdfService.card(doc, {
            title: item.name,
            lines: [[item.type, item.seats ? `${item.seats} seats` : ''].filter(Boolean).join(' · ')],
            colors,
          });
        });
      }

      // Inclusions / Exclusions
      if (inclusions.length) {
        pdfService.sectionTitle(doc, 'Inclusions', colors);
        pdfService.bulletList(doc, inclusions, colors);
        doc.moveDown(0.4);
      }
      if (exclusions.length) {
        pdfService.sectionTitle(doc, 'Exclusions', colors);
        pdfService.bulletList(doc, exclusions, colors);
        doc.moveDown(0.4);
      }

      // Notes / Terms
      const noteBlocks = [
        { title: 'Cancellation Policy', value: notes.cancellationPolicy },
        { title: 'Terms & Conditions', value: notes.termsAndConditions },
        { title: 'Travel Guidelines', value: notes.travelGuidelines },
      ].filter((b) => b.value);

      if (noteBlocks.length || terms.length || quotation.customizations) {
        pdfService.sectionTitle(doc, 'Terms & Notes', colors);
        noteBlocks.forEach((block) => {
          pdfService.ensureSpace(doc, 30);
          doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .fillColor(colors.primary)
            .text(block.title);
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor(colors.muted)
            .text(String(block.value));
          doc.moveDown(0.4);
        });
        if (quotation.customizations) {
          doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .fillColor(colors.primary)
            .text('Special Notes');
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor(colors.muted)
            .text(String(quotation.customizations));
          doc.moveDown(0.4);
        }
        if (terms.length && !noteBlocks.length) {
          pdfService.bulletList(doc, terms, colors);
        }
      }

      // Payment plan
      if (Array.isArray(quotation.paymentPlan) && quotation.paymentPlan.length) {
        pdfService.sectionTitle(doc, 'Payment Plan', colors);
        quotation.paymentPlan.forEach((row) => {
          pdfService.keyValueRow(
            doc,
            row.label || 'Installment',
            `${row.percent ? `${row.percent}% · ` : ''}${formatINR(row.amount)}`,
            colors
          );
        });
      }

      // Company contact
      pdfService.sectionTitle(doc, 'Contact Us', colors);
      pdfService.keyValueRow(doc, 'Company', companyName, colors);
      if (companyPhone) pdfService.keyValueRow(doc, 'Phone', companyPhone, colors);
      if (companyEmail) pdfService.keyValueRow(doc, 'Email', companyEmail, colors);
      if (companyAddress) pdfService.keyValueRow(doc, 'Address', companyAddress, colors);

      doc.moveDown(1);
      doc
        .font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor(colors.muted)
        .text('Thank you for choosing us. We look forward to crafting your perfect journey.', {
          align: 'center',
        });

      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i += 1) {
        doc.switchToPage(i);
        pdfService.drawFooter(doc, {
          leftText: companyName,
          rightText: `Page ${i + 1} of ${pages.count} · ${quotation.quoteNumber || ''}`,
          colors,
        });
      }
    },
    {
      title: `Quotation ${quotation.quoteNumber || ''}`,
      author: companyName,
      bufferPages: true,
    }
  );
}

module.exports = {
  generateQuotationPdfBuffer,
  buildContentHashPayload,
  formatINR,
  formatDate,
};
