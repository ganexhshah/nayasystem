import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class StaffScreen extends StatefulWidget {
  const StaffScreen({super.key});

  @override
  State<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends State<StaffScreen> {
  final List<Map<String, dynamic>> _rows = [];
  bool _loading = false;

  static const _roles = [
    MapEntry('admin', 'Admin'),
    MapEntry('branch_head', 'Branch Head'),
    MapEntry('manager', 'Manager'),
    MapEntry('cashier', 'Cashier'),
    MapEntry('waiter', 'Waiter'),
    MapEntry('chef', 'Chef'),
    MapEntry('kitchen', 'Kitchen'),
    MapEntry('delivery', 'Delivery'),
    MapEntry('pos_operator', 'POS Operator'),
  ];

  @override
  void initState() {
    super.initState();
    _loadRows();
  }

  Future<void> _loadRows() async {
    setState(() => _loading = true);
    try {
      final rows = await AppApi.instance.list('/staff');
      if (!mounted) return;
      setState(() {
        _rows
          ..clear()
          ..addAll(
            rows.map((row) {
              final roles = row['roles'] is List
                  ? row['roles'] as List
                  : const [];
              final roleMap = roles.isNotEmpty && roles.first is Map
                  ? asMap(roles.first)
                  : <String, dynamic>{};
              final role = asString(roleMap['name'], fallback: 'staff');
              return {
                'id': asInt(row['id']),
                'name': asString(row['name']),
                'email': asString(row['email']),
                'phone': asString(row['phone']),
                'role': role,
                'is_active': asBool(row['is_active'], fallback: true),
              };
            }),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load staff'),
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
        title: editing != null ? 'Edit Staff' : 'Add Staff',
        initialValues: editing,
        fields: [
          const AppFormField(
            key: 'name',
            label: 'Full Name',
            hint: 'Full name',
            required: true,
          ),
          const AppFormField(
            key: 'email',
            label: 'Email',
            hint: 'email@example.com',
          ),
          const AppFormField(
            key: 'phone',
            label: 'Phone',
            hint: '000-000-0000',
          ),
          AppFormField(
            key: 'role',
            label: 'Role',
            type: AppFormFieldType.select,
            options: _roles,
          ),
          const AppFormField(
            key: 'password',
            label: 'Password',
            hint: 'Min 8 chars',
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
      final role = asString(values['role'], fallback: 'waiter');
      if (editing == null) {
        await AppApi.instance.create('/staff', {
          'name': values['name']?.toString().trim(),
          'email': values['email']?.toString().trim(),
          'phone': values['phone']?.toString().trim().isEmpty == true
              ? null
              : values['phone']?.toString().trim(),
          'password': values['password']?.toString(),
          'role': role,
        });
      } else {
        final updatePayload = {
          'name': values['name']?.toString().trim(),
          'phone': values['phone']?.toString().trim().isEmpty == true
              ? null
              : values['phone']?.toString().trim(),
          'is_active': values['is_active'] == true,
        };
        final password = values['password']?.toString() ?? '';
        if (password.trim().isNotEmpty) {
          updatePayload['password'] = password;
        }

        await AppApi.instance.update(
          '/staff/${editing['id']}',
          updatePayload,
          patch: true,
        );

        if (role.isNotEmpty && role != asString(editing['role'])) {
          await ApiClient.instance.post(
            '/staff/${editing['id']}/permissions',
            body: {'role': role},
          );
        }
      }

      await _loadRows();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to save staff'),
          ),
        ),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/staff/${row['id']}');
      await _loadRows();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete staff'),
          ),
        ),
      );
    }
  }

  String _roleLabel(String role) {
    final match = _roles.where((entry) => entry.key == role).toList();
    if (match.isNotEmpty) return match.first.value;
    return role.replaceAll('_', ' ');
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Staff',
        description: 'Manage your restaurant staff',
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
                    asString(r['name']).isEmpty
                        ? 'U'
                        : asString(r['name'])[0].toUpperCase(),
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
            key: 'role',
            label: 'Role',
            render: (r) => Text(_roleLabel(asString(r['role']))),
          ),
          ColDef(key: 'phone', label: 'Phone'),
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
