import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crm_flutter/models/models.dart';
import 'package:crm_flutter/screens/lead_detail/lead_detail_sections.dart';
import 'package:crm_flutter/screens/lead_detail/lead_detail_utils.dart';

void main() {
  testWidgets('lead 360 sections render without overflow', (tester) async {
    tester.view.physicalSize = const Size(390 * 3, 844 * 3);
    tester.view.devicePixelRatio = 3;
    final lead = Lead.fromJson({
      '_id': 'abc123456789',
      'name': 'Rahul Sharma',
      'phone': '9876543210',
      'email': 'rahul@example.com',
      'destination': 'Manali, Himachal',
      'status': 'converted',
      'isHot': true,
      'budget': 55000,
      'pickup': 'Delhi',
      'drop': 'Manali',
      'adults': 2,
      'children': 1,
      'temperature': 'hot',
      'smartScore': 78,
      'assignedTo': {'_id': 'u1', 'name': 'Priya Verma'},
      'createdAt': '2026-09-01T10:00:00Z',
    });
    final scores = computeLeadScores(lead);
    final fu = [FollowUp(id: '1', scheduledAt: '2026-12-01T10:00:00Z', status: 'pending', type: 'call')];
    final q = [Quotation(id: 'q1', quoteNumber: 'Q-1', status: 'sent', total: 45000, packageName: 'Manali 5N', createdAt: '2026-09-02T10:00:00Z')];
    final acts = buildActivities(lead: lead, timeline: [], followups: fu, quotations: q);
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: ListView(padding: const EdgeInsets.all(14), children: [
          LdHeader(lead: lead, scores: scores),
          LdPipeline(status: lead.status),
          const LdConvertedBanner(loading: false, booking: {'bookingNumber': 'BK-1', 'advanceReceived': 10000, 'remainingBalance': 35000, 'travelDate': '2026-12-10'}),
          LdContactActions(hasPhone: true, hasEmail: true, onCall: () {}, onWhatsApp: () {}, onEmail: () {}, onQuote: () {}, onFollowUp: () {}, onStatus: () {}),
          LdCustomerOverview(lead: lead),
          LdTravelInfo(lead: lead),
          LdTimeline(activities: acts, loading: false),
          LdQuickActions(onCallNote: () {}, onAssign: () {}, onEdit: () {}, onConvert: () {}, onStatus: () {}, onReactivate: () {}),
          LdNotes(notes: const [{'message': 'hi', 'user': 'A', 'date': '2026-09-01T10:00:00Z'}], legacyNote: null, loading: false, onAdd: (_) async {}),
          LdFollowups(followups: fu, nextFollowUp: null, loading: false, onSchedule: () {}),
          LdTags(tags: deriveLeadTags(lead)),
          LdQuotations(quotations: q, loading: false, onOpen: (_) {}, onCreate: () {}),
          LdScoreBreakdown(lead: lead, scores: scores),
          const LdEmailHistory(rows: [{'direction': 'outbound', 'subject': 'Hello', 'to': ['a@b.com'], 'status': 'sent', 'sentAt': '2026-09-01T10:00:00Z'}], loading: false),
          const LdTransferHistory(rows: [{'type': 'assign', 'fromUserId': null, 'toUserId': {'name': 'Priya'}, 'createdAt': '2026-09-01T10:00:00Z'}], loading: false),
          const LdAudit(rows: [{'action': 'lead.update', 'changes': [{'field': 'status', 'oldValue': 'new', 'newValue': 'contacted'}], 'createdAt': '2026-09-01T10:00:00Z'}], loading: false),
        ]),
      ),
    ));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    addTearDown(tester.view.reset);
  });
}
