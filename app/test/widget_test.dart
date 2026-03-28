import 'package:flutter_test/flutter_test.dart';

import 'package:naya_system/main.dart';

void main() {
  testWidgets('App boots', (WidgetTester tester) async {
    await tester.pumpWidget(const NayaSystemApp());
    expect(find.byType(NayaSystemApp), findsOneWidget);
  });
}
