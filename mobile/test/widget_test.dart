
import 'package:flutter_test/flutter_test.dart';
import 'package:campus_smart_queue/main.dart';

void main() {
  testWidgets('Campus Smart Queue app loads', (WidgetTester tester) async {
    await tester.pumpWidget(const CampusQueueApp());

    expect(find.text('Campus Smart Queue'), findsOneWidget);
    expect(find.text('LOGIN'), findsOneWidget);
  });
}
