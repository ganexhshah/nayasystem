import 'package:flutter/material.dart';
import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class MenuCategoriesScreen extends StatefulWidget {
  const MenuCategoriesScreen({super.key});
  @override
  State<MenuCategoriesScreen> createState() => _MenuCategoriesScreenState();
}

class _MenuCategoriesScreenState extends State<MenuCategoriesScreen> {
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
      final rows = await AppApi.instance.list('/menu-categories');
      if (!mounted) return;
      setState(() {
        _rows
          ..clear()
          ..addAll(
            rows.map(
              (row) => {
                'id': asInt(row['id']),
                'name': asString(row['name']),
                'description': asString(row['description']),
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
            apiErrorMessage(error, fallback: 'Failed to load categories'),
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
        title: editing != null ? 'Edit Category' : 'Add Category',
        initialValues: editing,
        fields: [
          const AppFormField(
            key: 'name',
            label: 'Category Name',
            hint: 'e.g. Pizza',
            required: true,
          ),
          const AppFormField(
            key: 'description',
            label: 'Description',
            hint: 'Short description...',
            type: AppFormFieldType.textarea,
          ),
          AppFormField(
            key: 'is_active',
            label: 'Status',
            type: AppFormFieldType.select,
            options: [
              const MapEntry('true', 'Active'),
              const MapEntry('false', 'Inactive'),
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
        'name': values['name']?.toString().trim(),
        'description': values['description']?.toString().trim().isEmpty == true
            ? null
            : values['description']?.toString().trim(),
        'is_active': values['is_active']?.toString() == 'true',
      };
      if (editing == null) {
        await AppApi.instance.create('/menu-categories', payload);
      } else {
        await AppApi.instance.update(
          '/menu-categories/${editing['id']}',
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
            apiErrorMessage(error, fallback: 'Failed to save category'),
          ),
        ),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/menu-categories/${row['id']}');
      await _loadRows();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete category'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Item Categories',
        description: 'Organise your menu items into categories',
        rows: _rows,
        loading: _loading,
        searchKey: 'name',
        onAdd: _showForm,
        onEdit: (row) => _showForm(row),
        onDelete: _delete,
        columns: [
          ColDef(key: 'name', label: 'Category Name'),
          ColDef(key: 'description', label: 'Description'),
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
