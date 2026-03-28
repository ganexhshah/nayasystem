import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class ModifiersScreen extends StatefulWidget {
  const ModifiersScreen({super.key});

  @override
  State<ModifiersScreen> createState() => _ModifiersScreenState();
}

class _ModifiersScreenState extends State<ModifiersScreen> {
  final List<Map<String, dynamic>> _rows = [];
  List<MapEntry<String, String>> _groupOptions = const [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final groups = await AppApi.instance.list('/modifier-groups');
      final modifiers = await AppApi.instance.list('/modifiers');

      if (!mounted) return;

      final groupNameById = {
        for (final group in groups)
          asInt(group['id']): asString(group['name'], fallback: 'Group'),
      };

      setState(() {
        _groupOptions = groups
            .map(
              (g) => MapEntry(
                asInt(g['id']).toString(),
                asString(g['name'], fallback: 'Group'),
              ),
            )
            .toList();

        _rows
          ..clear()
          ..addAll(
            modifiers.map((row) {
              final group = asMap(row['group']);
              final groupId = asInt(row['modifier_group_id']);
              return {
                'id': asInt(row['id']),
                'name': asString(row['name']),
                'modifier_group_id': groupId,
                'group': asString(
                  group['name'],
                  fallback: groupNameById[groupId] ?? 'Group',
                ),
                'price': asDouble(row['price']),
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
            apiErrorMessage(error, fallback: 'Failed to load modifiers'),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  void _showForm([Map<String, dynamic>? editing]) {
    final initial = editing != null
        ? {
            ...editing,
            'modifier_group_id': asInt(editing['modifier_group_id']).toString(),
            'price': asDouble(editing['price']).toString(),
          }
        : null;

    showDialog(
      context: context,
      builder: (_) => AppFormDialog(
        title: editing != null ? 'Edit Modifier' : 'Add Modifier',
        initialValues: initial,
        fields: [
          AppFormField(
            key: 'modifier_group_id',
            label: 'Modifier Group',
            type: AppFormFieldType.select,
            options: _groupOptions,
          ),
          const AppFormField(
            key: 'name',
            label: 'Modifier Name',
            hint: 'e.g. Extra Cheese',
            required: true,
          ),
          const AppFormField(
            key: 'price',
            label: 'Price',
            hint: '0.00',
            type: AppFormFieldType.number,
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
      final groupId = int.tryParse(asString(values['modifier_group_id'])) ?? 0;
      if (editing == null && groupId <= 0) {
        throw const ApiException(
          statusCode: 422,
          message: 'Please select a modifier group',
        );
      }

      final basePayload = {
        'name': values['name']?.toString().trim(),
        'price': double.tryParse(values['price']?.toString() ?? '0') ?? 0,
        'is_active': values['is_active'] == true,
      };

      if (editing == null) {
        await AppApi.instance.create('/modifiers', {
          ...basePayload,
          'modifier_group_id': groupId,
        });
      } else {
        await AppApi.instance.update(
          '/modifiers/${editing['id']}',
          basePayload,
          patch: true,
        );
      }

      await _loadData();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to save modifier'),
          ),
        ),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/modifiers/${row['id']}');
      await _loadData();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete modifier'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Item Modifiers',
        description: 'Modifier options for menu items',
        rows: _rows,
        loading: _loading,
        searchKey: 'name',
        onAdd: _showForm,
        onEdit: (row) => _showForm(row),
        onDelete: _delete,
        columns: [
          ColDef(key: 'name', label: 'Modifier Name'),
          ColDef(key: 'group', label: 'Group'),
          ColDef(
            key: 'price',
            label: 'Price',
            render: (r) => Text(
              'Rs. ${asDouble(r['price']).toStringAsFixed(2)}',
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 13,
                color: AppColors.foreground,
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
