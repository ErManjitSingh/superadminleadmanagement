const branding = require('../config/branding');
const { sendMailMessage, isEmailConfigured } = require('./emailService');
const { readReceiptPdfBuffer } = require('./paymentReceiptPdfService');
const { fmtINR } = require('./paymentReceiptPdfService');
const { logLeadActivity } = require('./leadActivityService');

function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
}

function getReceiptBuffer(payment) {
  if (payment.receiptPdfPath) return readReceiptPdfBuffer(payment.receiptPdfPath);
  return null;
}

async function sendPaymentReceiptEmail(payment, booking, actor) {
  const recipient = booking.customerEmail;
  if (!recipient) return { sent: false, reason: 'no_email' };
  if (!isEmailConfigured()) return { sent: false, reason: 'smtp_not_configured' };

  const buffer = getReceiptBuffer(payment);
  if (!buffer) return { sent: false, reason: 'no_pdf' };

  const remaining = Math.max(0, (booking.totalAmount || 0) - (booking.totalPaid || booking.advanceReceived || 0));
  const supportEmail = branding.supportEmail || branding.contactEmail || '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">${branding.brandName}</h1>
        <p style="color:#e0e7ff;margin:8px 0 0;">Payment Receipt</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;">
        <p>Hello <strong>${booking.customerName}</strong>,</p>
        <p>Thank you for your payment. Your receipt is attached.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#64748b;">Booking ID</td><td style="padding:8px 0;font-weight:bold;">${booking.bookingNumber}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Destination</td><td style="padding:8px 0;">${booking.destination}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Amount Received</td><td style="padding:8px 0;font-weight:bold;color:#059669;">${fmtINR(payment.amount)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Remaining Balance</td><td style="padding:8px 0;font-weight:bold;color:#d97706;">${fmtINR(remaining)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Payment Mode</td><td style="padding:8px 0;">${payment.mode}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Receipt Number</td><td style="padding:8px 0;">${payment.receiptNumber}</td></tr>
        </table>
        ${supportEmail ? `<p style="color:#64748b;font-size:13px;">Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>` : ''}
        <p style="margin-top:24px;">Regards,<br/><strong>${branding.brandName}</strong></p>
      </div>
    </div>
  `;

  await sendMailMessage({
    to: recipient,
    subject: `Payment Receipt — ${booking.bookingNumber} — ${fmtINR(payment.amount)}`,
    html,
    attachments: [{
      filename: payment.receiptFileName || `${payment.receiptNumber}.pdf`,
      content: buffer.toString('base64'),
      encoding: 'base64',
      contentType: 'application/pdf',
    }],
  });

  if (booking.lead) {
    await logLeadActivity({
      leadId: booking.lead,
      branchId: booking.branchId,
      type: 'email_sent',
      description: `Payment receipt email sent — ${payment.receiptNumber}`,
      actor,
      meta: { paymentId: payment._id, receiptNumber: payment.receiptNumber },
    });
  }

  return { sent: true };
}

async function sendPaymentReceiptWhatsApp(payment, booking, actor) {
  const phone = normalizePhone(booking.customerPhone);
  if (!phone) return { sent: false, prepared: false, reason: 'no_phone' };

  const buffer = getReceiptBuffer(payment);
  if (!buffer) return { sent: false, prepared: false, reason: 'no_pdf' };

  const remaining = Math.max(0, (booking.totalAmount || 0) - (booking.totalPaid || booking.advanceReceived || 0));

  const message = [
    `Hello ${booking.customerName}`,
    '',
    'Thank you for your payment.',
    '',
    `Amount Received:\n₹${Number(payment.amount).toLocaleString('en-IN')}`,
    '',
    `Booking ID:\n${booking.bookingNumber}`,
    '',
    `Remaining Balance:\n₹${remaining.toLocaleString('en-IN')}`,
    '',
    'Your payment receipt has been attached.',
    '',
    `Regards,\n${branding.brandName}`,
  ].join('\n');

  const waMeUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  if (booking.lead) {
    await logLeadActivity({
      leadId: booking.lead,
      branchId: booking.branchId,
      type: 'whatsapp_sent',
      description: `Payment receipt prepared for WhatsApp — ${payment.receiptNumber}`,
      actor,
      meta: {
        paymentId: payment._id,
        receiptNumber: payment.receiptNumber,
        waMeUrl,
        pdfBase64: buffer.toString('base64'),
      },
    });
  }

  return {
    sent: false,
    prepared: true,
    waMeUrl,
    pdfBase64: buffer.toString('base64'),
    fileName: payment.receiptFileName || `${payment.receiptNumber}.pdf`,
    message,
  };
}

module.exports = {
  sendPaymentReceiptEmail,
  sendPaymentReceiptWhatsApp,
  normalizePhone,
};
