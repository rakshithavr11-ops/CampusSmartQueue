
import 'package:flutter/material.dart';
import 'login_screen.dart';

void main() {
  runApp(const CampusQueueApp());
}

class CampusQueueApp extends StatelessWidget {
  const CampusQueueApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Campus Smart Queue',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.indigo,
        ),
        useMaterial3: true,
      ),
      home: const LoginScreen(),
    );
  }
}
