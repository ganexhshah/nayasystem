import 'package:flutter/material.dart';

import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class ModifierGroupsScreen extends StatefulWidget {
  const ModifierGroupsScreen({super.key});

  @override
  State<ModifierGroupsScreen> createState() => _ModifierGroupsScreenState();
}

class _ModifierGroupsScreenState extends State<ModifierGroupsScreen> {
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
      final rows = await AppApi.instance.list('/modifier-groups');
      if (!mounted) return;
      setState(() {
        _rows
          ..clear()
          ..addAll(
            rows.map(
              (r) => {
                'id': asInt(r['id']),
                'name': asString(r['name']),
                'min_select': asInt(r['min_select']),
                'max_select': asInt(r['max_select']),
                'is_required': asBool(r['is_required']),
                'is_active': asBool(r['is_active'], fallback: true),
              },
            ),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load modifier groups'),
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
        title: editing != null ? 'Edit Modifier Group' : 'Add Modifier Group',
        initialValues: editing != null
            ? {
                ...editing,
                'min_select': asInt(editing['min_select']).toString(),
                'max_select': asInt(editing['max_select']).toString(),
              }
            : null,
        fields: [
          const AppFormField(
            key: 'name',
            label: 'Group Name',
            hint: 'e.g. Pizza Size',
            required: true,
          ),
          const AppFormField(
            key: 'min_select',
            label: 'Min Select',
            hint: '0',
            type: AppFormFieldType.number,
          ),
          const AppFormField(
            key: 'max_select',
            label: 'Max Select',
            hint: '1',
            type: AppFormFieldType.number,
          ),
          const AppFormField(
            key: 'is_required',
            label: 'Required',
            type: AppFormFieldType.toggle,
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
        'min_select':
            int.tryParse(values['min_select']?.toString() ?? '0') ?? 0,
        'max_select':
            int.tryParse(values['max_select']?.toString() ?? '1') ?? 1,
        'is_required': values['is_required'] == true,
        'is_active': values['is_active'] == true,
      };
      if (editing == null) {
        await AppApi.instance.create('/modifier-groups', payload);
      } else {
        await AppApi.instance.update(
          '/modifier-groups/${editing['id']}',
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
            apiErrorMessage(error, fallback: 'Failed to save modifier group'),
          ),
        ),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/modifier-groups/${row['id']}');
      await _loadRows();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete modifier group'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Modifier Groups',
        description: 'Group modifiers that apply to menu items',
        rows: _rows,
        loading: _loading,
        searchKey: 'name',
        onAdd: _showForm,
        onEdit: (row) => _showForm(row),
        onDelete: _delete,
        columns: [
          ColDef(key: 'name', label: 'Group Name'),
          ColDef(key: 'min_select', label: 'Min'),
          ColDef(key: 'max_select', label: 'Max'),
          ColDef(
            key: 'is_required',
            label: 'Required',
            render: (r) => StatusBadge(
              active: r['is_required'] == true,
              trueLabel: 'Yes',
              falseLabel: 'No',
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
