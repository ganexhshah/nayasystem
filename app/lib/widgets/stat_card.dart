import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/colors.dart';

class StatCard extends StatelessWidget {
  final String title;
  final String value;
  final String? prefix;
  final String changeLabel;
  final IconData icon;

  const StatCard({
    super.key,
    required this.title,
    required this.value,
    this.prefix,
    required this.changeLabel,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 12,
                    color: AppColors.mutedFg,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Icon(icon, size: 16, color: AppColors.mutedFg),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            '${prefix ?? ''}$value',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            changeLabel,
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 11,
              color: AppColors.mutedFg,
            ),
          ),
        ],
      ),
    );
  }
}
