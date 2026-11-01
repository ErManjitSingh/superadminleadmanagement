import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../services/operations_service.dart';
import '../widgets/emb_widgets.dart';
import '../widgets/html_preview.dart';

/// Native HTML preview of hotel / cab / client vouchers (same as CRM mobile preview).
class VoucherPreviewScreen extends StatefulWidget {
  const VoucherPreviewScreen({
    super.key,
    required this.voucherId,
    this.title = 'Voucher preview',
  });

  final String voucherId;
  final String title;

  @override
  State<VoucherPreviewScreen> createState() => _VoucherPreviewScreenState();
}

class _VoucherPreviewScreenState extends State<VoucherPreviewScreen> {
  bool loading = true;
  String? error;
  String? html;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final doc = await context.read<OperationsService>().fetchVoucherPreviewHtml(widget.voucherId);
      if (!mounted) return;
      setState(() {
        html = doc;
        loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = apiErrorMessage(e);
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE8EEF5),
      appBar: embAppBar(widget.title, actions: [
        IconButton(icon: const Icon(Icons.refresh), onPressed: loading ? null : _load),
      ]),
      body: loading
          ? const EmbLoading()
          : error != null
              ? EmbErrorView(message: error!, onRetry: _load)
              : HtmlPreview(
                  key: ValueKey(html.hashCode),
                  html: html!,
                  baseUrl: 'https://crm.exploremybharat.info/',
                  backgroundColor: const Color(0xFFE8EEF5),
                ),
    );
  }
}
