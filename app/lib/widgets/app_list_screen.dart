import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/colors.dart';

/// Reusable list screen with search, add button, and rows
class AppListScreen extends StatefulWidget {
  final String title;
  final String? description;
  final List<Map<String, dynamic>> rows;
  final List<ColDef> columns;
  final bool loading;
  final VoidCallback? onAdd;
  final void Function(Map<String, dynamic> row)? onEdit;
  final void Function(Map<String, dynamic> row)? onDelete;
  final String searchKey;

  const AppListScreen({
    super.key,
    required this.title,
    this.description,
    required this.rows,
    required this.columns,
    this.loading = false,
    this.onAdd,
    this.onEdit,
    this.onDelete,
    this.searchKey = 'name',
  });

  @override
  State<AppListScreen> createState() => _AppListScreenState();
}

class ColDef {
  final String key;
  final String label;
  final Widget Function(Map<String, dynamic>)? render;
  const ColDef({required this.key, required this.label, this.render});
}

class _AppListScreenState extends State<AppListScreen> {
  String _query = '';

  List<Map<String, dynamic>> get _filtered {
    if (_query.isEmpty) return widget.rows;
    return widget.rows.where((r) {
      final val = r[widget.searchKey]?.toString().toLowerCase() ?? '';
      return val.contains(_query.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Row(
          children: [
            Expanded(
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
                  if (widget.description != null)
                    Text(
                      widget.description!,
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 13,
                        color: AppColors.mutedFg,
                      ),
                    ),
                ],
              ),
            ),
            if (widget.onAdd != null)
              ElevatedButton.icon(
                onPressed: widget.onAdd,
                icon: const Icon(Icons.add, size: 16),
                label: Text(
                  'Add',
                  style: GoogleFonts.getFont('Google Sans', fontSize: 13),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
          ],
        ),

        const SizedBox(height: 16),

        // Search
        TextField(
          onChanged: (v) => setState(() => _query = v),
          style: GoogleFonts.getFont(
            'Google Sans',
            fontSize: 14,
            color: AppColors.foreground,
          ),
          decoration: InputDecoration(
            hintText: 'Search...',
            hintStyle: GoogleFonts.getFont(
              'Google Sans',
              color: AppColors.mutedFg,
              fontSize: 14,
            ),
            prefixIcon: const Icon(
              Icons.search,
              size: 18,
              color: AppColors.mutedFg,
            ),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 10,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.ring, width: 1.5),
            ),
          ),
        ),

        const SizedBox(height: 12),

        // Table
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border),
          ),
          child: widget.loading
              ? const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.primary,
                    ),
                  ),
                )
              : _filtered.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(40),
                  child: Center(
                    child: Text(
                      'No records found.',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 13,
                        color: AppColors.mutedFg,
                      ),
                    ),
                  ),
                )
              : Column(
                  children: [
                    // Header row
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      decoration: const BoxDecoration(
                        color: Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(10),
                          topRight: Radius.circular(10),
                        ),
                        border: Border(
                          bottom: BorderSide(color: AppColors.border),
                        ),
                      ),
                      child: Row(
                        children: [
                          ...widget.columns.map(
                            (c) => Expanded(
                              child: Text(
                                c.label,
                                style: GoogleFonts.getFont(
                                  'Google Sans',
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.mutedFg,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 72), // actions column
                        ],
                      ),
                    ),
                    // Data rows
                    ...List.generate(_filtered.length, (i) {
                      final row = _filtered[i];
                      return Container(
                        decoration: BoxDecoration(
                          border: i < _filtered.length - 1
                              ? const Border(
                                  bottom: BorderSide(color: AppColors.border),
                                )
                              : null,
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        child: Row(
                          children: [
                            ...widget.columns.map(
                              (c) => Expanded(
                                child: c.render != null
                                    ? c.render!(row)
                                    : Text(
                                        row[c.key]?.toString() ?? '—',
                                        style: GoogleFonts.getFont(
                                          'Google Sans',
                                          fontSize: 13,
                                          color: AppColors.foreground,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                              ),
                            ),
                            SizedBox(
                              width: 72,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  if (widget.onEdit != null)
                                    InkWell(
                                      onTap: () => widget.onEdit!(row),
                                      borderRadius: BorderRadius.circular(6),
                                      child: const Padding(
                                        padding: EdgeInsets.all(6),
                                        child: Icon(
                                          Icons.edit_outlined,
                                          size: 16,
                                          color: AppColors.mutedFg,
                                        ),
                                      ),
                                    ),
                                  if (widget.onDelete != null)
                                    InkWell(
                                      onTap: () => _confirmDelete(context, row),
                                      borderRadius: BorderRadius.circular(6),
                                      child: const Padding(
                                        padding: EdgeInsets.all(6),
                                        child: Icon(
                                          Icons.delete_outline,
                                          size: 16,
                                          color: AppColors.destructive,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
        ),

        const SizedBox(height: 8),
        Text(
          '${_filtered.length} record${_filtered.length != 1 ? 's' : ''}',
          style: GoogleFonts.getFont(
            'Google Sans',
            fontSize: 11,
            color: AppColors.mutedFg,
          ),
        ),
      ],
    );
  }

  void _confirmDelete(BuildContext context, Map<String, dynamic> row) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(
          'Delete',
          style: GoogleFonts.getFont(
            'Google Sans',
            fontWeight: FontWeight.w600,
          ),
        ),
        content: Text(
          'Are you sure you want to delete this record?',
          style: GoogleFonts.getFont('Google Sans', fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: GoogleFonts.getFont(
                'Google Sans',
                color: AppColors.mutedFg,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              widget.onDelete!(row);
            },
            child: Text(
              'Delete',
              style: GoogleFonts.getFont(
                'Google Sans',
                color: AppColors.destructive,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Status badge widget ───────────────────────────────────────────────────────
class StatusBadge extends StatelessWidget {
  final bool active;
  final String? trueLabel;
  final String? falseLabel;

  const StatusBadge({
    super.key,
    required this.active,
    this.trueLabel,
    this.falseLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: active ? const Color(0xFFECFDF5) : AppColors.muted,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: active ? const Color(0xFF10B981) : AppColors.border,
        ),
      ),
      child: Text(
        active ? (trueLabel ?? 'Active') : (falseLabel ?? 'Inactive'),
        style: GoogleFonts.getFont(
          'Google Sans',
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: active ? const Color(0xFF065F46) : AppColors.mutedFg,
        ),
      ),
    );
  }
}

// ── Simple form dialog ────────────────────────────────────────────────────────
class AppFormDialog extends StatefulWidget {
  final String title;
  final List<AppFormField> fields;
  final Map<String, dynamic>? initialValues;
  final void Function(Map<String, dynamic>) onSubmit;

  const AppFormDialog({
    super.key,
    required this.title,
    required this.fields,
    this.initialValues,
    required this.onSubmit,
  });

  @override
  State<AppFormDialog> createState() => _AppFormDialogState();
}

class AppFormField {
  final String key;
  final String label;
  final String? hint;
  final bool required;
  final AppFormFieldType type;
  final List<MapEntry<String, String>>? options; // value -> label

  const AppFormField({
    required this.key,
    required this.label,
    this.hint,
    this.required = false,
    this.type = AppFormFieldType.text,
    this.options,
  });
}

enum AppFormFieldType { text, number, textarea, select, toggle }

class _AppFormDialogState extends State<AppFormDialog> {
  late Map<String, dynamic> _values;

  @override
  void initState() {
    super.initState();
    _values = {};
    for (final f in widget.fields) {
      _values[f.key] =
          widget.initialValues?[f.key] ??
          (f.type == AppFormFieldType.toggle ? false : '');
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        widget.title,
        style: GoogleFonts.getFont(
          'Google Sans',
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
      content: SizedBox(
        width: 360,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: widget.fields
                .map(
                  (f) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _buildField(f),
                  ),
                )
                .toList(),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(
            'Cancel',
            style: GoogleFonts.getFont('Google Sans', color: AppColors.mutedFg),
          ),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.pop(context);
            widget.onSubmit(_values);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: Text(
            'Save',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildField(AppFormField f) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          f.label,
          style: GoogleFonts.getFont(
            'Google Sans',
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: AppColors.foreground,
          ),
        ),
        const SizedBox(height: 6),
        if (f.type == AppFormFieldType.toggle)
          Row(
            children: [
              Switch(
                value: _values[f.key] == true,
                onChanged: (v) => setState(() => _values[f.key] = v),
                activeThumbColor: AppColors.primary,
              ),
              const SizedBox(width: 8),
              Text(
                _values[f.key] == true ? 'Yes' : 'No',
                style: GoogleFonts.getFont(
                  'Google Sans',
                  fontSize: 13,
                  color: AppColors.mutedFg,
                ),
              ),
            ],
          )
        else if (f.type == AppFormFieldType.select && f.options != null)
          DropdownButtonFormField<String>(
            initialValue: _values[f.key]?.toString().isNotEmpty == true
                ? _values[f.key].toString()
                : null,
            hint: Text(
              f.hint ?? 'Select...',
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 14,
                color: AppColors.mutedFg,
              ),
            ),
            decoration: _inputDec(),
            items: f.options!
                .map(
                  (e) => DropdownMenuItem(
                    value: e.key,
                    child: Text(
                      e.value,
                      style: GoogleFonts.getFont('Google Sans', fontSize: 14),
                    ),
                  ),
                )
                .toList(),
            onChanged: (v) => setState(() => _values[f.key] = v ?? ''),
          )
        else
          TextFormField(
            initialValue: _values[f.key]?.toString() ?? '',
            keyboardType: f.type == AppFormFieldType.number
                ? TextInputType.number
                : TextInputType.text,
            maxLines: f.type == AppFormFieldType.textarea ? 3 : 1,
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 14,
              color: AppColors.foreground,
            ),
            decoration: _inputDec(hint: f.hint),
            onChanged: (v) => _values[f.key] = v,
          ),
      ],
    );
  }

  InputDecoration _inputDec({String? hint}) => InputDecoration(
    hintText: hint,
    hintStyle: GoogleFonts.getFont(
      'Google Sans',
      color: AppColors.mutedFg,
      fontSize: 14,
    ),
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: AppColors.ring, width: 1.5),
    ),
  );
}
