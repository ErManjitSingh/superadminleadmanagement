import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../services/service_utils.dart';
import '../services/whatsapp_service.dart';
import '../widgets/common_widgets.dart' show formatDate;
import '../widgets/emb_widgets.dart';
import '../widgets/module_widgets.dart';
import 'lead_detail_screen.dart';

/// WhatsApp leads: conversations list -> in-app chat thread.
class WhatsappLeadsScreen extends StatelessWidget {
  const WhatsappLeadsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final svc = context.read<WhatsappService>();
    return ModuleListScreen(
      title: 'WhatsApp Leads',
      searchHint: 'Search conversations',
      emptyMessage: 'No WhatsApp conversations',
      emptyIcon: Icons.chat_outlined,
      load: (_, search) => svc.fetchConversations(search: search),
      itemBuilder: (context, c, reload) {
        final lead = asMap(c['lead']);
        final last = asMap(c['lastMessage']);
        final unread = pickNum(c, ['unreadCount']).toInt();
        final leadId = (c['leadId'] ?? lead['_id'] ?? '').toString();
        final name = pickStr(lead, ['name']) ?? 'Lead';
        return EmbCard(
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => WhatsappChatScreen(leadId: leadId, name: name)),
            );
            reload();
          },
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: const Color(0xFFE3F7EA),
                child: const Icon(Icons.chat, color: Color(0xFF25D366), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: embBody(size: 15, weight: FontWeight.w700)),
                    Text(
                      pickStr(last, ['text']) ?? pickStr(lead, ['phone']) ?? 'No messages yet',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: embBody(size: 13, color: EmbTheme.inkSoft),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(formatDate(pickStr(last, ['timestamp'])).split(',').first,
                      style: embBody(size: 11, color: EmbTheme.muted)),
                  if (unread > 0)
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(color: EmbTheme.teal, borderRadius: BorderRadius.circular(999)),
                      child: Text('$unread', style: embBody(size: 11, weight: FontWeight.w700, color: Colors.white)),
                    ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class WhatsappChatScreen extends StatefulWidget {
  const WhatsappChatScreen({super.key, required this.leadId, required this.name});
  final String leadId;
  final String name;

  @override
  State<WhatsappChatScreen> createState() => _WhatsappChatScreenState();
}

class _WhatsappChatScreenState extends State<WhatsappChatScreen> {
  final _ctrl = TextEditingController();
  bool _loading = true;
  bool _sending = false;
  String? _error;
  List<Json> _messages = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = _messages.isEmpty;
      _error = null;
    });
    try {
      final svc = context.read<WhatsappService>();
      final m = await svc.fetchMessages(widget.leadId);
      svc.markRead(widget.leadId).catchError((_) {});
      if (!mounted) return;
      setState(() {
        _messages = m;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = apiErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    setState(() => _sending = true);
    try {
      await context.read<WhatsappService>().sendMessage(leadId: widget.leadId, text: text);
      _ctrl.clear();
      await _load();
    } catch (e) {
      if (mounted) embSnack(context, apiErrorMessage(e), error: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EmbTheme.cream,
      appBar: embAppBar(widget.name, actions: [
        IconButton(
          icon: const Icon(Icons.person_outline),
          tooltip: 'Open lead',
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: widget.leadId)),
          ),
        ),
      ]),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const EmbLoading()
                : _error != null
                    ? EmbErrorView(message: _error!, onRetry: _load)
                    : RefreshIndicator(
                        color: EmbTheme.teal,
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _messages.length,
                          itemBuilder: (_, i) {
                            final m = _messages[i];
                            final out = m['direction'] == 'outgoing';
                            return Align(
                              alignment: out ? Alignment.centerRight : Alignment.centerLeft,
                              child: Container(
                                constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.75),
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: out ? EmbTheme.tealSoft : EmbTheme.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: EmbTheme.border),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(pickStr(m, ['text']) ?? '[${pickStr(m, ['type']) ?? 'message'}]',
                                        style: embBody(size: 14)),
                                    const SizedBox(height: 2),
                                    Text(formatDate(pickStr(m, ['timestamp'])),
                                        style: embBody(size: 10, color: EmbTheme.muted)),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 6, 12, 8),
              child: Row(
                children: [
                  Expanded(child: TextField(controller: _ctrl, decoration: embInput('Message'))),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    style: IconButton.styleFrom(backgroundColor: EmbTheme.teal),
                    onPressed: _sending ? null : _send,
                    icon: _sending
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
