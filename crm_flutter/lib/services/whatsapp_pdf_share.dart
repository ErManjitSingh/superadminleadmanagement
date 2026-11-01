import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

/// Normalize to WhatsApp digits (India 10-digit → 91…).
String normalizeWhatsAppPhone(String? phone) {
  var digits = (phone ?? '').replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return '';
  while (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  if (digits.length == 10) digits = '91$digits';
  return digits;
}

/// Opens WhatsApp with optional PDF (same intent as website share).
///
/// 1) Share sheet with PDF (user picks WhatsApp → PDF attaches)
/// 2) If cancelled/fails → open WhatsApp chat via app / wa.me with message
Future<bool> openWhatsAppWithPdf({
  String? waMeUrl,
  String? pdfBase64,
  String fileName = 'document.pdf',
  String? message,
  String? phone,
}) async {
  final text = (message ?? '').trim();
  final normalizedPhone = normalizeWhatsAppPhone(phone);
  File? pdfFile;

  if (pdfBase64 != null && pdfBase64.isNotEmpty) {
    try {
      final bytes = base64Decode(pdfBase64);
      if (bytes.isNotEmpty) {
        final dir = await getTemporaryDirectory();
        final safeName = fileName.trim().isEmpty ? 'document.pdf' : fileName.trim();
        pdfFile = File('${dir.path}/$safeName');
        await pdfFile.writeAsBytes(bytes, flush: true);
      }
    } catch (_) {
      pdfFile = null;
    }
  }

  if (pdfFile != null) {
    try {
      final result = await SharePlus.instance.share(
        ShareParams(
          files: [XFile(pdfFile.path, mimeType: 'application/pdf', name: fileName)],
          text: text.isEmpty ? null : text,
          subject: fileName,
        ),
      );
      if (result.status == ShareResultStatus.success) return true;
      // dismissed / unavailable → fall through and open WhatsApp chat
    } catch (_) {
      // fall through
    }
  }

  return _openWhatsAppChat(waMeUrl: waMeUrl, phone: normalizedPhone, message: text);
}

Future<bool> _openWhatsAppChat({
  String? waMeUrl,
  required String phone,
  String message = '',
}) async {
  if (waMeUrl != null && waMeUrl.trim().isNotEmpty) {
    final u = Uri.tryParse(waMeUrl.trim());
    if (u != null && await canLaunchUrl(u)) {
      return launchUrl(u, mode: LaunchMode.externalApplication);
    }
  }

  final digits = normalizeWhatsAppPhone(phone);
  if (digits.isEmpty && message.isEmpty) return false;

  // 1) Native WhatsApp scheme (opens app directly)
  if (digits.isNotEmpty) {
    final appParams = <String, String>{'phone': digits};
    if (message.isNotEmpty) appParams['text'] = message;
    final appUri = Uri(scheme: 'whatsapp', host: 'send', queryParameters: appParams);
    try {
      if (await canLaunchUrl(appUri)) {
        final ok = await launchUrl(appUri, mode: LaunchMode.externalApplication);
        if (ok) return true;
      }
    } catch (_) {}
  }

  // 2) https://wa.me fallback
  final Uri webUri;
  if (digits.isEmpty) {
    webUri = Uri.parse('https://wa.me/?text=${Uri.encodeComponent(message)}');
  } else if (message.isEmpty) {
    webUri = Uri.parse('https://wa.me/$digits');
  } else {
    webUri = Uri.parse('https://wa.me/$digits?text=${Uri.encodeComponent(message)}');
  }
  return launchUrl(webUri, mode: LaunchMode.externalApplication);
}
