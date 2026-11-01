import '../models/models.dart';
import '../providers/auth_provider.dart';
import 'quotation_pdf_builder.dart';
import 'quotations_service.dart';
import 'whatsapp_pdf_share.dart';

/// Generate PDF + open WhatsApp share for a saved quotation (list / detail / builder).
Future<({bool ok, String message})> sendQuotationWhatsApp({
  required QuotationsService svc,
  required String role,
  required QuotationDetail quote,
  String? executiveName,
}) async {
  final phone = quote.leadPhone.trim();
  if (phone.isEmpty) {
    return (ok: false, message: 'Customer phone missing on lead');
  }

  final brand = (executiveName != null && executiveName.trim().isNotEmpty)
      ? executiveName.trim()
      : 'Explore My Bharat';

  final pdfData = QuotationPdfData.fromDetail(quote, executiveName: brand);
  final bytes = await buildQuotationPdfBytes(pdfData);
  try {
    await svc.uploadQuotationPdf(role, quote.id, bytes);
  } catch (_) {}

  if (role == 'sales_executive' && quote.status == 'approved') {
    try {
      await svc.quotationAction(role, quote.id, action: 'send');
    } catch (_) {}
  }

  final message = buildQuotationWhatsAppMessage(
    leadName: quote.leadName,
    packageName: quote.packageName,
    destination: quote.destination,
    duration: quote.duration,
    total: quote.total,
    quoteNumber: quote.quoteNumber,
    executiveName: brand,
  );
  final fileName =
      'Quotation-${quote.quoteNumber.isEmpty ? 'No' : quote.quoteNumber}.pdf'
          .replaceAll(RegExp(r'[^\w.-]+'), '_');

  final ok = await openWhatsAppWithPdf(
    pdfBase64: quotationPdfBase64(bytes),
    fileName: fileName,
    message: message,
    phone: phone,
  );

  return (
    ok: ok,
    message: ok
        ? 'WhatsApp share ready — PDF attach karke Send karein'
        : 'Could not open WhatsApp',
  );
}

String executiveNameFromAuth(AuthProvider auth) {
  final user = auth.user;
  final n = user?.name.trim();
  return (n != null && n.isNotEmpty) ? n : 'Explore My Bharat';
}
