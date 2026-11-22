
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'config.dart';
import 'login_screen.dart';

class StaffDashboard extends StatefulWidget {
  const StaffDashboard({super.key});

  @override
  State<StaffDashboard> createState() => _StaffDashboardState();
}

class _StaffDashboardState extends State<StaffDashboard> {
  String token = '';
  String staffName = 'Staff';

  List<dynamic> counters = [];
  List<dynamic> queueTokens = [];

  String? selectedCounterId;
  Map<String, dynamic>? counterDetails;

  bool isLoading = true;
  bool isWorking = false;

  io.Socket? socket;

  Map<String, String> get headers => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    final prefs = await SharedPreferences.getInstance();

    token = prefs.getString('token') ?? '';
    staffName = prefs.getString('userName') ?? 'Staff';

    if (token.isEmpty) {
      if (mounted) _logout();
      return;
    }

    await _loadCounters();
  }

  Future<void> _loadCounters() async {
    try {
      final response = await http.get(
        Uri.parse('$apiBaseUrl/counters/my-counters'),
        headers: headers,
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        counters = data['counters'] ?? [];

        if (counters.isNotEmpty) {
          selectedCounterId =
              counters.first['_id']?.toString() ??
              counters.first['id']?.toString();

          await _loadQueue();
          _connectSocket();
        }
      } else {
        _showMessage(data['message'] ?? 'Could not load counters');
      }
    } catch (e) {
      _showMessage('Unable to connect to the server');
    }

    if (mounted) {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _loadQueue() async {
    if (selectedCounterId == null) return;

    try {
      final response = await http.get(
        Uri.parse(
          '$apiBaseUrl/queue/counter?counterId=$selectedCounterId',
        ),
        headers: headers,
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        if (!mounted) return;

        setState(() {
          counterDetails = data['counter'];
          queueTokens = data['tokens'] ?? [];
        });
      } else {
        _showMessage(data['message'] ?? 'Could not load queue');
      }
    } catch (e) {
      _showMessage('Unable to load queue');
    }
  }

  void _connectSocket() {
    socket?.disconnect();
    socket?.dispose();

    if (selectedCounterId == null) return;

    socket = io.io(
      socketBaseUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .disableAutoConnect()
          .build(),
    );

    socket!.onConnect((_) {
      socket!.emit('join-counter-room', selectedCounterId);
    });

    socket!.on('queue-updated', (data) {
      _loadQueue();
    });

    socket!.connect();
  }

  Future<void> _callNext() async {
    if (selectedCounterId == null || isWorking) return;

    setState(() => isWorking = true);

    try {
      final response = await http.post(
        Uri.parse('$apiBaseUrl/queue/call-next'),
        headers: headers,
        body: jsonEncode({
          'counterId': selectedCounterId,
        }),
      );

      final data = jsonDecode(response.body);

      _showMessage(data['message'] ?? 'Request completed');
      await _loadQueue();
    } catch (e) {
      _showMessage('Could not call the next token');
    }

    if (mounted) setState(() => isWorking = false);
  }

  Future<void> _updateTokenStatus(
    String tokenId,
    String status,
  ) async {
    if (isWorking) return;

    setState(() => isWorking = true);

    try {
      final response = await http.put(
        Uri.parse('$apiBaseUrl/queue/$tokenId/status'),
        headers: headers,
        body: jsonEncode({'status': status}),
      );

      final data = jsonDecode(response.body);

      _showMessage(data['message'] ?? 'Token updated');
      await _loadQueue();
    } catch (e) {
      _showMessage('Could not update token');
    }

    if (mounted) setState(() => isWorking = false);
  }

  Future<void> _toggleCounterStatus() async {
    if (selectedCounterId == null || isWorking) return;

    final currentStatus =
        counterDetails?['status']?.toString() ?? 'active';

    final newStatus =
        currentStatus == 'active' ? 'paused' : 'active';

    setState(() => isWorking = true);

    try {
      final response = await http.put(
        Uri.parse('$apiBaseUrl/counters/my-counters/status'),
        headers: headers,
        body: jsonEncode({
          'counterId': selectedCounterId,
          'status': newStatus,
        }),
      );

      final data = jsonDecode(response.body);

      _showMessage(data['message'] ?? 'Counter status updated');
      await _loadQueue();
    } catch (e) {
      _showMessage('Could not change counter status');
    }

    if (mounted) setState(() => isWorking = false);
  }

  void _showMessage(String message) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _logout() async {
    socket?.disconnect();
    socket?.dispose();

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    if (!mounted) return;

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(
        builder: (_) => const LoginScreen(),
      ),
      (route) => false,
    );
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'called':
        return Colors.orange;
      case 'serving':
        return Colors.blue;
      case 'completed':
        return Colors.green;
      case 'skipped':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  void dispose() {
    socket?.disconnect();
    socket?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final counterStatus =
        counterDetails?['status']?.toString() ?? 'active';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Staff Dashboard'),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : counters.isEmpty
              ? const Center(
                  child: Text('No counters assigned to your account.'),
                )
              : RefreshIndicator(
                  onRefresh: _loadQueue,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        'Welcome, $staffName!',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),

                      const Text(
                        'Select Counter',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),

                      DropdownButtonFormField<String>(
                        initialValue: selectedCounterId,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                        ),
                        items: counters.map((counter) {
                          final id =
                              counter['_id']?.toString() ??
                              counter['id']?.toString() ?? '';

                          return DropdownMenuItem<String>(
                            value: id,
                            child: Text(
                              counter['name']?.toString() ?? 'Counter',
                            ),
                          );
                        }).toList(),
                        onChanged: (value) async {
                          if (value == null) return;

                          setState(() {
                            selectedCounterId = value;
                            counterDetails = null;
                            queueTokens = [];
                          });

                          await _loadQueue();
                          _connectSocket();
                        },
                      ),

                      const SizedBox(height: 16),

                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                counterDetails?['name']?.toString() ??
                                    'Selected Counter',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Text('Status: '),
                                  Chip(
                                    label: Text(counterStatus.toUpperCase()),
                                    backgroundColor:
                                        counterStatus == 'active'
                                            ? Colors.green.shade100
                                            : Colors.orange.shade100,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Current Token: ${counterDetails?['currentToken'] ?? 0}',
                              ),
                              const SizedBox(height: 12),
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton(
                                  onPressed: isWorking
                                      ? null
                                      : _toggleCounterStatus,
                                  child: Text(
                                    counterStatus == 'active'
                                        ? 'Pause Counter'
                                        : 'Resume Counter',
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton.icon(
                          onPressed: isWorking ? null : _callNext,
                          icon: const Icon(Icons.campaign),
                          label: const Text('CALL NEXT TOKEN'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.indigo,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      Text(
                        'Queue (${queueTokens.length})',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 8),

                      if (queueTokens.isEmpty)
                        const Card(
                          child: Padding(
                            padding: EdgeInsets.all(20),
                            child: Center(
                              child: Text('No active tokens in this queue.'),
                            ),
                          ),
                        ),

                      ...queueTokens.map((item) {
                        final tokenId =
                            item['_id']?.toString() ?? '';
                        final tokenNumber =
                            item['tokenNumber']?.toString() ?? '-';
                        final status =
                            item['status']?.toString() ?? 'waiting';

                        final student = item['student'];
                        final studentName = student is Map
                            ? student['name']?.toString() ?? 'Student'
                            : 'Student';

                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Token #$tokenNumber',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Chip(
                                      label: Text(status.toUpperCase()),
                                      backgroundColor:
                                          _statusColor(status).withValues(
                                        alpha: 0.15,
                                      ),
                                    ),
                                  ],
                                ),
                                Text('Student: $studentName'),
                                const SizedBox(height: 10),

                                if (status == 'called')
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      onPressed: isWorking
                                          ? null
                                          : () => _updateTokenStatus(
                                                tokenId,
                                                'serving',
                                              ),
                                      child: const Text('START SERVING'),
                                    ),
                                  ),

                                if (status == 'serving')
                                  Row(
                                    children: [
                                      Expanded(
                                        child: ElevatedButton(
                                          onPressed: isWorking
                                              ? null
                                              : () => _updateTokenStatus(
                                                    tokenId,
                                                    'completed',
                                                  ),
                                          child: const Text('COMPLETE'),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: OutlinedButton(
                                          onPressed: isWorking
                                              ? null
                                              : () => _updateTokenStatus(
                                                    tokenId,
                                                    'skipped',
                                                  ),
                                          child: const Text('SKIP'),
                                        ),
                                      ),
                                    ],
                                  ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
    );
  }
}
