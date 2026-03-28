import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

typedef _RowMapper = Map<String, dynamic> Function(Map<String, dynamic> raw);
typedef _SummaryBuilder =
    List<Map<String, String>> Function(
      dynamic payload,
      List<Map<String, dynamic>> rows,
    );

class _ReportListScreen extends StatefulWidget {
  final String title;
  final String description;
  final String endpoint;
  final List<ColDef> columns;
  final String searchKey;
  final _RowMapper rowMapper;
  final _SummaryBuilder? summaryBuilder;

  const _ReportListScreen({
    required this.title,
    required this.description,
    required this.endpoint,
    required this.columns,
    required this.searchKey,
    required this.rowMapper,
    this.summaryBuilder,
  });

  @override
  State<_ReportListScreen> createState() => _ReportListScreenState();
}

class _ReportListScreenState extends State<_ReportListScreen> {
  final List<Map<String, dynamic>> _rows = [];
  List<Map<String, String>> _summary = const [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final payload = await ApiClient.instance.get(widget.endpoint);
      final sourceRows = extractDataList(payload);
      final mapped = sourceRows.map(widget.rowMapper).toList();
      final summary =
          widget.summaryBuilder?.call(payload, mapped) ??
          const <Map<String, String>>[];

      if (!mounted) return;
      setState(() {
        _rows
          ..clear()
          ..addAll(mapped);
        _summary = summary;
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load report'),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_summary.isNotEmpty) ...[
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _summary
                  .map(
                    (card) => Container(
                      width: 160,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            card['label'] ?? '',
                            style: GoogleFonts.getFont(
                              'Google Sans',
                              fontSize: 11,
                              color: AppColors.mutedFg,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            card['value'] ?? '-',
                            style: GoogleFonts.getFont(
                              'Google Sans',
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppColors.foreground,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 20),
          ],
          AppListScreen(
            title: widget.title,
            description: widget.description,
            rows: _rows,
            loading: _loading,
            searchKey: widget.searchKey,
            columns: widget.columns,
          ),
        ],
      ),
    );
  }
}

class SalesReportScreen extends StatelessWidget {
  const SalesReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ReportListScreen(
      title: 'Sales Report',
      description: 'Daily sales overview',
      endpoint: '/reports/sales',
      searchKey: 'date',
      rowMapper: (raw) => {
        'date': asString(raw['date']),
        'orders': asInt(raw['orders']),
        'subtotal': asDouble(raw['subtotal']).toStringAsFixed(2),
        'tax': asDouble(raw['tax']).toStringAsFixed(2),
        'total': asDouble(raw['total']).toStringAsFixed(2),
      },
      summaryBuilder: (_, rows) {
        final totalSales = rows.fold<double>(
          0,
          (sum, row) => sum + (double.tryParse('${row['total']}') ?? 0),
        );
        final totalOrders = rows.fold<int>(
          0,
          (sum, row) => sum + (int.tryParse('${row['orders']}') ?? 0),
        );
        final avg = totalOrders == 0 ? 0.0 : totalSales / totalOrders;
        return [
          {
            'label': 'Total Sales',
            'value': 'Rs. ${totalSales.toStringAsFixed(2)}',
          },
          {'label': 'Orders', 'value': '$totalOrders'},
          {'label': 'Avg Order', 'value': 'Rs. ${avg.toStringAsFixed(2)}'},
        ];
      },
      columns: const [
        ColDef(key: 'date', label: 'Date'),
        ColDef(key: 'orders', label: 'Orders'),
        ColDef(key: 'subtotal', label: 'Subtotal'),
        ColDef(key: 'tax', label: 'Tax'),
        ColDef(key: 'total', label: 'Total'),
      ],
    );
  }
}

class ItemReportScreen extends StatelessWidget {
  const ItemReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ReportListScreen(
      title: 'Item Report',
      description: 'Top selling menu items',
      endpoint: '/reports/items',
      searchKey: 'name',
      rowMapper: (raw) => {
        'name': asString(raw['name']),
        'quantity': asInt(raw['quantity']),
        'total': asDouble(raw['total']).toStringAsFixed(2),
      },
      columns: const [
        ColDef(key: 'name', label: 'Item'),
        ColDef(key: 'quantity', label: 'Qty Sold'),
        ColDef(key: 'total', label: 'Revenue'),
      ],
    );
  }
}

class CategoryReportScreen extends StatelessWidget {
  const CategoryReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ReportListScreen(
      title: 'Category Report',
      description: 'Sales by menu category',
      endpoint: '/reports/categories',
      searchKey: 'category',
      rowMapper: (raw) => {
        'category': asString(raw['category']),
        'quantity': asInt(raw['quantity']),
        'total': asDouble(raw['total']).toStringAsFixed(2),
      },
      columns: const [
        ColDef(key: 'category', label: 'Category'),
        ColDef(key: 'quantity', label: 'Qty Sold'),
        ColDef(key: 'total', label: 'Revenue'),
      ],
    );
  }
}

class TaxReportScreen extends StatefulWidget {
  const TaxReportScreen({super.key});

  @override
  State<TaxReportScreen> createState() => _TaxReportScreenState();
}

class _TaxReportScreenState extends State<TaxReportScreen> {
  bool _loading = false;
  Map<String, dynamic> _tax = const {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final payload = asMap(await ApiClient.instance.get('/reports/tax'));
      if (!mounted) return;
      setState(() => _tax = payload);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load tax report'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalTax = asDouble(_tax['total_tax']);
    final totalSales = asDouble(_tax['total_sales']);

    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Tax Report',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Tax collected for selected period',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
            ),
          ),
          const SizedBox(height: 20),
          if (_loading)
            const CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.primary,
            )
          else
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _summaryCard('Total Tax', 'Rs. ${totalTax.toStringAsFixed(2)}'),
                _summaryCard(
                  'Total Sales',
                  'Rs. ${totalSales.toStringAsFixed(2)}',
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _summaryCard(String label, String value) {
    return Container(
      width: 180,
      padding: const EdgeInsets.all(14),
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
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.foreground,
            ),
          ),
        ],
      ),
    );
  }
}

class ExpensesReportScreen extends StatelessWidget {
  const ExpensesReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ReportListScreen(
      title: 'Expenses Report',
      description: 'Expense entries by date',
      endpoint: '/reports/expenses',
      searchKey: 'title',
      rowMapper: (raw) => {
        'date': asString(raw['date']),
        'title': asString(raw['title']),
        'category': asString(asMap(raw['category'])['name']),
        'amount': asDouble(raw['amount']).toStringAsFixed(2),
      },
      columns: const [
        ColDef(key: 'date', label: 'Date'),
        ColDef(key: 'title', label: 'Title'),
        ColDef(key: 'category', label: 'Category'),
        ColDef(key: 'amount', label: 'Amount'),
      ],
    );
  }
}

class PaymentsReportScreen extends StatelessWidget {
  const PaymentsReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ReportListScreen(
      title: 'Payments Report',
      description: 'Payments grouped by method',
      endpoint: '/reports/payments',
      searchKey: 'method',
      rowMapper: (raw) => {
        'method': asString(raw['method']),
        'count': asInt(raw['count']).toString(),
        'total': asDouble(raw['total']).toStringAsFixed(2),
      },
      columns: const [
        ColDef(key: 'method', label: 'Method'),
        ColDef(key: 'count', label: 'Count'),
        ColDef(key: 'total', label: 'Total'),
      ],
    );
  }
}

class DuePaymentsReportScreen extends StatelessWidget {
  const DuePaymentsReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ReportListScreen(
      title: 'Due Payments Report',
      description: 'Unpaid completed orders',
      endpoint: '/reports/due-payments',
      searchKey: 'order_number',
      rowMapper: (raw) => {
        'order_number': asString(raw['order_number']),
        'customer': asString(asMap(raw['customer'])['name']),
        'total': asDouble(raw['total']).toStringAsFixed(2),
        'status': asString(raw['payment_status']),
      },
      columns: const [
        ColDef(key: 'order_number', label: 'Order'),
        ColDef(key: 'customer', label: 'Customer'),
        ColDef(key: 'total', label: 'Total'),
        ColDef(key: 'status', label: 'Status'),
      ],
    );
  }
}

class CancelledReportScreen extends StatelessWidget {
  const CancelledReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ReportListScreen(
      title: 'Cancelled Report',
      description: 'Cancelled orders history',
      endpoint: '/reports/cancelled',
      searchKey: 'order_number',
      rowMapper: (raw) => {
        'order_number': asString(raw['order_number']),
        'customer': asString(asMap(raw['customer'])['name']),
        'total': asDouble(raw['total']).toStringAsFixed(2),
        'date': asString(raw['created_at']).split('T').first,
      },
      columns: const [
        ColDef(key: 'order_number', label: 'Order'),
        ColDef(key: 'customer', label: 'Customer'),
        ColDef(key: 'total', label: 'Total'),
        ColDef(key: 'date', label: 'Date'),
      ],
    );
  }
}

class RefundReportScreen extends StatelessWidget {
  const RefundReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ReportListScreen(
      title: 'Refund Report',
      description: 'Refunded payment transactions',
      endpoint: '/reports/refund',
      searchKey: 'reference',
      rowMapper: (raw) => {
        'reference': asString(
          raw['reference'],
          fallback: '#${asInt(raw['id'])}',
        ),
        'method': asString(raw['method']),
        'amount': asDouble(raw['amount']).toStringAsFixed(2),
        'status': asString(raw['status']),
      },
      columns: const [
        ColDef(key: 'reference', label: 'Reference'),
        ColDef(key: 'method', label: 'Method'),
        ColDef(key: 'amount', label: 'Amount'),
        ColDef(key: 'status', label: 'Status'),
      ],
    );
  }
}

class DeliveryReportScreen extends StatelessWidget {
  const DeliveryReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ReportListScreen(
      title: 'Delivery Report',
      description: 'Delivery orders performance',
      endpoint: '/reports/delivery',
      searchKey: 'order_number',
      rowMapper: (raw) => {
        'order_number': asString(raw['order_number']),
        'customer': asString(asMap(raw['customer'])['name']),
        'status': asString(raw['status']),
        'total': asDouble(raw['total']).toStringAsFixed(2),
      },
      columns: const [
        ColDef(key: 'order_number', label: 'Order'),
        ColDef(key: 'customer', label: 'Customer'),
        ColDef(key: 'status', label: 'Status'),
        ColDef(key: 'total', label: 'Total'),
      ],
    );
  }
}

class CodReportScreen extends StatelessWidget {
  const CodReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ReportListScreen(
      title: 'COD Report',
      description: 'Cash-on-delivery payments',
      endpoint: '/reports/cod',
      searchKey: 'reference',
      rowMapper: (raw) => {
        'reference': asString(
          raw['reference'],
          fallback: '#${asInt(raw['id'])}',
        ),
        'amount': asDouble(raw['amount']).toStringAsFixed(2),
        'method': asString(raw['method']),
        'status': asString(raw['status']),
      },
      columns: const [
        ColDef(key: 'reference', label: 'Reference'),
        ColDef(key: 'amount', label: 'Amount'),
        ColDef(key: 'method', label: 'Method'),
        ColDef(key: 'status', label: 'Status'),
      ],
    );
  }
}

class LoyaltyReportScreen extends StatelessWidget {
  const LoyaltyReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ReportListScreen(
      title: 'Loyalty Report',
      description: 'Customers with loyalty points',
      endpoint: '/reports/loyalty',
      searchKey: 'name',
      rowMapper: (raw) => {
        'name': asString(raw['name']),
        'phone': asString(raw['phone']),
        'points': asInt(raw['loyalty_points']).toString(),
      },
      columns: const [
        ColDef(key: 'name', label: 'Customer'),
        ColDef(key: 'phone', label: 'Phone'),
        ColDef(key: 'points', label: 'Points'),
      ],
    );
  }
}

class RemovedKotReportScreen extends StatelessWidget {
  const RemovedKotReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Removed KOT Report',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Removed/cancelled KOT reporting.',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Backend endpoint for removed KOT report is not present. Add route/controller to connect this screen.',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
            ),
          ),
        ],
      ),
    );
  }
}
