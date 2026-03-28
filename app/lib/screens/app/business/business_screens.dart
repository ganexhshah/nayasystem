import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class WebsiteAnalyticsScreen extends StatefulWidget {
  const WebsiteAnalyticsScreen({super.key});

  @override
  State<WebsiteAnalyticsScreen> createState() => _WebsiteAnalyticsScreenState();
}

class _WebsiteAnalyticsScreenState extends State<WebsiteAnalyticsScreen> {
  bool _loading = false;
  Map<String, dynamic> _summary = const {};
  List<Map<String, dynamic>> _topItems = const [];
  List<Map<String, dynamic>> _ordersByType = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final payload = asMap(await ApiClient.instance.get('/analytics/website'));
      if (!mounted) return;
      setState(() {
        _summary = asMap(payload['summary']);
        _topItems = extractDataList(payload['top_items']);
        _ordersByType = extractDataList(payload['orders_by_type']);
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(
              error,
              fallback: 'Failed to load website analytics',
            ),
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
          Text(
            'Website Analytics',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Public order and rating analytics',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
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
          else ...[
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _card('Today Orders', '${asInt(_summary['today_orders'])}'),
                _card('Week Orders', '${asInt(_summary['week_orders'])}'),
                _card('Month Orders', '${asInt(_summary['month_orders'])}'),
                _card(
                  'Today Revenue',
                  'Rs. ${asDouble(_summary['today_revenue']).toStringAsFixed(2)}',
                ),
                _card(
                  'Avg Rating',
                  asDouble(_summary['avg_rating']).toStringAsFixed(1),
                ),
              ],
            ),
            const SizedBox(height: 16),
            AppListScreen(
              title: 'Top Selling Items',
              description: 'Last 30 days',
              rows: _topItems
                  .map(
                    (row) => {
                      'name': asString(row['name']),
                      'qty': asInt(row['qty']).toString(),
                      'revenue': asDouble(row['revenue']).toStringAsFixed(2),
                    },
                  )
                  .toList(),
              searchKey: 'name',
              columns: const [
                ColDef(key: 'name', label: 'Item'),
                ColDef(key: 'qty', label: 'Qty'),
                ColDef(key: 'revenue', label: 'Revenue'),
              ],
            ),
            const SizedBox(height: 16),
            AppListScreen(
              title: 'Orders By Type',
              description: 'Last 30 days',
              rows: _ordersByType
                  .map(
                    (row) => {
                      'order_type': asString(row['order_type']),
                      'count': asInt(row['count']).toString(),
                    },
                  )
                  .toList(),
              searchKey: 'order_type',
              columns: const [
                ColDef(key: 'order_type', label: 'Type'),
                ColDef(key: 'count', label: 'Count'),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _card(String label, String value) {
    return Container(
      width: 165,
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

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _loading = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final payload = asMap(await ApiClient.instance.get('/profile'));
      if (!mounted) return;
      _nameCtrl.text = asString(payload['name']);
      _phoneCtrl.text = asString(payload['phone']);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load profile'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiClient.instance.put(
        '/profile',
        body: {'name': _nameCtrl.text.trim(), 'phone': _phoneCtrl.text.trim()},
      );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Profile updated')));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to update profile'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Profile',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Manage your account profile',
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
            Container(
              width: 420,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _input('Name', _nameCtrl),
                  const SizedBox(height: 12),
                  _input('Phone', _phoneCtrl),
                  const SizedBox(height: 16),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _save,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                      child: Text(_saving ? 'Saving...' : 'Save Profile'),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _input(String label, TextEditingController controller) {
    return TextField(
      controller: controller,
      style: GoogleFonts.getFont(
        'Google Sans',
        fontSize: 14,
        color: AppColors.foreground,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.getFont(
          'Google Sans',
          fontSize: 12,
          color: AppColors.mutedFg,
        ),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _loading = false;
  Map<String, dynamic> _subscription = const {};
  List<Map<String, dynamic>> _plans = const [];
  List<Map<String, dynamic>> _invoices = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final current = asMap(await ApiClient.instance.get('/subscription'));
      final invoices = extractDataList(
        await ApiClient.instance.get('/subscription/invoices'),
      );
      if (!mounted) return;
      setState(() {
        _subscription = asMap(current['subscription']);
        _plans = extractDataList(current['plans']);
        _invoices = invoices;
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load subscription'),
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
          Text(
            'Subscription',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Current plan and invoices',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
            ),
          ),
          const SizedBox(height: 16),
          if (_loading)
            const CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.primary,
            )
          else ...[
            Container(
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
                    'Current Plan',
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 12,
                      color: AppColors.mutedFg,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    asString(
                      asMap(_subscription['plan'])['name'],
                      fallback: 'No Active Plan',
                    ),
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.foreground,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Status: ${asString(_subscription['status'], fallback: '-')}',
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 12,
                      color: AppColors.mutedFg,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppListScreen(
              title: 'Available Plans',
              description: 'Active subscription plans',
              rows: _plans
                  .map(
                    (row) => {
                      'name': asString(row['name']),
                      'monthly': asDouble(
                        row['price_monthly'],
                      ).toStringAsFixed(2),
                      'yearly': asDouble(
                        row['price_yearly'],
                      ).toStringAsFixed(2),
                    },
                  )
                  .toList(),
              searchKey: 'name',
              columns: const [
                ColDef(key: 'name', label: 'Plan'),
                ColDef(key: 'monthly', label: 'Monthly'),
                ColDef(key: 'yearly', label: 'Yearly'),
              ],
            ),
            const SizedBox(height: 16),
            AppListScreen(
              title: 'Invoices',
              description: 'Subscription billing history',
              rows: _invoices
                  .map(
                    (row) => {
                      'invoice': asString(row['invoice_number']),
                      'plan': asString(row['plan']),
                      'amount': asDouble(row['amount']).toStringAsFixed(2),
                      'status': asString(row['status']),
                    },
                  )
                  .toList(),
              searchKey: 'invoice',
              columns: const [
                ColDef(key: 'invoice', label: 'Invoice'),
                ColDef(key: 'plan', label: 'Plan'),
                ColDef(key: 'amount', label: 'Amount'),
                ColDef(key: 'status', label: 'Status'),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final List<Map<String, dynamic>> _rows = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final rows = extractDataList(
        await ApiClient.instance.get('/support-tickets'),
      );
      if (!mounted) return;
      setState(() {
        _rows
          ..clear()
          ..addAll(
            rows.map(
              (row) => {
                'id': asInt(row['id']),
                'subject': asString(row['subject']),
                'category': asString(row['category']),
                'priority': asString(row['priority']),
                'status': asString(row['status']),
                'created': asString(row['created_at']).split('T').first,
              },
            ),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load support tickets'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _newTicket() {
    showDialog(
      context: context,
      builder: (_) => AppFormDialog(
        title: 'New Support Ticket',
        fields: [
          const AppFormField(key: 'subject', label: 'Subject', required: true),
          AppFormField(
            key: 'category',
            label: 'Category',
            type: AppFormFieldType.select,
            options: const [
              MapEntry('general', 'General'),
              MapEntry('billing', 'Billing'),
              MapEntry('technical', 'Technical'),
              MapEntry('account', 'Account'),
              MapEntry('training', 'Training'),
            ],
          ),
          AppFormField(
            key: 'priority',
            label: 'Priority',
            type: AppFormFieldType.select,
            options: const [
              MapEntry('low', 'Low'),
              MapEntry('medium', 'Medium'),
              MapEntry('high', 'High'),
              MapEntry('urgent', 'Urgent'),
            ],
          ),
          const AppFormField(
            key: 'message',
            label: 'Message',
            type: AppFormFieldType.textarea,
            required: true,
          ),
        ],
        onSubmit: _createTicket,
      ),
    );
  }

  Future<void> _createTicket(Map<String, dynamic> values) async {
    try {
      await ApiClient.instance.post(
        '/support-tickets',
        body: {
          'subject': values['subject']?.toString().trim(),
          'category': asString(values['category'], fallback: 'general'),
          'priority': asString(values['priority'], fallback: 'medium'),
          'message': values['message']?.toString().trim(),
        },
      );
      await _load();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to create ticket'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Support Tickets',
        description: 'Get help from support team',
        rows: _rows,
        loading: _loading,
        searchKey: 'subject',
        onAdd: _newTicket,
        columns: const [
          ColDef(key: 'subject', label: 'Subject'),
          ColDef(key: 'category', label: 'Category'),
          ColDef(key: 'priority', label: 'Priority'),
          ColDef(key: 'status', label: 'Status'),
          ColDef(key: 'created', label: 'Created'),
        ],
      ),
    );
  }
}
