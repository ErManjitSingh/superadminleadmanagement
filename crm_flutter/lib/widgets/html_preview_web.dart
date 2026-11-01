// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

/// Flutter Web: render HTML in an iframe (webview_flutter has no web impl).
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
  late final String _viewType;

  @override
  void initState() {
    super.initState();
    _viewType = 'emb-html-preview-${identityHashCode(this)}-${DateTime.now().microsecondsSinceEpoch}';
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (int viewId) {
      final iframe = html.IFrameElement()
        ..style.border = 'none'
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.backgroundColor = '#E8EEF5'
        ..srcdoc = widget.html;
      return iframe;
    });
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _viewType);
  }
}
