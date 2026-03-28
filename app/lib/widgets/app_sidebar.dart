import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/session_store.dart';
import '../theme/colors.dart';
import '../utils/session_identity.dart';

class NavItem {
  final String label;
  final IconData icon;
  final String? href;
  final List<NavChild>? children;

  const NavItem({
    required this.label,
    required this.icon,
    this.href,
    this.children,
  });
}

class NavChild {
  final String label;
  final IconData icon;
  final String href;
  const NavChild({required this.label, required this.icon, required this.href});
}

final List<NavItem> navItems = [
  const NavItem(
    label: 'Dashboard',
    icon: Icons.dashboard_outlined,
    href: '/app/dashboard',
  ),
  NavItem(
    label: 'Menu',
    icon: Icons.restaurant_menu_outlined,
    children: [
      const NavChild(
        label: 'Menus',
        icon: Icons.restaurant_menu_outlined,
        href: '/app/menu/menus',
      ),
      const NavChild(
        label: 'Menu Items',
        icon: Icons.list_outlined,
        href: '/app/menu/items',
      ),
      const NavChild(
        label: 'Add Item',
        icon: Icons.add_box_outlined,
        href: '/app/menu/items/add',
      ),
      const NavChild(
        label: 'Bulk Import',
        icon: Icons.upload_file_outlined,
        href: '/app/menu/items/bulk-import',
      ),
      const NavChild(
        label: 'Sort Items',
        icon: Icons.sort_by_alpha_outlined,
        href: '/app/menu/items/sort-entities',
      ),
      const NavChild(
        label: 'Categories',
        icon: Icons.label_outline,
        href: '/app/menu/categories',
      ),
      const NavChild(
        label: 'Modifier Groups',
        icon: Icons.tune_outlined,
        href: '/app/menu/modifier-groups',
      ),
      const NavChild(
        label: 'Modifiers',
        icon: Icons.layers_outlined,
        href: '/app/menu/modifiers',
      ),
    ],
  ),
  NavItem(
    label: 'Tables',
    icon: Icons.table_restaurant_outlined,
    children: [
      const NavChild(
        label: 'Areas',
        icon: Icons.grid_view_outlined,
        href: '/app/tables/areas',
      ),
      const NavChild(
        label: 'Tables',
        icon: Icons.table_restaurant_outlined,
        href: '/app/tables/list',
      ),
      const NavChild(
        label: 'QR Codes',
        icon: Icons.qr_code_outlined,
        href: '/app/tables/qr-codes',
      ),
    ],
  ),
  NavItem(
    label: 'Kitchens',
    icon: Icons.kitchen_outlined,
    children: [
      const NavChild(
        label: 'Settings',
        icon: Icons.settings_outlined,
        href: '/app/kitchens/settings',
      ),
      const NavChild(
        label: 'Default',
        icon: Icons.ramen_dining_outlined,
        href: '/app/kitchens/default',
      ),
      const NavChild(
        label: 'Veg',
        icon: Icons.eco_outlined,
        href: '/app/kitchens/veg',
      ),
      const NavChild(
        label: 'Non-Veg',
        icon: Icons.set_meal_outlined,
        href: '/app/kitchens/non-veg',
      ),
      const NavChild(
        label: 'All KOT',
        icon: Icons.view_kanban_outlined,
        href: '/app/kitchens/all-kot',
      ),
    ],
  ),
  const NavItem(
    label: 'Waiter Requests',
    icon: Icons.notifications_outlined,
    href: '/app/waiter-requests',
  ),
  const NavItem(
    label: 'Reservations',
    icon: Icons.calendar_today_outlined,
    href: '/app/reservations',
  ),
  const NavItem(
    label: 'POS',
    icon: Icons.point_of_sale_outlined,
    href: '/pos/dine-in',
  ),
  NavItem(
    label: 'Orders',
    icon: Icons.receipt_outlined,
    children: [
      const NavChild(
        label: 'KOT',
        icon: Icons.assignment_outlined,
        href: '/app/orders/kot',
      ),
      const NavChild(
        label: 'Orders',
        icon: Icons.receipt_outlined,
        href: '/app/orders/list',
      ),
    ],
  ),
  const NavItem(
    label: 'Customers',
    icon: Icons.people_outline,
    href: '/app/customers',
  ),
  const NavItem(label: 'Staff', icon: Icons.badge_outlined, href: '/app/staff'),
  NavItem(
    label: 'Expenses',
    icon: Icons.attach_money_outlined,
    children: [
      const NavChild(
        label: 'Expenses',
        icon: Icons.attach_money_outlined,
        href: '/app/expenses/expenses',
      ),
      const NavChild(
        label: 'Categories',
        icon: Icons.folder_outlined,
        href: '/app/expenses/categories',
      ),
    ],
  ),
  NavItem(
    label: 'Payments',
    icon: Icons.credit_card_outlined,
    children: [
      const NavChild(
        label: 'Payments',
        icon: Icons.account_balance_wallet_outlined,
        href: '/app/payments/payments',
      ),
      const NavChild(
        label: 'Due Payments',
        icon: Icons.warning_amber_outlined,
        href: '/app/payments/due-payments',
      ),
    ],
  ),
  NavItem(
    label: 'Reports',
    icon: Icons.bar_chart_outlined,
    children: [
      const NavChild(
        label: 'Sales Report',
        icon: Icons.trending_up_outlined,
        href: '/app/reports/sales',
      ),
      const NavChild(
        label: 'Item Report',
        icon: Icons.inventory_2_outlined,
        href: '/app/reports/items',
      ),
      const NavChild(
        label: 'Category Report',
        icon: Icons.label_outline,
        href: '/app/reports/categories',
      ),
      const NavChild(
        label: 'Tax Report',
        icon: Icons.percent_outlined,
        href: '/app/reports/tax',
      ),
      const NavChild(
        label: 'Expenses Report',
        icon: Icons.money_off_csred_outlined,
        href: '/app/reports/expenses',
      ),
      const NavChild(
        label: 'Payments Report',
        icon: Icons.payments_outlined,
        href: '/app/reports/payments',
      ),
      const NavChild(
        label: 'Due Payments Report',
        icon: Icons.warning_amber_outlined,
        href: '/app/reports/due-payments',
      ),
      const NavChild(
        label: 'Cancelled Report',
        icon: Icons.cancel_outlined,
        href: '/app/reports/cancelled',
      ),
      const NavChild(
        label: 'Refund Report',
        icon: Icons.undo_outlined,
        href: '/app/reports/refund',
      ),
      const NavChild(
        label: 'Delivery Report',
        icon: Icons.local_shipping_outlined,
        href: '/app/reports/delivery',
      ),
      const NavChild(
        label: 'COD Report',
        icon: Icons.payments_outlined,
        href: '/app/reports/cod',
      ),
      const NavChild(
        label: 'Loyalty Report',
        icon: Icons.star_border_outlined,
        href: '/app/reports/loyalty',
      ),
      const NavChild(
        label: 'Removed KOT',
        icon: Icons.remove_circle_outline,
        href: '/app/reports/removed-kot',
      ),
    ],
  ),
  NavItem(
    label: 'Inventory',
    icon: Icons.inventory_2_outlined,
    children: [
      const NavChild(
        label: 'Dashboard',
        icon: Icons.space_dashboard_outlined,
        href: '/app/inventory/dashboard',
      ),
      const NavChild(
        label: 'Item Categories',
        icon: Icons.category_outlined,
        href: '/app/inventory/item-categories',
      ),
      const NavChild(
        label: 'Units',
        icon: Icons.straighten_outlined,
        href: '/app/inventory/units',
      ),
      const NavChild(
        label: 'Items',
        icon: Icons.inventory_outlined,
        href: '/app/inventory/items',
      ),
      const NavChild(
        label: 'Stocks',
        icon: Icons.storage_outlined,
        href: '/app/inventory/stocks',
      ),
      const NavChild(
        label: 'Movements',
        icon: Icons.swap_vert_outlined,
        href: '/app/inventory/movements',
      ),
      const NavChild(
        label: 'Suppliers',
        icon: Icons.local_shipping_outlined,
        href: '/app/inventory/suppliers',
      ),
      const NavChild(
        label: 'Purchase Orders',
        icon: Icons.receipt_long_outlined,
        href: '/app/inventory/purchase-orders',
      ),
      const NavChild(
        label: 'Recipes',
        icon: Icons.menu_book_outlined,
        href: '/app/inventory/recipes',
      ),
      const NavChild(
        label: 'Batch Inventory',
        icon: Icons.layers_outlined,
        href: '/app/inventory/batch-inventory',
      ),
      const NavChild(
        label: 'Batch Reports',
        icon: Icons.assessment_outlined,
        href: '/app/inventory/batch-reports',
      ),
      const NavChild(
        label: 'Batch Recipes',
        icon: Icons.receipt_long_outlined,
        href: '/app/inventory/batch-recipes',
      ),
      const NavChild(
        label: 'Reports',
        icon: Icons.bar_chart_outlined,
        href: '/app/inventory/reports',
      ),
      const NavChild(
        label: 'Settings',
        icon: Icons.settings_outlined,
        href: '/app/inventory/settings',
      ),
    ],
  ),
  NavItem(
    label: 'Cash & Bank',
    icon: Icons.account_balance_outlined,
    children: [
      const NavChild(
        label: 'Cash Account',
        icon: Icons.account_balance_wallet_outlined,
        href: '/app/cash-bank/cash-account',
      ),
      const NavChild(
        label: 'Bank Accounts',
        icon: Icons.account_balance_outlined,
        href: '/app/cash-bank/bank-account',
      ),
      const NavChild(
        label: 'Cheques Management',
        icon: Icons.receipt_long_outlined,
        href: '/app/cash-bank/cheques-management',
      ),
      const NavChild(
        label: 'Cheque Books',
        icon: Icons.book_outlined,
        href: '/app/cash-bank/cheque-books',
      ),
      const NavChild(
        label: 'Cheques',
        icon: Icons.description_outlined,
        href: '/app/cash-bank/cheques',
      ),
      const NavChild(
        label: 'Balance Transfer',
        icon: Icons.swap_horiz_outlined,
        href: '/app/cash-bank/balance-transfer',
      ),
    ],
  ),
  const NavItem(
    label: 'Website',
    icon: Icons.language_outlined,
    href: '/app/website',
  ),
  const NavItem(
    label: 'Subscription',
    icon: Icons.workspace_premium_outlined,
    href: '/app/subscription',
  ),
  const NavItem(
    label: 'Profile',
    icon: Icons.person_outline,
    href: '/app/profile',
  ),
  const NavItem(
    label: 'Support',
    icon: Icons.support_agent_outlined,
    href: '/app/support',
  ),
  const NavItem(
    label: 'Settings',
    icon: Icons.settings_outlined,
    href: '/app/settings',
  ),
];

class AppSidebar extends StatefulWidget {
  const AppSidebar({super.key});

  @override
  State<AppSidebar> createState() => _AppSidebarState();
}

class _AppSidebarState extends State<AppSidebar> {
  final Set<String> _expanded = {};

  @override
  Widget build(BuildContext context) {
    String location = '/app/dashboard';
    try {
      location = GoRouterState.of(context).uri.toString();
    } catch (_) {}
    final user = SessionStore.instance.user;
    final userName = sessionUserName(user);
    final userInitial = sessionUserInitial(user);
    final restaurantName = sessionRestaurantName(user);
    final restaurantSubtitle = sessionRestaurantSubtitle(user);

    return Container(
      width: 240,
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(right: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        children: [
          // Brand
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.muted,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Icon(
                    Icons.storefront_outlined,
                    size: 18,
                    color: AppColors.mutedFg,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        restaurantName,
                        style: GoogleFonts.getFont(
                          'Google Sans',
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.foreground,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        restaurantSubtitle,
                        style: GoogleFonts.getFont(
                          'Google Sans',
                          fontSize: 11,
                          color: AppColors.mutedFg,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Nav
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              children: navItems.map((item) {
                if (item.children != null) {
                  return _NavGroup(
                    item: item,
                    currentPath: location,
                    expanded: _expanded.contains(item.label),
                    onToggle: () => setState(() {
                      if (_expanded.contains(item.label)) {
                        _expanded.remove(item.label);
                      } else {
                        _expanded.add(item.label);
                      }
                    }),
                  );
                }
                final active = location == item.href;
                return _NavLink(
                  label: item.label,
                  icon: item.icon,
                  href: item.href!,
                  active: active,
                );
              }).toList(),
            ),
          ),

          // User
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 14,
                  backgroundColor: AppColors.primary,
                  child: Text(
                    userInitial,
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 11,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    userName,
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 13,
                      color: AppColors.mutedFg,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NavLink extends StatelessWidget {
  final String label;
  final IconData icon;
  final String href;
  final bool active;

  const _NavLink({
    required this.label,
    required this.icon,
    required this.href,
    required this.active,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.go(href),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: active ? Colors.white : AppColors.mutedFg,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.getFont(
                  'Google Sans',
                  fontSize: 13,
                  fontWeight: active ? FontWeight.w500 : FontWeight.w400,
                  color: active ? Colors.white : AppColors.mutedFg,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavGroup extends StatelessWidget {
  final NavItem item;
  final String currentPath;
  final bool expanded;
  final VoidCallback onToggle;

  const _NavGroup({
    required this.item,
    required this.currentPath,
    required this.expanded,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final anyActive = item.children!.any((c) => currentPath.startsWith(c.href));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: onToggle,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
            decoration: BoxDecoration(
              color: anyActive ? AppColors.muted : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  item.icon,
                  size: 16,
                  color: anyActive ? AppColors.foreground : AppColors.mutedFg,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item.label,
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 13,
                      fontWeight: anyActive ? FontWeight.w500 : FontWeight.w400,
                      color: anyActive
                          ? AppColors.foreground
                          : AppColors.mutedFg,
                    ),
                  ),
                ),
                Icon(
                  expanded
                      ? Icons.keyboard_arrow_down
                      : Icons.keyboard_arrow_right,
                  size: 16,
                  color: AppColors.mutedFg,
                ),
              ],
            ),
          ),
        ),
        if (expanded)
          Padding(
            padding: const EdgeInsets.only(left: 16),
            child: Container(
              margin: const EdgeInsets.only(left: 8),
              decoration: const BoxDecoration(
                border: Border(left: BorderSide(color: AppColors.border)),
              ),
              child: Column(
                children: item.children!.map((child) {
                  final active = currentPath == child.href;
                  return InkWell(
                    onTap: () => context.go(child.href),
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 7,
                      ),
                      margin: const EdgeInsets.only(left: 4),
                      decoration: BoxDecoration(
                        color: active ? AppColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            child.icon,
                            size: 14,
                            color: active ? Colors.white : AppColors.mutedFg,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              child.label,
                              style: GoogleFonts.getFont(
                                'Google Sans',
                                fontSize: 12,
                                fontWeight: active
                                    ? FontWeight.w500
                                    : FontWeight.w400,
                                color: active
                                    ? Colors.white
                                    : AppColors.mutedFg,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
      ],
    );
  }
}
