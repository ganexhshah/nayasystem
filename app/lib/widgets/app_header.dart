import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/session_store.dart';
import '../theme/colors.dart';
import '../utils/session_identity.dart';

class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  const AppHeader({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dateStr = _formatDate(now);
    final timeStr = _formatTime(now);
    final user = SessionStore.instance.user;
    final userName = sessionUserName(user);
    final restaurantName = sessionRestaurantName(user);
    final userInitial = sessionUserInitial(user);

    return Container(
      height: 56,
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          // Date/time
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                dateStr,
                style: GoogleFonts.getFont(
                  'Google Sans',
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.foreground,
                ),
              ),
              Text(
                timeStr,
                style: GoogleFonts.getFont(
                  'Google Sans',
                  fontSize: 11,
                  color: AppColors.mutedFg,
                ),
              ),
            ],
          ),

          const Spacer(),

          // Actions
          _iconBtn(
            Icons.shopping_cart_outlined,
            'Orders',
            () => context.go('/app/orders/list'),
          ),
          _iconBtn(Icons.monitor_outlined, 'POS', () => context.go('/app/pos')),
          _iconBtn(Icons.notifications_outlined, 'Notifications', () {}),

          const SizedBox(width: 8),
          const VerticalDivider(width: 1, color: AppColors.border),
          const SizedBox(width: 12),

          // User avatar
          GestureDetector(
            onTap: () {},
            child: Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: AppColors.primary,
                  child: Text(
                    userInitial,
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      userName,
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.foreground,
                      ),
                    ),
                    Text(
                      restaurantName,
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 11,
                        color: AppColors.mutedFg,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _iconBtn(IconData icon, String tooltip, VoidCallback onTap) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(icon, size: 18, color: AppColors.mutedFg),
        ),
      ),
    );
  }

  String _formatDate(DateTime d) {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return '${days[d.weekday - 1]}, ${d.day.toString().padLeft(2, '0')}/${(d.month).toString().padLeft(2, '0')}/${d.year}';
  }

  String _formatTime(DateTime d) {
    final h = d.hour.toString().padLeft(2, '0');
    final m = d.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
