import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class KitchenSettingsScreen extends StatefulWidget {
  const KitchenSettingsScreen({super.key});

  @override
  State<KitchenSettingsScreen> createState() => _KitchenSettingsScreenState();
}

class _KitchenSettingsScreenState extends State<KitchenSettingsScreen> {
  final List<Map<String, dynamic>> _kitchens = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadRows();
  }

  Future<void> _loadRows() async {
    setState(() => _loading = true);
    try {
      final rows = await AppApi.instance.list('/kitchens');
      if (!mounted) return;
      setState(() {
        _kitchens
          ..clear()
          ..addAll(
            rows.map(
              (row) => {
                'id': asInt(row['id']),
                'name': asString(row['name']),
                'type': asString(row['type'], fallback: 'default'),
                'is_active': asBool(row['is_active'], fallback: true),
              },
            ),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load kitchens'),
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
        title: editing != null ? 'Edit Kitchen' : 'Add Kitchen',
        initialValues: editing,
        fields: [
          const AppFormField(
            key: 'name',
            label: 'Kitchen Name',
            hint: 'e.g. Main Kitchen',
            required: true,
          ),
          AppFormField(
            key: 'type',
            label: 'Type',
            type: AppFormFieldType.select,
            options: const [
              MapEntry('default', 'Default'),
              MapEntry('veg', 'Veg'),
              MapEntry('non_veg', 'Non-Veg'),
            ],
          ),
          const AppFormField(
            key: 'is_active',
            label: 'Active',
            type: AppFormFieldType.toggle,
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
        'name': values['name']?.toString().trim(),
        'type': asString(values['type'], fallback: 'default'),
        'is_active': values['is_active'] == true,
      };
      if (editing == null) {
        await AppApi.instance.create('/kitchens', payload);
      } else {
        await AppApi.instance.update('/kitchens/${editing['id']}', payload);
      }
      await _loadRows();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to save kitchen'),
          ),
        ),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/kitchens/${row['id']}');
      await _loadRows();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete kitchen'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Kitchens',
        description: 'Manage kitchen stations',
        rows: _kitchens,
        loading: _loading,
        searchKey: 'name',
        onAdd: _showForm,
        onEdit: (row) => _showForm(row),
        onDelete: _delete,
        columns: [
          ColDef(
            key: 'name',
            label: 'Kitchen Name',
            render: (r) => Row(
              children: [
                const Icon(
                  Icons.kitchen_outlined,
                  size: 16,
                  color: AppColors.mutedFg,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    asString(r['name']),
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppColors.foreground,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          ColDef(
            key: 'type',
            label: 'Type',
            render: (r) => Text(
              asString(r['type']).replaceAll('_', '-'),
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 13,
                color: AppColors.mutedFg,
              ),
            ),
          ),
          ColDef(
            key: 'is_active',
            label: 'Status',
            render: (r) => StatusBadge(active: r['is_active'] == true),
          ),
        ],
      ),
    );
  }
}

class KotBoardScreen extends StatefulWidget {
  final String title;
  final String? kitchenType;

  const KotBoardScreen({super.key, required this.title, this.kitchenType});

  @override
  State<KotBoardScreen> createState() => _KotBoardScreenState();
}

class _KotBoardScreenState extends State<KotBoardScreen> {
  final List<Map<String, dynamic>> _kots = [];
  bool _loading = false;

  static const _statusColors = {
    'pending': Color(0xFFDBEAFE),
    'preparing': Color(0xFFFEF3C7),
    'ready': Color(0xFFD1FAE5),
    'served': Color(0xFFCCFBF1),
  };

  static const _statusText = {
    'pending': Color(0xFF1D4ED8),
    'preparing': Color(0xFFB45309),
    'ready': Color(0xFF065F46),
    'served': Color(0xFF0F766E),
  };

  @override
  void initState() {
    super.initState();
    _loadKots();
  }

  Future<void> _loadKots() async {
    setState(() => _loading = true);
    try {
      dynamic payload;
      if (widget.kitchenType == null) {
        payload = await ApiClient.instance.get('/kots');
      } else {
        final kitchens = await AppApi.instance.list('/kitchens');
        final kitchen = kitchens.firstWhere(
          (k) => asString(k['type']) == widget.kitchenType,
          orElse: () => <String, dynamic>{},
        );
        final kitchenId = asInt(kitchen['id']);
        if (kitchenId <= 0) {
          payload = [];
        } else {
          payload = await ApiClient.instance.get('/kitchens/$kitchenId/kots');
        }
      }

      final rows = extractDataList(payload);
      if (!mounted) return;

      setState(() {
        _kots
          ..clear()
          ..addAll(
            rows.map((kot) {
              final order = asMap(kot['order']);
              final table = asMap(order['table']);
              final itemsRaw = kot['items'] is List
                  ? kot['items'] as List
                  : const [];
              final items = itemsRaw
                  .map(
                    (item) => {
                      'name': asString(
                        item is Map ? item['name'] : null,
                        fallback: 'Item',
                      ),
                      'qty': asInt(
                        item is Map ? item['quantity'] : null,
                        fallback: 1,
                      ),
                    },
                  )
                  .toList();

              return {
                'id': asInt(kot['id']),
                'kot_number': asString(kot['kot_number']),
                'table': asString(table['name'], fallback: '-'),
                'status': asString(kot['status'], fallback: 'pending'),
                'items': items,
                'created_at': asString(kot['created_at']).split('T').first,
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

  Future<void> _advance(Map<String, dynamic> kot) async {
    const flow = ['pending', 'preparing', 'ready', 'served'];
    final current = asString(kot['status']);
    final index = flow.indexOf(current);
    if (index < 0 || index >= flow.length - 1) return;

    try {
      await ApiClient.instance.post(
        '/kots/${kot['id']}/status',
        body: {'status': flow[index + 1]},
      );
      await _loadKots();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to update KOT status'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.title,
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Live kitchen order tickets',
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
          else if (_kots.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Text(
                  'No active KOTs',
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 13,
                    color: AppColors.mutedFg,
                  ),
                ),
              ),
            )
          else
            ..._kots.map(
              (kot) => _KotCard(
                kot: kot,
                statusColors: _statusColors,
                statusTextColors: _statusText,
                onAdvance: () => _advance(kot),
              ),
            ),
        ],
      ),
    );
  }
}

class _KotCard extends StatelessWidget {
  final Map<String, dynamic> kot;
  final Map<String, Color> statusColors;
  final Map<String, Color> statusTextColors;
  final VoidCallback onAdvance;

  const _KotCard({
    required this.kot,
    required this.statusColors,
    required this.statusTextColors,
    required this.onAdvance,
  });

  @override
  Widget build(BuildContext context) {
    final status = asString(kot['status'], fallback: 'pending');
    final bg = statusColors[status] ?? AppColors.muted;
    final tc = statusTextColors[status] ?? AppColors.mutedFg;
    final items = kot['items'] as List;
    final done = status == 'ready' || status == 'served';

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
                  asString(kot['kot_number']),
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.foreground,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.muted,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    asString(kot['table'], fallback: '-'),
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 12,
                      color: AppColors.mutedFg,
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: bg,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status,
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: tc,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ...items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    const Icon(
                      Icons.fiber_manual_record,
                      size: 8,
                      color: AppColors.mutedFg,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        asString(item['name']),
                        style: GoogleFonts.getFont(
                          'Google Sans',
                          fontSize: 13,
                          color: AppColors.foreground,
                        ),
                      ),
                    ),
                    Text(
                      'x${asInt(item['qty'])}',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.foreground,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Text(
                  asString(kot['created_at']),
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 11,
                    color: AppColors.mutedFg,
                  ),
                ),
                const Spacer(),
                if (!done)
                  ElevatedButton(
                    onPressed: onAdvance,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 6,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      status == 'pending' ? 'Start' : 'Mark Ready',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  )
                else
                  Text(
                    'Ready',
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 12,
                      color: const Color(0xFF065F46),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
