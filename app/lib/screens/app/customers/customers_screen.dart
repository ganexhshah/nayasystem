import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
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
      final rows = await AppApi.instance.list('/customers');
      if (!mounted) return;
      setState(() {
        _rows
          ..clear()
          ..addAll(
            rows.map(
              (row) => {
                'id': asInt(row['id']),
                'name': asString(row['name'], fallback: 'Guest Customer'),
                'email': asString(row['email']),
                'phone': asString(row['phone']),
                'address': asString(row['address']),
                'total_orders': asInt(row['total_orders']),
                'loyalty_points': asInt(row['loyalty_points']),
              },
            ),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load customers'),
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
        title: editing != null ? 'Edit Customer' : 'Add Customer',
        initialValues: editing,
        fields: const [
          AppFormField(
            key: 'name',
            label: 'Customer Name',
            hint: 'Full name',
            required: true,
          ),
          AppFormField(
            key: 'email',
            label: 'Email Address',
            hint: 'email@example.com',
          ),
          AppFormField(key: 'phone', label: 'Phone', hint: '000-000-0000'),
          AppFormField(
            key: 'address',
            label: 'Address',
            hint: 'Street, City, State',
            type: AppFormFieldType.textarea,
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
        'email': values['email']?.toString().trim().isEmpty == true
            ? null
            : values['email']?.toString().trim(),
        'phone': values['phone']?.toString().trim().isEmpty == true
            ? null
            : values['phone']?.toString().trim(),
        'address': values['address']?.toString().trim().isEmpty == true
            ? null
            : values['address']?.toString().trim(),
      };
      if (editing == null) {
        await AppApi.instance.create('/customers', payload);
      } else {
        await AppApi.instance.update(
          '/customers/${editing['id']}',
          payload,
          patch: true,
        );
      }
      await _loadRows();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to save customer'),
          ),
        ),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/customers/${row['id']}');
      await _loadRows();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete customer'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Customers',
        description: 'Manage your restaurant customers',
        rows: _rows,
        loading: _loading,
        searchKey: 'name',
        onAdd: _showForm,
        onEdit: (row) => _showForm(row),
        onDelete: _delete,
        columns: [
          ColDef(
            key: 'name',
            label: 'Name',
            render: (r) => Row(
              children: [
                CircleAvatar(
                  radius: 14,
                  backgroundColor: const Color(0xFFEEF2FF),
                  child: Text(
                    _initials(asString(r['name'])),
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    asString(r['name'], fallback: 'Guest Customer'),
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
            key: 'phone',
            label: 'Phone',
            render: (r) => Text(
              asString(r['phone'], fallback: '-'),
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 13,
                color: AppColors.mutedFg,
              ),
            ),
          ),
          ColDef(
            key: 'total_orders',
            label: 'Orders',
            render: (r) => Text(
              '${asInt(r['total_orders'])} orders',
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 13,
                color: AppColors.foreground,
              ),
            ),
          ),
          ColDef(
            key: 'loyalty_points',
            label: 'Points',
            render: (r) => Row(
              children: [
                const Icon(Icons.star, size: 13, color: Color(0xFFF59E0B)),
                const SizedBox(width: 4),
                Text(
                  '${asInt(r['loyalty_points'])}',
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 13,
                    color: AppColors.foreground,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _initials(String name) {
    final words = name
        .trim()
        .split(' ')
        .where((word) => word.isNotEmpty)
        .toList();
    if (words.isEmpty) return 'G';
    if (words.length == 1) return words.first.substring(0, 1).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }
}
