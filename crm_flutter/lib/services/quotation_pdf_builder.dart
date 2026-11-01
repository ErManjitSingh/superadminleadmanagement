import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_native_html_to_pdf/flutter_native_html_to_pdf.dart';
import 'package:intl/intl.dart';

import '../models/models.dart';
import 'quotation_web_html.dart';
import 'quotations_service.dart';

/// Builds a printable quotation PDF using the **same HTML/CSS design** as the
/// Explore My Bharat website (`QuotePdfPreview` + EMB styles).
class QuotationPdfData {
  QuotationPdfData({
    required this.packageName,
    required this.destination,
    required this.duration,
    required this.adults,
    required this.children,
    required this.mealPlan,
    required this.hotelCategory,
    required this.travelDate,
    required this.amount,
    required this.leadName,
    this.leadPhone = '',
    this.quoteNumber = '',
    this.notes = '',
    this.executiveName = 'Explore My Bharat',
    this.itinerary = const [],
    this.hotels = const [],
    this.cabs = const [],
  });

  final String packageName;
  final String destination;
  final int duration;
  final int adults;
  final int children;
  final String mealPlan;
  final String hotelCategory;
  final String travelDate;
  final num amount;
  final String leadName;
  final String leadPhone;
  final String quoteNumber;
  final String notes;
  final String executiveName;
  final List<QuoteDay> itinerary;
  final List<QuoteHotel> hotels;
  final List<QuoteCab> cabs;

  /// True only when at least one hotel is selected (not cab-only / no-hotel mode).
  bool get hasHotels {
    final meal = mealPlan.toLowerCase();
    final cat = hotelCategory.toLowerCase();
    if (meal.contains('no hotel') || meal.contains('cab only')) return false;
    if (cat.contains('no hotel') || cat.contains('cab only')) return false;
    return hotels.any((h) => h.name.trim().isNotEmpty);
  }

  factory QuotationPdfData.fromPayload({
    required QuotationSavePayload payload,
    required String leadName,
    String leadPhone = '',
    String quoteNumber = '',
    String executiveName = 'Explore My Bharat',
  }) {
    return QuotationPdfData(
      packageName: payload.packageName,
      destination: payload.destination.isEmpty ? payload.packageName : payload.destination,
      duration: payload.duration > 0 ? payload.duration : payload.itinerary.length,
      adults: payload.adults,
      children: payload.children,
      mealPlan: payload.mealPlan,
      hotelCategory: payload.hotelCategory,
      travelDate: payload.travelDate ?? '',
      amount: payload.amount,
      leadName: leadName,
      leadPhone: leadPhone,
      quoteNumber: quoteNumber,
      notes: payload.notes ?? '',
      executiveName: executiveName,
      itinerary: payload.itinerary,
      hotels: payload.hotels,
      cabs: payload.cabs,
    );
  }

  factory QuotationPdfData.fromDetail(QuotationDetail q, {String executiveName = 'Explore My Bharat'}) {
    return QuotationPdfData(
      packageName: q.packageName,
      destination: q.destination,
      duration: q.duration,
      adults: q.adults,
      children: q.children,
      mealPlan: q.mealPlan,
      hotelCategory: q.hotelCategory,
      travelDate: q.travelDate,
      amount: q.total,
      leadName: q.leadName,
      leadPhone: q.leadPhone,
      quoteNumber: q.quoteNumber,
      notes: q.notes,
      executiveName: executiveName,
      itinerary: [
        for (var i = 0; i < q.itinerary.length; i++)
          QuoteDay(
            day: int.tryParse('${q.itinerary[i]['day'] ?? i + 1}') ?? i + 1,
            title: '${q.itinerary[i]['title'] ?? q.itinerary[i]['name'] ?? 'Day ${i + 1}'}',
            description: '${q.itinerary[i]['description'] ?? q.itinerary[i]['activities'] ?? ''}',
          ),
      ],
      hotels: [
        for (final h in q.selectedHotels)
          QuoteHotel(
            name: '${h['name'] ?? h['hotelName'] ?? ''}',
            nights: int.tryParse('${h['nights'] ?? 1}') ?? 1,
            roomType: '${h['roomType'] ?? ''}',
            mealPlan: '${h['mealPlan'] ?? ''}',
          ),
      ],
      cabs: [
        for (final c in q.selectedCabs)
          QuoteCab(
            vehicleName: '${c['vehicleName'] ?? 'Vehicle'}',
            vehicleType: '${c['vehicleType'] ?? c['vehicleName'] ?? ''}',
            cost: num.tryParse('${c['cost'] ?? 0}') ?? 0,
            vehicleCount: int.tryParse('${c['vehicleCount'] ?? 1}') ?? 1,
          ),
      ],
    );
  }
}

final _htmlPdf = HtmlToPdfConverter();

/// Renders website-identical HTML then converts to PDF bytes (native WebView).
Future<Uint8List> buildQuotationPdfBytes(QuotationPdfData data) async {
  final html = await buildWebsiteQuotationHtml(data);
  final bytes = await _htmlPdf.convertHtmlToPdfBytes(html: html);
  if (bytes.isEmpty) throw Exception('PDF generation failed');
  return bytes;
}

/// HTML string for on-screen preview (same design as website PDF).
Future<String> buildQuotationPreviewHtml(QuotationPdfData data) => buildWebsiteQuotationHtml(data);

String quotationPdfBase64(Uint8List bytes) => base64Encode(bytes);

String buildQuotationWhatsAppMessage({
  required String leadName,
  required String packageName,
  required String destination,
  required int duration,
  required num total,
  String quoteNumber = '',
  String executiveName = 'Explore My Bharat',
}) {
  final money = NumberFormat.currency(locale: 'en_IN', symbol: 'Rs.', decimalDigits: 0);
  final lines = <String>[
    'Hello ${leadName.isEmpty ? 'Sir/Madam' : leadName},',
    '',
    'Greetings from $executiveName!',
    '',
    'Your quotation is ready for ${destination.isEmpty ? 'your trip' : destination}:',
    'Package: ${packageName.isEmpty ? 'travel package' : packageName}',
  ];
  if (duration > 0) lines.add('Duration: $duration Days');
  if (total > 0) lines.add('Total: ${money.format(total)}');
  if (quoteNumber.isNotEmpty && quoteNumber.toUpperCase() != 'DRAFT') {
    lines.add('Quote #: $quoteNumber');
  }
  lines.addAll(['', 'Please find the quotation PDF.', 'Thank you!']);
  return lines.join('\n');
}

String resolvePublicPdfUrl(String? pdfUrl, String apiBaseUrl) {
  if (pdfUrl == null || pdfUrl.trim().isEmpty) return '';
  final u = pdfUrl.trim();
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  final root = apiBaseUrl.replaceFirst(RegExp(r'/api/?$'), '');
  if (u.startsWith('/')) return '$root$u';
  return '$root/$u';
}
