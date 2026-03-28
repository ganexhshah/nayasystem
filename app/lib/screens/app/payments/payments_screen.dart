import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  final List<Map<String, dynamic>> _rows = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadRows();
  }

  Future<void> _loadRows() async {
    setState(() => _loading = true);
    try {
      final rows = await AppApi.instance.list('/payments');
      if (!mounted) return;
      setState(() {
        _rows
          ..clear()
          ..addAll(
            rows.map((row) {
              final order = asMap(row['order']);
              final customer = asMap(row['customer']);
              return {
                'id': asInt(row['id']),
                'order': asString(
                  order['order_number'],
                  fallback: '#${asInt(row['order_id'])}',
                ),
                'customer': asString(customer['name'], fallback: 'Walk-in'),
                'amount': asDouble(row['amount']),
                'method': asString(row['method'], fallback: '-'),
                'date': asString(
                  row['paid_at'],
                  fallback: asString(row['created_at']),
                ),
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
            apiErrorMessage(error, fallback: 'Failed to load payments'),
          ),
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
        title: 'Payments',
        description: 'All payment transactions',
        rows: _rows,
        loading: _loading,
        searchKey: 'order',
        columns: [
          ColDef(key: 'order', label: 'Order'),
          ColDef(key: 'customer', label: 'Customer'),
          ColDef(
            key: 'amount',
            label: 'Amount',
            render: (r) => Text(
              'Rs. ${asDouble(r['amount']).toStringAsFixed(2)}',
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.foreground,
              ),
            ),
          ),
          ColDef(key: 'method', label: 'Method'),
          ColDef(
            key: 'status',
            label: 'Status',
            render: (r) => StatusBadge(
              active: asString(r['status']) == 'completed',
              trueLabel: 'Paid',
              falseLabel: asString(r['status'], fallback: 'pending'),
            ),
          ),
        ],
      ),
    );
  }
}

class DuePaymentsScreen extends StatefulWidget {
  const DuePaymentsScreen({super.key});

  @override
  State<DuePaymentsScreen> createState() => _DuePaymentsScreenState();
}

class _DuePaymentsScreenState extends State<DuePaymentsScreen> {
  final List<Map<String, dynamic>> _rows = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadRows();
  }

  Future<void> _loadRows() async {
    setState(() => _loading = true);
    try {
      final data = await ApiClient.instance.get('/due-payments');
      final rows = extractDataList(data);
      if (!mounted) return;
      setState(() {
        _rows
          ..clear()
          ..addAll(
            rows.map((row) {
              final customer = asMap(row['customer']);
              return {
                'id': asInt(row['id']),
                'order': asString(
                  row['order_number'],
                  fallback: '#${asInt(row['id'])}',
                ),
                'customer': asString(customer['name'], fallback: 'Walk-in'),
                'amount': asDouble(row['total']),
                'due_date': asString(row['created_at']).split('T').first,
                'status': asString(row['payment_status'], fallback: 'unpaid'),
              };
            }),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load due payments'),
          ),
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
        title: 'Due Payments',
        description: 'Pending and partial payments',
        rows: _rows,
        loading: _loading,
        searchKey: 'customer',
        columns: [
          ColDef(key: 'order', label: 'Order'),
          ColDef(key: 'customer', label: 'Customer'),
          ColDef(
            key: 'amount',
            label: 'Amount',
            render: (r) => Text(
              'Rs. ${asDouble(r['amount']).toStringAsFixed(2)}',
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: const Color(0xFFB45309),
              ),
            ),
          ),
          ColDef(key: 'due_date', label: 'Due Date'),
          ColDef(
            key: 'status',
            label: 'Status',
            render: (r) => StatusBadge(
              active: false,
              falseLabel: asString(r['status'], fallback: 'unpaid'),
            ),
          ),
        ],
      ),
    );
  }
}
