import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class MenuItemsScreen extends StatefulWidget {
  const MenuItemsScreen({super.key});

  @override
  State<MenuItemsScreen> createState() => _MenuItemsScreenState();
}

class _MenuItemsScreenState extends State<MenuItemsScreen> {
  final List<Map<String, dynamic>> _rows = [];
  List<MapEntry<String, String>> _categoryOptions = const [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final categories = await AppApi.instance.list('/menu-categories');
      final items = await AppApi.instance.list('/menu-items');

      if (!mounted) return;

      setState(() {
        _categoryOptions = categories
            .map(
              (row) => MapEntry(
                asInt(row['id']).toString(),
                asString(row['name'], fallback: 'Category'),
              ),
            )
            .toList();

        _rows
          ..clear()
          ..addAll(
            items.map((row) {
              final category = asMap(row['category']);
              return {
                'id': asInt(row['id']),
                'name': asString(row['name']),
                'description': asString(row['description']),
                'category_id': asInt(row['category_id']),
                'category': asString(
                  category['name'],
                  fallback: 'Uncategorized',
                ),
                'price': asDouble(row['price']),
                'is_available': asBool(row['is_available'], fallback: true),
              };
            }),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load menu items'),
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
            'category_id': asInt(editing['category_id']).toString(),
            'price': asDouble(editing['price']).toString(),
          }
        : null;

    showDialog(
      context: context,
      builder: (_) => AppFormDialog(
        title: editing != null ? 'Edit Item' : 'Add Item',
        initialValues: initial,
        fields: [
          const AppFormField(
            key: 'name',
            label: 'Item Name',
            hint: 'e.g. Butter Chicken',
            required: true,
          ),
          const AppFormField(
            key: 'description',
            label: 'Description',
            hint: 'Short description...',
            type: AppFormFieldType.textarea,
          ),
          const AppFormField(
            key: 'price',
            label: 'Price',
            hint: '0.00',
            required: true,
            type: AppFormFieldType.number,
          ),
          AppFormField(
            key: 'category_id',
            label: 'Category',
            type: AppFormFieldType.select,
            options: _categoryOptions,
          ),
          const AppFormField(
            key: 'is_available',
            label: 'Available',
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
      final categoryId = int.tryParse(asString(values['category_id'])) ?? 0;
      if (categoryId <= 0) {
        throw const ApiException(
          statusCode: 422,
          message: 'Please select a category',
        );
      }

      final payload = {
        'name': values['name']?.toString().trim(),
        'description': values['description']?.toString().trim().isEmpty == true
            ? null
            : values['description']?.toString().trim(),
        'category_id': categoryId,
        'price': double.tryParse(values['price']?.toString() ?? '0') ?? 0,
        'is_available': values['is_available'] == true,
      };

      if (editing == null) {
        await AppApi.instance.create('/menu-items', payload);
      } else {
        await AppApi.instance.update(
          '/menu-items/${editing['id']}',
          payload,
          patch: true,
        );
      }

      await _loadData();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to save menu item'),
          ),
        ),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/menu-items/${row['id']}');
      await _loadData();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete menu item'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Menu Items',
        description: 'Manage all your menu items',
        rows: _rows,
        loading: _loading,
        searchKey: 'name',
        onAdd: _showForm,
        onEdit: (row) => _showForm(row),
        onDelete: _delete,
        columns: [
          ColDef(key: 'name', label: 'Item Name'),
          ColDef(key: 'category', label: 'Category'),
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
            key: 'is_available',
            label: 'Available',
            render: (r) => StatusBadge(
              active: r['is_available'] == true,
              trueLabel: 'Yes',
              falseLabel: 'No',
            ),
          ),
        ],
      ),
    );
  }
}
