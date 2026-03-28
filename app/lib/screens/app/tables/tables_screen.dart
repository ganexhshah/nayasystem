import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class TableAreasScreen extends StatefulWidget {
  const TableAreasScreen({super.key});

  @override
  State<TableAreasScreen> createState() => _TableAreasScreenState();
}

class _TableAreasScreenState extends State<TableAreasScreen> {
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
      final rows = await AppApi.instance.list('/table-areas');
      if (!mounted) return;
      setState(() {
        _rows
          ..clear()
          ..addAll(
            rows.map(
              (r) => {
                'id': asInt(r['id']),
                'name': asString(r['name']),
                'description': asString(r['description']),
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
            apiErrorMessage(error, fallback: 'Failed to load table areas'),
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
        title: editing != null ? 'Edit Area' : 'Add Area',
        initialValues: editing,
        fields: const [
          AppFormField(
            key: 'name',
            label: 'Area Name',
            hint: 'e.g. Indoor',
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
        await AppApi.instance.create('/table-areas', payload);
      } else {
        await AppApi.instance.update(
          '/table-areas/${editing['id']}',
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
            apiErrorMessage(error, fallback: 'Failed to save table area'),
          ),
        ),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/table-areas/${row['id']}');
      await _loadRows();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete table area'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Table Areas',
        description: 'Manage seating areas',
        rows: _rows,
        loading: _loading,
        searchKey: 'name',
        onAdd: _showForm,
        onEdit: (row) => _showForm(row),
        onDelete: _delete,
        columns: [
          ColDef(key: 'name', label: 'Area Name'),
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

class TablesListScreen extends StatefulWidget {
  const TablesListScreen({super.key});

  @override
  State<TablesListScreen> createState() => _TablesListScreenState();
}

class _TablesListScreenState extends State<TablesListScreen> {
  final List<Map<String, dynamic>> _rows = [];
  List<MapEntry<String, String>> _areaOptions = const [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final areas = await AppApi.instance.list('/table-areas');
      final tables = await AppApi.instance.list('/tables');

      if (!mounted) return;

      final areaNameById = {
        for (final area in areas)
          asInt(area['id']): asString(area['name'], fallback: 'Unassigned'),
      };

      setState(() {
        _areaOptions = areas
            .map(
              (a) => MapEntry(
                asInt(a['id']).toString(),
                asString(a['name'], fallback: 'Area'),
              ),
            )
            .toList();

        _rows
          ..clear()
          ..addAll(
            tables.map((row) {
              final area = asMap(row['area']);
              final areaId = asInt(row['area_id']);
              return {
                'id': asInt(row['id']),
                'name': asString(row['name']),
                'area_id': areaId,
                'area': asString(
                  area['name'],
                  fallback: areaNameById[areaId] ?? 'Unassigned',
                ),
                'capacity': asInt(row['capacity']),
                'is_active': asBool(row['is_active'], fallback: true),
                'type': asString(row['type'], fallback: 'table'),
              };
            }),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load tables'),
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
            'area_id': asInt(editing['area_id']).toString(),
            'capacity': asInt(editing['capacity']).toString(),
          }
        : {'type': 'table'};

    showDialog(
      context: context,
      builder: (_) => AppFormDialog(
        title: editing != null ? 'Edit Table' : 'Add Table',
        initialValues: initial,
        fields: [
          const AppFormField(
            key: 'name',
            label: 'Table Name',
            hint: 'e.g. T-01',
            required: true,
          ),
          AppFormField(
            key: 'area_id',
            label: 'Area',
            type: AppFormFieldType.select,
            options: _areaOptions,
          ),
          const AppFormField(
            key: 'capacity',
            label: 'Capacity',
            hint: '4',
            type: AppFormFieldType.number,
          ),
          AppFormField(
            key: 'type',
            label: 'Type',
            type: AppFormFieldType.select,
            options: const [
              MapEntry('table', 'Table'),
              MapEntry('cabin', 'Cabin'),
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
        'area_id': int.tryParse(values['area_id']?.toString() ?? ''),
        'capacity': int.tryParse(values['capacity']?.toString() ?? '0') ?? 1,
        'type': asString(values['type'], fallback: 'table'),
        'is_active': values['is_active'] == true,
      };
      if (editing == null) {
        await AppApi.instance.create('/tables', payload);
      } else {
        await AppApi.instance.update(
          '/tables/${editing['id']}',
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
            apiErrorMessage(error, fallback: 'Failed to save table'),
          ),
        ),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/tables/${row['id']}');
      await _loadData();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete table'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Tables',
        description: 'Manage restaurant tables',
        rows: _rows,
        loading: _loading,
        searchKey: 'name',
        onAdd: _showForm,
        onEdit: (row) => _showForm(row),
        onDelete: _delete,
        columns: [
          ColDef(key: 'name', label: 'Table'),
          ColDef(key: 'area', label: 'Area'),
          ColDef(
            key: 'capacity',
            label: 'Capacity',
            render: (r) => Text(
              '${asInt(r['capacity'])} seats',
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

class TableQrCodesScreen extends StatefulWidget {
  const TableQrCodesScreen({super.key});

  @override
  State<TableQrCodesScreen> createState() => _TableQrCodesScreenState();
}

class _TableQrCodesScreenState extends State<TableQrCodesScreen> {
  final List<Map<String, dynamic>> _tables = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadTables();
  }

  Future<void> _loadTables() async {
    setState(() => _loading = true);
    try {
      final tables = await AppApi.instance.list('/tables');
      if (!mounted) return;
      setState(() {
        _tables
          ..clear()
          ..addAll(
            tables.map(
              (t) => {
                'id': asInt(t['id']),
                'name': asString(t['name']),
                'area': asString(
                  asMap(t['area'])['name'],
                  fallback: 'Unassigned',
                ),
                'qr_code': asString(t['qr_code']),
              },
            ),
          );
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load QR tables'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _generateQr(Map<String, dynamic> table) async {
    try {
      final response = asMap(
        await ApiClient.instance.get('/tables/${table['id']}/qr-code'),
      );
      final url = asString(
        response['qr_code'],
        fallback: asString(response['url']),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(url.isEmpty ? 'QR generated' : 'QR URL: $url')),
      );
      await _loadTables();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to generate QR'),
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
            'QR Codes',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Scan to place orders at tables',
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
          else
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: _tables
                  .map(
                    (table) => Container(
                      width: 160,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        children: [
                          const Icon(
                            Icons.qr_code_2,
                            size: 72,
                            color: AppColors.foreground,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            asString(table['name']),
                            style: GoogleFonts.getFont(
                              'Google Sans',
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.foreground,
                            ),
                          ),
                          Text(
                            asString(table['area']),
                            style: GoogleFonts.getFont(
                              'Google Sans',
                              fontSize: 11,
                              color: AppColors.mutedFg,
                            ),
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton(
                              onPressed: () => _generateQr(table),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: AppColors.border),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 6,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: Text(
                                'Generate',
                                style: GoogleFonts.getFont(
                                  'Google Sans',
                                  fontSize: 11,
                                  color: AppColors.foreground,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }
}
