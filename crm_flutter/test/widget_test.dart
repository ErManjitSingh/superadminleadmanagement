import 'package:flutter_test/flutter_test.dart';
import 'package:crm_flutter/main.dart';

void main() {
  testWidgets('CRM app boots', (WidgetTester tester) async {
    await tester.pumpWidget(const CrmApp());
    await tester.pump();
    expect(find.byType(CrmApp), findsOneWidget);
  });
}
