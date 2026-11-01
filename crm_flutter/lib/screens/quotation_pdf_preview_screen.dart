import 'package:flutter/material.dart';

import '../widgets/emb_widgets.dart';
import '../widgets/html_preview.dart';

/// Full-screen preview of the website-identical quotation HTML/PDF design.
/// Uses native WebView on mobile and an iframe on Flutter Web.
class QuotationPdfPreviewScreen extends StatefulWidget {
  const QuotationPdfPreviewScreen({
    super.key,
    required this.htmlFuture,
    this.title = 'Quotation PDF',
  });

  final Future<String> htmlFuture;
  final String title;

  @override
  State<QuotationPdfPreviewScreen> createState() => _QuotationPdfPreviewScreenState();
}

class _QuotationPdfPreviewScreenState extends State<QuotationPdfPreviewScreen> {
  bool _loading = true;
  String? _error;
  String? _html;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _html = null;
    });
    try {
      final html = await widget.htmlFuture;
      if (!mounted) return;
      setState(() {
        _html = html;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE8EEF5),
      appBar: embAppBar(widget.title),
      body: _loading
          ? const EmbLoading()
          : _error != null
              ? EmbErrorView(message: _error!, onRetry: _load)
              : HtmlPreview(
                  key: ValueKey(_html.hashCode),
                  html: _html!,
                  baseUrl: 'https://crm.exploremybharat.info/',
                  backgroundColor: const Color(0xFFE8EEF5),
                ),
    );
  }
}
