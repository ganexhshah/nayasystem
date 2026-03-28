import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

// ── Menu hub (shown on bottom nav "Menu" tab) ─────────────────────────────────
class MenuHubScreen extends StatelessWidget {
  const MenuHubScreen({super.key});

  static const _sections = [
    _MenuSection(
      label: 'Menus',
      subtitle: 'Manage restaurant menus',
      icon: Icons.restaurant_menu_outlined,
      route: '/app/menu/menus',
    ),
    _MenuSection(
      label: 'Menu Items',
      subtitle: 'All food & drink items',
      icon: Icons.list_alt_outlined,
      route: '/app/menu/items',
    ),
    _MenuSection(
      label: 'Item Categories',
      subtitle: 'Organise items by category',
      icon: Icons.label_outline,
      route: '/app/menu/categories',
    ),
    _MenuSection(
      label: 'Modifier Groups',
      subtitle: 'Groups like Size, Toppings',
      icon: Icons.tune_outlined,
      route: '/app/menu/modifier-groups',
    ),
    _MenuSection(
      label: 'Item Modifiers',
      subtitle: 'Individual modifier options',
      icon: Icons.layers_outlined,
      route: '/app/menu/modifiers',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Menu',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Manage your menu sections',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
            ),
          ),
          const SizedBox(height: 20),
          ..._sections.map((s) => _SectionTile(section: s)),
        ],
      ),
    );
  }
}

class _MenuSection {
  final String label, subtitle, route;
  final IconData icon;
  const _MenuSection({
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.route,
  });
}

class _SectionTile extends StatelessWidget {
  final _MenuSection section;
  const _SectionTile({required this.section});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.go(section.route),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.muted,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(section.icon, size: 20, color: AppColors.foreground),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    section.label,
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.foreground,
                    ),
                  ),
                  Text(
                    section.subtitle,
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 12,
                      color: AppColors.mutedFg,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, size: 18, color: AppColors.mutedFg),
          ],
        ),
      ),
    );
  }
}

// ── Menus list screen ─────────────────────────────────────────────────────────
class MenusListScreen extends StatefulWidget {
  const MenusListScreen({super.key});
  @override
  State<MenusListScreen> createState() => _MenusListScreenState();
}

class _MenusListScreenState extends State<MenusListScreen> {
  final List<Map<String, dynamic>> _menus = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadMenus();
  }

  Future<void> _loadMenus() async {
    setState(() => _loading = true);
    try {
      final rows = await AppApi.instance.list('/menus');
      if (!mounted) return;
      setState(() {
        _menus
          ..clear()
          ..addAll(rows.map(_mapMenu));
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load menus'),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Map<String, dynamic> _mapMenu(Map<String, dynamic> raw) {
    final items = raw['items'];
    return {
      'id': asInt(raw['id']),
      'name': asString(raw['name']),
      'description': asString(raw['description']),
      'items_count': items is List ? items.length : asInt(raw['items_count']),
      'is_active': asBool(raw['is_active'], fallback: true),
    };
  }

  void _showForm(BuildContext context, [Map<String, dynamic>? editing]) {
    showDialog(
      context: context,
      builder: (_) => AppFormDialog(
        title: editing != null ? 'Edit Menu' : 'Add Menu',
        initialValues: editing,
        fields: [
          const AppFormField(
            key: 'name',
            label: 'Menu Name',
            hint: 'e.g. Breakfast Menu',
            required: true,
          ),
          const AppFormField(
            key: 'description',
            label: 'Description',
            hint: 'Optional...',
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
        onSubmit: (values) => _saveMenu(values, editing: editing),
      ),
    );
  }

  Future<void> _saveMenu(
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
        await AppApi.instance.create('/menus', payload);
      } else {
        await AppApi.instance.update(
          '/menus/${editing['id']}',
          payload,
          patch: true,
        );
      }
      await _loadMenus();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to save menu'),
          ),
        ),
      );
    }
  }

  Future<void> _deleteMenu(Map<String, dynamic> row) async {
    try {
      await AppApi.instance.remove('/menus/${row['id']}');
      await _loadMenus();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to delete menu'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: 'Menus',
        description: 'Manage your restaurant menus',
        rows: _menus,
        loading: _loading,
        searchKey: 'name',
        onAdd: () => _showForm(context),
        onEdit: (row) => _showForm(context, row),
        onDelete: _deleteMenu,
        columns: [
          ColDef(key: 'name', label: 'Menu Name'),
          ColDef(
            key: 'items_count',
            label: 'Items',
            render: (r) => Text(
              '${r['items_count']} item(s)',
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
