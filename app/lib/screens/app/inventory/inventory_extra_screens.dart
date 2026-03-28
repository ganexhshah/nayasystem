import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../theme/colors.dart';
import 'inventory_screens.dart';
import '../app_shell.dart';

class InventoryBatchRecipesScreen extends StatelessWidget {
  const InventoryBatchRecipesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const InventoryRecipesScreen();
  }
}

class InventoryReportsScreen extends StatelessWidget {
  const InventoryReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const InventoryBatchReportsScreen();
  }
}

class InventorySettingsScreen extends StatelessWidget {
  const InventorySettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Inventory Settings',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Inventory configuration options.',
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
