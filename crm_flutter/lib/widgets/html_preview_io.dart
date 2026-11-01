import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Android / iOS: native WebView HTML preview.
class HtmlPreview extends StatefulWidget {
  const HtmlPreview({
    super.key,
    required this.html,
    this.baseUrl,
    this.backgroundColor,
  });

  final String html;
  final String? baseUrl;
  final Color? backgroundColor;

  @override
  State<HtmlPreview> createState() => _HtmlPreviewState();
}

class _HtmlPreviewState extends State<HtmlPreview> {
  late final WebViewController _controller;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(widget.backgroundColor ?? const Color(0xFFE8EEF5));
    _load();
  }

  @override
  void didUpdateWidget(covariant HtmlPreview oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.html != widget.html) _load();
  }

  Future<void> _load() async {
    await _controller.loadHtmlString(
      widget.html,
      baseUrl: widget.baseUrl ?? 'https://crm.exploremybharat.info/',
    );
    if (mounted) setState(() => _ready = true);
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return const Center(child: CircularProgressIndicator());
    }
    return WebViewWidget(controller: _controller);
  }
}
