import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class OrdersListScreen extends StatefulWidget {
  const OrdersListScreen({super.key});

  @override
  State<OrdersListScreen> createState() => _OrdersListScreenState();
}

class _OrdersListScreenState extends State<OrdersListScreen> {
  String _statusFilter = 'all';
  bool _loading = false;
  final List<Map<String, dynamic>> _orders = [];

  static const _statusBg = {
    'pending': Color(0xFFDBEAFE),
    'confirmed': Color(0xFFEDE9FE),
    'preparing': Color(0xFFFEF3C7),
    'ready': Color(0xFFCCFBF1),
    'served': Color(0xFFDCFCE7),
    'completed': Color(0xFFD1FAE5),
    'cancelled': Color(0xFFFEE2E2),
  };

  static const _statusFg = {
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
      final rows = await AppApi.instance.list('/orders');
      if (!mounted) return;
      setState(() {
        _orders
          ..clear()
          ..addAll(
            rows.map((row) {
              final table = asMap(row['table']);
              final customer = asMap(row['customer']);
              final items = row['items'] is List
                  ? row['items'] as List
                  : const [];
              return {
                'id': asInt(row['id']),
                'order_number': asString(
                  row['order_number'],
                  fallback: '#${asInt(row['id'])}',
                ),
                'table': asString(table['name']),
                'customer': asString(customer['name'], fallback: 'Walk-in'),
                'items': items.length,
                'total': asDouble(row['total']),
                'status': asString(row['status'], fallback: 'pending'),
                'payment_status': asString(
                  row['payment_status'],
                  fallback: 'unpaid',
                ),
                'type': asString(row['order_type'], fallback: 'dine_in'),
              };
            }),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load orders'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _filtered => _statusFilter == 'all'
      ? _orders
      : _orders.where((o) => asString(o['status']) == _statusFilter).toList();

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Orders',
                style: GoogleFonts.getFont(
                  'Google Sans',
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: AppColors.foreground,
                ),
              ),
              const Spacer(),
              Text(
                '${_orders.length} total',
                style: GoogleFonts.getFont(
                  'Google Sans',
                  fontSize: 13,
                  color: AppColors.mutedFg,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children:
                  [
                        'all',
                        'pending',
                        'preparing',
                        'ready',
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
                padding: const EdgeInsets.all(24),
                child: Text(
                  'No orders found.',
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
              (order) => _OrderRow(
                order: order,
                statusBg: _statusBg,
                statusFg: _statusFg,
              ),
            ),
        ],
      ),
    );
  }
}

class _OrderRow extends StatelessWidget {
  final Map<String, dynamic> order;
  final Map<String, Color> statusBg;
  final Map<String, Color> statusFg;

  const _OrderRow({
    required this.order,
    required this.statusBg,
    required this.statusFg,
  });

  @override
  Widget build(BuildContext context) {
    final status = asString(order['status'], fallback: 'pending');
    final total = asDouble(order['total']).toStringAsFixed(2);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
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
                        fontWeight: FontWeight.w600,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (asString(order['table']).isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.muted,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          asString(order['table']),
                          style: GoogleFonts.getFont(
                            'Google Sans',
                            fontSize: 11,
                            color: AppColors.mutedFg,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${asString(order['customer'])} · ${asInt(order['items'])} items · Rs. $total',
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 12,
                    color: AppColors.mutedFg,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: statusBg[status] ?? AppColors.muted,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              status,
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: statusFg[status] ?? AppColors.mutedFg,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class OrdersKotScreen extends StatefulWidget {
  const OrdersKotScreen({super.key});

  @override
  State<OrdersKotScreen> createState() => _OrdersKotScreenState();
}

class _OrdersKotScreenState extends State<OrdersKotScreen> {
  final List<Map<String, dynamic>> _kots = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadKots();
  }

  Future<void> _loadKots() async {
    setState(() => _loading = true);
    try {
      final rows = await AppApi.instance.list('/kots');
      if (!mounted) return;
      setState(() {
        _kots
          ..clear()
          ..addAll(
            rows.map((row) {
              final order = asMap(row['order']);
              final table = asMap(order['table']);
              return {
                'id': asInt(row['id']),
                'kot_number': asString(row['kot_number']),
                'status': asString(row['status'], fallback: 'pending'),
                'table': asString(table['name'], fallback: '-'),
                'order_number': asString(order['order_number'], fallback: '-'),
              };
            }),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(apiErrorMessage(error, fallback: 'Failed to load KOT')),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'KOT',
        description: 'Kitchen Order Tickets',
        rows: _kots,
        loading: _loading,
        searchKey: 'kot_number',
        columns: [
          ColDef(key: 'kot_number', label: 'KOT Number'),
          ColDef(key: 'order_number', label: 'Order'),
          ColDef(key: 'table', label: 'Table'),
          ColDef(
            key: 'status',
            label: 'Status',
            render: (r) => StatusBadge(
              active: asString(r['status']) == 'ready',
              trueLabel: 'Ready',
              falseLabel: asString(r['status'], fallback: 'pending'),
            ),
          ),
        ],
      ),
    );
  }
}

class WaiterRequestsScreen extends StatefulWidget {
  const WaiterRequestsScreen({super.key});

  @override
  State<WaiterRequestsScreen> createState() => _WaiterRequestsScreenState();
}

class _WaiterRequestsScreenState extends State<WaiterRequestsScreen> {
  final List<Map<String, dynamic>> _rows = [];
  List<MapEntry<String, String>> _tableOptions = const [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final tables = await AppApi.instance.list('/tables');
      final requests = await AppApi.instance.list('/waiter-requests');

      if (!mounted) return;

      setState(() {
        _tableOptions = tables
            .map(
              (t) => MapEntry(
                asInt(t['id']).toString(),
                asString(t['name'], fallback: 'Table'),
              ),
            )
            .toList();

        _rows
          ..clear()
          ..addAll(
            requests.map((r) {
              final table = asMap(r['table']);
              return {
                'id': asInt(r['id']),
                'table_id': asInt(r['table_id']),
                'table': asString(table['name'], fallback: '-'),
                'request': asString(r['type'], fallback: 'waiter'),
                'notes': asString(r['notes']),
                'status': asString(r['status'], fallback: 'pending'),
              };
            }),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load waiter requests'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showForm([Map<String, dynamic>? editing]) {
    showDialog(
      context: context,
      builder: (_) => AppFormDialog(
        title: editing != null ? 'Update Request' : 'New Request',
        initialValues: editing != null
            ? {...editing, 'table_id': asInt(editing['table_id']).toString()}
            : null,
        fields: [
          AppFormField(
            key: 'table_id',
            label: 'Table',
            type: AppFormFieldType.select,
            options: _tableOptions,
          ),
          AppFormField(
            key: 'request',
            label: 'Type',
            type: AppFormFieldType.select,
            options: const [
              MapEntry('waiter', 'Waiter'),
              MapEntry('bill', 'Bill'),
              MapEntry('water', 'Water'),
              MapEntry('other', 'Other'),
            ],
          ),
          const AppFormField(
            key: 'notes',
            label: 'Notes',
            type: AppFormFieldType.textarea,
          ),
          AppFormField(
            key: 'status',
            label: 'Status',
            type: AppFormFieldType.select,
            options: const [
              MapEntry('pending', 'Pending'),
              MapEntry('acknowledged', 'Acknowledged'),
              MapEntry('completed', 'Completed'),
            ],
          ),
        ],
        onSubmit: (values) => _save(values, editing: editing),
      ),
    );
  }

  Future<void> _save(
    Map<String, dynamic> values, {
    Map<String, dynamic>? editing,
  }) async {
    try {
      final tableId = int.tryParse(values['table_id']?.toString() ?? '') ?? 0;
      if (editing == null) {
        await AppApi.instance.create('/waiter-requests', {
          'table_id': tableId,
          'type': asString(values['request'], fallback: 'waiter'),
          'notes': values['notes']?.toString().trim().isEmpty == true
              ? null
              : values['notes']?.toString().trim(),
        });
      } else {
        final status = asString(values['status'], fallback: 'pending');
        await ApiClient.instance.post(
          '/waiter-requests/${editing['id']}/status',
          body: {'status': status},
        );
      }
      await _loadData();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to save waiter request'),
          ),
        ),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/waiter-requests/${row['id']}');
      await _loadData();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete waiter request'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Waiter Requests',
        description: 'Customer requests from tables',
        rows: _rows,
        loading: _loading,
        searchKey: 'request',
        onAdd: _showForm,
        onEdit: (row) => _showForm(row),
        onDelete: _delete,
        columns: [
          ColDef(key: 'table', label: 'Table'),
          ColDef(key: 'request', label: 'Request'),
          ColDef(key: 'notes', label: 'Notes'),
          ColDef(
            key: 'status',
            label: 'Status',
            render: (r) => StatusBadge(
              active: asString(r['status']) == 'completed',
              trueLabel: 'Completed',
              falseLabel: asString(r['status'], fallback: 'pending'),
            ),
          ),
        ],
      ),
    );
  }
}

class ReservationsScreen extends StatefulWidget {
  const ReservationsScreen({super.key});

  @override
  State<ReservationsScreen> createState() => _ReservationsScreenState();
}

class _ReservationsScreenState extends State<ReservationsScreen> {
  final List<Map<String, dynamic>> _rows = [];
  List<MapEntry<String, String>> _tableOptions = const [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final tables = await AppApi.instance.list('/tables');
      final reservations = await AppApi.instance.list('/reservations');

      if (!mounted) return;

      setState(() {
        _tableOptions = tables
            .map(
              (t) => MapEntry(
                asInt(t['id']).toString(),
                asString(t['name'], fallback: 'Table'),
              ),
            )
            .toList();

        _rows
          ..clear()
          ..addAll(
            reservations.map((r) {
              final reservedAt = _formatDateTime(asString(r['reserved_at']));
              return {
                'id': asInt(r['id']),
                'guest_name': asString(r['guest_name']),
                'guest_phone': asString(r['guest_phone']),
                'table_id': asInt(r['table_id']),
                'party_size': asInt(r['party_size']),
                'reserved_at': reservedAt,
                'status': asString(r['status'], fallback: 'pending'),
              };
            }),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load reservations'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showForm([Map<String, dynamic>? editing]) {
    showDialog(
      context: context,
      builder: (_) => AppFormDialog(
        title: editing != null ? 'Edit Reservation' : 'Add Reservation',
        initialValues: editing != null
            ? {
                ...editing,
                'table_id': asInt(editing['table_id']).toString(),
                'party_size': asInt(editing['party_size']).toString(),
              }
            : null,
        fields: [
          const AppFormField(
            key: 'guest_name',
            label: 'Guest Name',
            hint: 'Full name',
            required: true,
          ),
          const AppFormField(
            key: 'guest_phone',
            label: 'Phone',
            hint: '000-000-0000',
            required: true,
          ),
          const AppFormField(
            key: 'party_size',
            label: 'Guests',
            hint: '2',
            type: AppFormFieldType.number,
          ),
          AppFormField(
            key: 'table_id',
            label: 'Table',
            type: AppFormFieldType.select,
            options: _tableOptions,
          ),
          const AppFormField(
            key: 'reserved_at',
            label: 'Reserved At',
            hint: 'YYYY-MM-DD HH:mm',
            required: true,
          ),
          AppFormField(
            key: 'status',
            label: 'Status',
            type: AppFormFieldType.select,
            options: const [
              MapEntry('pending', 'Pending'),
              MapEntry('confirmed', 'Confirmed'),
              MapEntry('cancelled', 'Cancelled'),
            ],
          ),
        ],
        onSubmit: (values) => _save(values, editing: editing),
      ),
    );
  }

  Future<void> _save(
    Map<String, dynamic> values, {
    Map<String, dynamic>? editing,
  }) async {
    try {
      final payload = {
        'guest_name': values['guest_name']?.toString().trim(),
        'guest_phone': values['guest_phone']?.toString().trim(),
        'party_size':
            int.tryParse(values['party_size']?.toString() ?? '1') ?? 1,
        'table_id': int.tryParse(values['table_id']?.toString() ?? ''),
        'reserved_at': values['reserved_at']?.toString().trim(),
      };

      if (editing == null) {
        await AppApi.instance.create('/reservations', payload);
      } else {
        await AppApi.instance.update(
          '/reservations/${editing['id']}',
          payload,
          patch: true,
        );
        if ((values['status']?.toString() ?? '').isNotEmpty) {
          await ApiClient.instance.post(
            '/reservations/${editing['id']}/status',
            body: {'status': values['status']?.toString()},
          );
        }
      }

      await _loadData();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to save reservation'),
          ),
        ),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/reservations/${row['id']}');
      await _loadData();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete reservation'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Reservations',
        description: 'Manage table reservations',
        rows: _rows,
        loading: _loading,
        searchKey: 'guest_name',
        onAdd: _showForm,
        onEdit: (row) => _showForm(row),
        onDelete: _delete,
        columns: [
          ColDef(key: 'guest_name', label: 'Guest'),
          ColDef(key: 'reserved_at', label: 'Reserved At'),
          ColDef(key: 'party_size', label: 'Guests'),
          ColDef(
            key: 'status',
            label: 'Status',
            render: (r) => StatusBadge(
              active: asString(r['status']) == 'confirmed',
              trueLabel: 'Confirmed',
              falseLabel: asString(r['status'], fallback: 'pending'),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(String value) {
    if (value.isEmpty) return '';
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    final local = parsed.toLocal();
    final month = local.month.toString().padLeft(2, '0');
    final day = local.day.toString().padLeft(2, '0');
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '${local.year}-$month-$day $hour:$minute';
  }
}
