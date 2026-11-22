
import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'config.dart';

class StudentDashboard extends StatefulWidget {
  const StudentDashboard({super.key});

  @override
  State<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> {
  String token = '';
  String userId = '';
  String userName = 'Student';

  List<dynamic> services = [];
  List<dynamic> activeTokens = [];
  List<dynamic> history = [];

  bool isLoading = true;
  String errorMessage = '';

    io.Socket? socket;
  @override
  void initState() {
    super.initState();
    initializeDashboard();
  }

  Future<void> initializeDashboard() async {
    final prefs = await SharedPreferences.getInstance();

    token = prefs.getString('token') ?? '';
    userId = prefs.getString('userId') ?? '';
    userName = prefs.getString('userName') ?? 'Student';

    if (token.isEmpty || userId.isEmpty) {
      if (mounted) {
        setState(() {
          isLoading = false;
          errorMessage = 'Please log in again.';
        });
      }
      return;
    }

    await loadDashboard();
    connectSocket();
  }

  Map<String, String> get headers => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

  Future<void> loadDashboard() async {
    try {
      final responses = await Future.wait([
        http.get(
          Uri.parse('$apiBaseUrl/services'),
          headers: headers,
        ),
        http.get(
          Uri.parse('$apiBaseUrl/queue/my-tokens'),
          headers: headers,
        ),
        http.get(
          Uri.parse('$apiBaseUrl/queue/my-history'),
          headers: headers,
        ),
      ]);

      final serviceData = jsonDecode(responses[0].body);
      final activeData = jsonDecode(responses[1].body);
      final historyData = jsonDecode(responses[2].body);

      if (responses.any((response) => response.statusCode != 200)) {
        throw Exception('Unable to load dashboard information.');
      }

      if (!mounted) return;

      setState(() {
        services = serviceData['services'] ?? [];
        activeTokens = activeData['tokens'] ?? [];
        history = historyData['tokens'] ?? [];
        isLoading = false;
        errorMessage = '';
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        isLoading = false;
        errorMessage = 'Unable to connect. Please try again.';
      });
    }
  }

  void connectSocket() {
    socket = io.io(
      socketBaseUrl,
      <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
      },
    );

    socket!.onConnect((_) {
      socket!.emit('join-student-room', userId);
    });

    socket!.on('queue-updated', (data) {
      loadDashboard();
    });

    socket!.onConnectError((error) {
      debugPrint('Socket connection error: $error');
    });

    socket!.connect();
  }

  Future<void> joinQueue(String serviceId) async {
    try {
      final response = await http.post(
        Uri.parse('$apiBaseUrl/queue/join'),
        headers: headers,
        body: jsonEncode({'serviceId': serviceId}),
      );

      final data = jsonDecode(response.body);

      if (!mounted) return;

      if (response.statusCode == 201 && data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Token #${data['token']['tokenNumber']} generated successfully!',
            ),
            backgroundColor: Colors.green,
          ),
        );

        await loadDashboard();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? 'Unable to join queue'),
            backgroundColor: Colors.red,
          ),
        );

        await loadDashboard();
      }
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Server connection failed')),
      );
    }
  }

  Future<void> logout() async {
    socket?.disconnect();
    socket?.dispose();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('userId');
    await prefs.remove('userName');
    await prefs.remove('userRole');

    if (!mounted) return;

    Navigator.pushNamedAndRemoveUntil(
      context,
      '/',
      (route) => false,
    );
  }

  Color statusColor(String status) {
    switch (status) {
      case 'waiting':
        return Colors.orange;
      case 'called':
        return Colors.blue;
      case 'serving':
        return Colors.green;
      case 'completed':
        return Colors.teal;
      case 'skipped':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget buildTokenCard(dynamic item, {bool showCounter = true}) {
    final service = item['service'];
    final counter = item['counter'];

    final serviceName = service is Map
        ? service['name'] ?? 'Campus Service'
        : 'Campus Service';

    final counterName = counter is Map
        ? counter['name'] ?? 'Not assigned'
        : 'Not assigned';

    final status = item['status'] ?? 'waiting';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.confirmation_number,
                  color: Colors.indigo,
                  size: 28,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Token #${item['tokenNumber'] ?? '-'}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Chip(
                  label: Text(
                    status.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                    ),
                  ),
                  backgroundColor: statusColor(status),
                ),
              ],
            ),
            const Divider(),
            Text('Service: $serviceName'),
            if (showCounter) Text('Counter: $counterName'),
            if (item['estimatedWaitTime'] != null)
              Text('Estimated wait: ${item['estimatedWaitTime']} minutes'),
          ],
        ),
      ),
    );
  }

  Widget buildServices() {
    if (services.isEmpty) {
      return const Center(child: Text('No services available'));
    }

    return Column(
      children: services.map((service) {
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: const CircleAvatar(
              backgroundColor: Color(0xFFE8EAF6),
              child: Icon(Icons.business, color: Colors.indigo),
            ),
            title: Text(
              service['name'] ?? 'Service',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              'Average time: ${service['averageServiceTime'] ?? 5} minutes',
            ),
            trailing: ElevatedButton(
              onPressed: () => joinQueue(service['_id'].toString()),
              child: const Text('Join'),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget buildHistory() {
    if (history.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('No token history available'),
        ),
      );
    }

    return Column(
      children: history.map((item) {
        return buildTokenCard(item);
      }).toList(),
    );
  }

  @override
  void dispose() {
    socket?.disconnect();
    socket?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      appBar: AppBar(
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
        title: const Text('Campus Smart Queue'),
        actions: [
          IconButton(
            onPressed: loadDashboard,
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
          ),
          IconButton(
            onPressed: logout,
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMessage.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(errorMessage),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: initializeDashboard,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: loadDashboard,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        'Welcome, $userName!',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.indigo,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text('Manage your campus queues easily.'),
                      const SizedBox(height: 22),

                      const Text(
                        'My Active Tokens',
                        style: TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 10),

                      if (activeTokens.isEmpty)
                        const Card(
                          child: Padding(
                            padding: EdgeInsets.all(18),
                            child: Text('You have no active tokens.'),
                          ),
                        )
                      else
                        ...activeTokens.map(
                          (item) => buildTokenCard(item),
                        ),

                      const SizedBox(height: 20),
                      const Text(
                        'Available Services',
                        style: TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 10),

                      buildServices(),

                      const SizedBox(height: 20),
                      const Text(
                        'Token History',
                        style: TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 10),

                      buildHistory(),
                    ],
                  ),
                ),
    );
  }
}
