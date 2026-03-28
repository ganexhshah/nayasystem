import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({super.key});

  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> {
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
      final categories = await AppApi.instance.list('/expense-categories');
      final expenses = await AppApi.instance.list('/expenses');

      if (!mounted) return;

      final categoryNameById = {
        for (final category in categories)
          asInt(category['id']): asString(category['name'], fallback: 'Other'),
      };

      setState(() {
        _categoryOptions = categories
            .map(
              (c) => MapEntry(
                asInt(c['id']).toString(),
                asString(c['name'], fallback: 'Category'),
              ),
            )
            .toList();

        _rows
          ..clear()
          ..addAll(
            expenses.map((row) {
              final category = asMap(row['category']);
              final categoryId = asInt(row['category_id']);
              return {
                'id': asInt(row['id']),
                'title': asString(row['title']),
                'category_id': categoryId,
                'category': asString(
                  category['name'],
                  fallback: categoryNameById[categoryId] ?? 'Other',
                ),
                'amount': asDouble(row['amount']),
                'date': asString(row['date']),
                'notes': asString(row['notes']),
              };
            }),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load expenses'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showForm([Map<String, dynamic>? editing]) {
    final initial = editing != null
        ? {
            ...editing,
            'category_id': asInt(editing['category_id']).toString(),
            'amount': asDouble(editing['amount']).toString(),
            'notes': editing['notes'],
          }
        : null;

    showDialog(
      context: context,
      builder: (_) => AppFormDialog(
        title: editing != null ? 'Edit Expense' : 'Add Expense',
        initialValues: initial,
        fields: [
          const AppFormField(
            key: 'title',
            label: 'Title',
            hint: 'e.g. Gas Cylinder',
            required: true,
          ),
          AppFormField(
            key: 'category_id',
            label: 'Category',
            type: AppFormFieldType.select,
            options: _categoryOptions,
          ),
          const AppFormField(
            key: 'amount',
            label: 'Amount',
            hint: '0.00',
            required: true,
            type: AppFormFieldType.number,
          ),
          const AppFormField(key: 'date', label: 'Date', hint: 'YYYY-MM-DD'),
          const AppFormField(
            key: 'notes',
            label: 'Note',
            hint: 'Optional',
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
        'title': values['title']?.toString().trim(),
        'category_id':
            int.tryParse(values['category_id']?.toString() ?? '0') ?? 0,
        'amount': double.tryParse(values['amount']?.toString() ?? '0') ?? 0,
        'date': values['date']?.toString().trim(),
        'notes': values['notes']?.toString().trim().isEmpty == true
            ? null
            : values['notes']?.toString().trim(),
      };
      if (editing == null) {
        await AppApi.instance.create('/expenses', payload);
      } else {
        await AppApi.instance.update(
          '/expenses/${editing['id']}',
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
            apiErrorMessage(error, fallback: 'Failed to save expense'),
          ),
        ),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/expenses/${row['id']}');
      await _loadData();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete expense'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Expenses',
        description: 'Track your restaurant expenses',
        rows: _rows,
        loading: _loading,
        searchKey: 'title',
        onAdd: _showForm,
        onEdit: (row) => _showForm(row),
        onDelete: _delete,
        columns: [
          ColDef(key: 'title', label: 'Title'),
          ColDef(key: 'category', label: 'Category'),
          ColDef(
            key: 'amount',
            label: 'Amount',
            render: (r) => Text(
              'Rs. ${asDouble(r['amount']).toStringAsFixed(2)}',
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.foreground,
              ),
            ),
          ),
          ColDef(key: 'date', label: 'Date'),
        ],
      ),
    );
  }
}

class ExpenseCategoriesScreen extends StatefulWidget {
  const ExpenseCategoriesScreen({super.key});

  @override
  State<ExpenseCategoriesScreen> createState() =>
      _ExpenseCategoriesScreenState();
}

class _ExpenseCategoriesScreenState extends State<ExpenseCategoriesScreen> {
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
      final rows = await AppApi.instance.list('/expense-categories');
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
            apiErrorMessage(
              error,
              fallback: 'Failed to load expense categories',
            ),
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
        fields: const [
          AppFormField(
            key: 'name',
            label: 'Category Name',
            hint: 'e.g. Utilities',
            required: true,
          ),
          AppFormField(
            key: 'description',
            label: 'Description',
            hint: 'Optional',
            type: AppFormFieldType.textarea,
          ),
          AppFormField(
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
        'description': values['description']?.toString().trim().isEmpty == true
            ? null
            : values['description']?.toString().trim(),
        'is_active': values['is_active'] == true,
      };
      if (editing == null) {
        await AppApi.instance.create('/expense-categories', payload);
      } else {
        await AppApi.instance.update(
          '/expense-categories/${editing['id']}',
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
      await AppApi.instance.remove('/expense-categories/${row['id']}');
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
        title: 'Expense Categories',
        description: 'Organize expenses by category',
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
