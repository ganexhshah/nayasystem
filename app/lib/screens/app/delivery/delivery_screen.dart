import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../app_shell.dart';

class DeliveryScreen extends StatefulWidget {
  const DeliveryScreen({super.key});

  @override
  State<DeliveryScreen> createState() => _DeliveryScreenState();
}

class _DeliveryScreenState extends State<DeliveryScreen> {
  String _statusFilter = 'all';
  String _search = '';
  bool _loading = false;
  final List<Map<String, dynamic>> _orders = [];

  static const _statusColors = {
    'pending': Color(0xFFDBEAFE),
    'confirmed': Color(0xFFEDE9FE),
    'preparing': Color(0xFFFEF3C7),
    'ready': Color(0xFFCCFBF1),
    'served': Color(0xFFDCFCE7),
    'completed': Color(0xFFD1FAE5),
    'cancelled': Color(0xFFFEE2E2),
  };

  static const _statusTextColors = {
    'pending': Color(0xFF1D4ED8),
    'confirmed': Color(0xFF7C3AED),
    'preparing': Color(0xFFB45309),
    'ready': Color(0xFF0F766E),
    'served': Color(0xFF15803D),
    'completed': Color(0xFF065F46),
    'cancelled': Color(0xFFB91C1C),
  };

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _loading = true);
    try {
      final rows = await AppApi.instance.list(
        '/orders',
        query: {'order_type': 'delivery'},
      );
      if (!mounted) return;
      setState(() {
        _orders
          ..clear()
          ..addAll(
            rows.map((row) {
              final customer = asMap(row['customer']);
              return {
                'id': asInt(row['id']),
                'order_number': asString(row['order_number']),
                'customer': asString(
                  customer['name'],
                  fallback: 'Guest Customer',
                ),
                'phone': asString(customer['phone']),
                'address': asString(row['delivery_address'], fallback: '-'),
                'items': (row['items'] is List)
                    ? (row['items'] as List).length
                    : 0,
                'total': asDouble(row['total']),
                'status': asString(row['status'], fallback: 'pending'),
              };
            }),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load delivery orders'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _filtered {
    return _orders.where((order) {
      final status = asString(order['status']);
      final searchText = _search.toLowerCase();
      final matchStatus = _statusFilter == 'all' || status == _statusFilter;
      final matchSearch =
          searchText.isEmpty ||
          asString(order['order_number']).toLowerCase().contains(searchText) ||
          asString(order['customer']).toLowerCase().contains(searchText);
      return matchStatus && matchSearch;
    }).toList();
  }

  Future<void> _advanceStatus(Map<String, dynamic> order) async {
    const flow = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'served',
      'completed',
    ];
    final current = asString(order['status']);
    final index = flow.indexOf(current);
    if (index < 0 || index >= flow.length - 1) return;

    try {
      await ApiClient.instance.post(
        '/orders/${order['id']}/status',
        body: {'status': flow[index + 1]},
      );
      await _loadOrders();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to update order status'),
          ),
        ),
      );
    }
  }

  Future<void> _cancelOrder(Map<String, dynamic> order) async {
    try {
      await ApiClient.instance.post(
        '/orders/${order['id']}/status',
        body: {'status': 'cancelled'},
      );
      await _loadOrders();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to cancel order'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _orders.length;
    final pending = _orders
        .where((o) => asString(o['status']) == 'pending')
        .length;
    final outForDelivery = _orders
        .where((o) => asString(o['status']) == 'served')
        .length;
    final completed = _orders
        .where((o) => asString(o['status']) == 'completed')
        .length;

    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Delivery',
                style: GoogleFonts.getFont(
                  'Google Sans',
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: AppColors.foreground,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.muted,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$total',
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 12,
                    color: AppColors.mutedFg,
                  ),
                ),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: _loadOrders,
                icon: const Icon(Icons.refresh, size: 14),
                label: Text(
                  'Refresh',
                  style: GoogleFonts.getFont('Google Sans', fontSize: 13),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.border),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _miniStat('Total', '$total', AppColors.foreground),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _miniStat(
                  'Pending',
                  '$pending',
                  const Color(0xFF1D4ED8),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _miniStat(
                  'Out',
                  '$outForDelivery',
                  const Color(0xFFB45309),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _miniStat('Done', '$completed', const Color(0xFF065F46)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            onChanged: (value) => setState(() => _search = value),
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 14,
              color: AppColors.foreground,
            ),
            decoration: InputDecoration(
              hintText: 'Search order, customer...',
              hintStyle: GoogleFonts.getFont(
                'Google Sans',
                color: AppColors.mutedFg,
                fontSize: 14,
              ),
              prefixIcon: const Icon(
                Icons.search,
                size: 18,
                color: AppColors.mutedFg,
              ),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 10,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: AppColors.ring, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children:
                  [
                        'all',
                        'pending',
                        'preparing',
                        'ready',
                        'served',
                        'completed',
                        'cancelled',
                      ]
                      .map(
                        (status) => Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: GestureDetector(
                            onTap: () => setState(() => _statusFilter = status),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: _statusFilter == status
                                    ? AppColors.primary
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: _statusFilter == status
                                      ? AppColors.primary
                                      : AppColors.border,
                                ),
                              ),
                              child: Text(
                                status == 'all' ? 'All' : status,
                                style: GoogleFonts.getFont(
                                  'Google Sans',
                                  fontSize: 12,
                                  color: _statusFilter == status
                                      ? Colors.white
                                      : AppColors.mutedFg,
                                ),
                              ),
                            ),
                          ),
                        ),
                      )
                      .toList(),
            ),
          ),
          const SizedBox(height: 16),
          if (_loading)
            const Center(
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.primary,
              ),
            )
          else if (_filtered.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Text(
                  'No delivery orders found.',
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 13,
                    color: AppColors.mutedFg,
                  ),
                ),
              ),
            )
          else
            ..._filtered.map(
              (order) => _DeliveryCard(
                order: order,
                statusColors: _statusColors,
                statusTextColors: _statusTextColors,
                onAdvance: () => _advanceStatus(order),
                onCancel: () => _cancelOrder(order),
              ),
            ),
        ],
      ),
    );
  }

  Widget _miniStat(String label, String value, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: AppColors.border),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.getFont(
            'Google Sans',
            fontSize: 11,
            color: AppColors.mutedFg,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.getFont(
            'Google Sans',
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    ),
  );
}

class _DeliveryCard extends StatelessWidget {
  final Map<String, dynamic> order;
  final Map<String, Color> statusColors;
  final Map<String, Color> statusTextColors;
  final VoidCallback onAdvance;
  final VoidCallback onCancel;

  const _DeliveryCard({
    required this.order,
    required this.statusColors,
    required this.statusTextColors,
    required this.onAdvance,
    required this.onCancel,
  });

  static const _flow = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'served',
    'completed',
  ];

  @override
  Widget build(BuildContext context) {
    final status = asString(order['status'], fallback: 'pending');
    final bgColor = statusColors[status] ?? AppColors.muted;
    final textColor = statusTextColors[status] ?? AppColors.mutedFg;
    final isDone = status == 'cancelled' || status == 'completed';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  asString(order['order_number']),
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.foreground,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status,
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: textColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${asString(order['customer'])} · ${asString(order['phone'], fallback: '-')}',
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 12,
                color: AppColors.mutedFg,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              asString(order['address'], fallback: '-'),
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 12,
                color: AppColors.foreground,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  '${asInt(order['items'])} item(s)',
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 12,
                    color: AppColors.mutedFg,
                  ),
                ),
                const Spacer(),
                Text(
                  'Rs. ${asDouble(order['total']).toStringAsFixed(2)}',
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.foreground,
                  ),
                ),
              ],
            ),
            if (!isDone) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _flow.contains(status) && status != _flow.last
                          ? onAdvance
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Text(
                        'Advance',
                        style: GoogleFonts.getFont(
                          'Google Sans',
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: onCancel,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFFFECACA)),
                      foregroundColor: AppColors.destructive,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      'Cancel',
                      style: GoogleFonts.getFont('Google Sans', fontSize: 12),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
