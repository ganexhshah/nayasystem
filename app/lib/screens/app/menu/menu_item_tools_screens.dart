import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../theme/colors.dart';
import '../app_shell.dart';

class MenuItemAddScreen extends StatelessWidget {
  const MenuItemAddScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const _MenuToolsScaffold(
      title: 'Add Menu Item',
      description: 'Use Menu Items page Add button for full create workflow.',
    );
  }
}

class MenuItemsBulkImportScreen extends StatelessWidget {
  const MenuItemsBulkImportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const _MenuToolsScaffold(
      title: 'Bulk Import Menu Items',
      description:
          'Bulk import endpoint is available at /menu-items/bulk-import.',
    );
  }
}

class MenuItemsSortEntitiesScreen extends StatelessWidget {
  const MenuItemsSortEntitiesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const _MenuToolsScaffold(
      title: 'Sort Menu Items',
      description: 'Sorting endpoint is available at /menu-items/sort.',
    );
  }
}

class _MenuToolsScaffold extends StatelessWidget {
  final String title;
  final String description;

  const _MenuToolsScaffold({required this.title, required this.description});

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            description,
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
            ),
          ),
        ],
      ),
    );
  }
}
