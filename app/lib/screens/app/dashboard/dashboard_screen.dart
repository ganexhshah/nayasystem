import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/session_store.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../utils/session_identity.dart';
import '../../../widgets/stat_card.dart';
import '../app_shell.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppShell(child: const DashboardContent());
  }
}

class DashboardContent extends StatefulWidget {
  const DashboardContent({super.key});

  @override
  State<DashboardContent> createState() => _DashboardContentState();
}

class _DashboardContentState extends State<DashboardContent> {
  bool _loading = false;
  Map<String, dynamic> _stats = const {};
  List<Map<String, dynamic>> _todayOrders = const [];
  List<Map<String, dynamic>> _topDishes = const [];
  List<Map<String, dynamic>> _paymentMethods = const [];

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() => _loading = true);
    try {
      final payload = asMap(await ApiClient.instance.get('/dashboard'));
      final summary = asMap(payload['summary']);
      final statsSource = summary.isNotEmpty ? summary : payload;
      if (!mounted) return;

      setState(() {
        _stats = {
          'today_orders': asInt(statsSource['today_orders']),
          'today_sales': asDouble(
            statsSource['today_sales'] ?? statsSource['today_revenue'],
          ),
          'pending_orders': asInt(statsSource['pending_orders']),
          'total_customers': asInt(statsSource['total_customers']),
          'month_sales': asDouble(
            statsSource['month_sales'] ?? statsSource['month_revenue'],
          ),
        };

        _todayOrders = extractDataList(payload['today_orders_detail'])
            .map(
              (row) => {
                'order_number': asString(row['order_number']),
                'status': asString(row['status']),
                'total': asDouble(row['total']),
              },
            )
            .toList();

        _topDishes = extractDataList(payload['top_selling_dishes'])
            .map(
              (row) => {
                'name': asString(row['name']),
                'qty': asInt(row['qty']),
              },
            )
            .toList();

        _paymentMethods = extractDataList(payload['payment_methods_today'])
            .map(
              (row) => {
                'method': asString(row['method']),
                'count': asInt(row['count']),
                'total': asDouble(row['total']),
              },
            )
            .toList();
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load dashboard'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final restaurantName = sessionRestaurantName(SessionStore.instance.user);
    final stats = [
      {
        'title': "Today's Orders",
        'value': '${asInt(_stats['today_orders'])}',
        'prefix': '',
        'label': 'Today',
        'icon': Icons.receipt_outlined,
      },
      {
        'title': "Today's Earnings",
        'value': asDouble(_stats['today_sales']).toStringAsFixed(2),
        'prefix': 'Rs. ',
        'label': 'Today',
        'icon': Icons.trending_up_outlined,
      },
      {
        'title': 'Pending Orders',
        'value': '${asInt(_stats['pending_orders'])}',
        'prefix': '',
        'label': 'Right now',
        'icon': Icons.hourglass_empty_outlined,
      },
      {
        'title': 'Total Customers',
        'value': '${asInt(_stats['total_customers'])}',
        'prefix': '',
        'label': 'All time',
        'icon': Icons.people_outline,
      },
      {
        'title': 'Sales This Month',
        'value': asDouble(_stats['month_sales']).toStringAsFixed(2),
        'prefix': 'Rs. ',
        'label': 'This month',
        'icon': Icons.bar_chart_outlined,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Dashboard',
          style: GoogleFonts.getFont(
            'Google Sans',
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: AppColors.foreground,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          "Here's what's happening today in $restaurantName.",
          style: GoogleFonts.getFont(
            'Google Sans',
            fontSize: 13,
            color: AppColors.mutedFg,
          ),
        ),
        const SizedBox(height: 20),
        if (_loading)
          const Center(
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.primary,
            ),
          )
        else ...[
          LayoutBuilder(
            builder: (context, constraints) {
              final cols = constraints.maxWidth < 360
                  ? 1
                  : (constraints.maxWidth < 700 ? 2 : 3);
              return StatsGrid(stats: stats, cols: cols);
            },
          ),
          const SizedBox(height: 24),
          OrdersTable(orders: _todayOrders),
          const SizedBox(height: 24),
          LayoutBuilder(
            builder: (context, constraints) {
              if (constraints.maxWidth > 700) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: TopDishesCard(rows: _topDishes)),
                    const SizedBox(width: 16),
                    Expanded(child: PaymentMethodsCard(rows: _paymentMethods)),
                  ],
                );
              }
              return Column(
                children: [
                  TopDishesCard(rows: _topDishes),
                  const SizedBox(height: 16),
                  PaymentMethodsCard(rows: _paymentMethods),
                ],
              );
            },
          ),
        ],
      ],
    );
  }
}

class StatsGrid extends StatelessWidget {
  final List<Map<String, dynamic>> stats;
  final int cols;

  const StatsGrid({super.key, required this.stats, required this.cols});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final spacing = 12.0;
        final totalSpacing = spacing * (cols - 1);
        final cardWidth = (constraints.maxWidth - totalSpacing) / cols;
        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: stats
              .map(
                (stat) => SizedBox(
                  width: cardWidth,
                  child: StatCard(
                    title: asString(stat['title']),
                    value: asString(stat['value']),
                    prefix: asString(stat['prefix']),
                    changeLabel: asString(stat['label']),
                    icon: stat['icon'] as IconData,
                  ),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class OrdersTable extends StatelessWidget {
  final List<Map<String, dynamic>> orders;

  const OrdersTable({super.key, required this.orders});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Text(
              "Today's Orders",
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.foreground,
              ),
            ),
          ),
          const Divider(height: 1, color: AppColors.border),
          if (orders.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'No orders today yet.',
                style: GoogleFonts.getFont(
                  'Google Sans',
                  fontSize: 13,
                  color: AppColors.mutedFg,
                ),
              ),
            )
          else
            ...orders
                .take(5)
                .map(
                  (order) => ListTile(
                    dense: true,
                    title: Text(asString(order['order_number'])),
                    subtitle: Text(asString(order['status'])),
                    trailing: Text(
                      'Rs. ${asDouble(order['total']).toStringAsFixed(2)}',
                    ),
                  ),
                ),
        ],
      ),
    );
  }
}

class TopDishesCard extends StatelessWidget {
  final List<Map<String, dynamic>> rows;

  const TopDishesCard({super.key, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Top Selling Dishes',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 16),
          if (rows.isEmpty)
            Text(
              'No data yet',
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 12,
                color: AppColors.mutedFg,
              ),
            )
          else
            ...rows.map(
              (row) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(child: Text(asString(row['name']))),
                    Text('x${asInt(row['qty'])}'),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class PaymentMethodsCard extends StatelessWidget {
  final List<Map<String, dynamic>> rows;

  const PaymentMethodsCard({super.key, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Payment Methods',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 16),
          if (rows.isEmpty)
            Text(
              'No data yet',
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 12,
                color: AppColors.mutedFg,
              ),
            )
          else
            ...rows.map(
              (row) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(child: Text(asString(row['method']))),
                    Text('Rs. ${asDouble(row['total']).toStringAsFixed(2)}'),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
