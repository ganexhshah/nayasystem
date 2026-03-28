import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/app_api.dart';
import '../../services/session_store.dart';
import '../../theme/colors.dart';
import '../../utils/session_identity.dart';
import '../../widgets/app_sidebar.dart';
import '../../widgets/app_header.dart';
import 'dashboard/dashboard_screen.dart';
import 'orders/orders_screen.dart';
import 'tables/tables_screen.dart';
import 'menu/menu_screen.dart';
import 'settings/settings_screen.dart';

// Bottom nav tabs
const _bottomTabs = [
  _Tab(
    label: 'Dashboard',
    icon: Icons.dashboard_outlined,
    activeIcon: Icons.dashboard,
  ),
  _Tab(
    label: 'Orders',
    icon: Icons.receipt_outlined,
    activeIcon: Icons.receipt,
  ),
  _Tab(
    label: 'Menu',
    icon: Icons.restaurant_menu_outlined,
    activeIcon: Icons.restaurant_menu,
  ),
  _Tab(
    label: 'Tables',
    icon: Icons.table_restaurant_outlined,
    activeIcon: Icons.table_restaurant,
  ),
  _Tab(label: 'More', icon: Icons.menu_outlined, activeIcon: Icons.menu),
];

class _Tab {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  const _Tab({
    required this.label,
    required this.icon,
    required this.activeIcon,
  });
}

class AppShell extends StatefulWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _tabIndex = 0;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 600;
    if (isMobile) {
      // If a specific child was passed (not the default hub), show it with mobile chrome
      final isHub = widget.child is DashboardContent;
      if (!isHub) {
        return _MobilePageShell(child: widget.child);
      }
      return _MobileShell(
        tabIndex: _tabIndex,
        onTabChanged: (i) => setState(() => _tabIndex = i),
      );
    }
    return _DesktopShell(child: widget.child);
  }
}

// ── Mobile page shell (for sub-pages navigated via router) ───────────────────
class _MobilePageShell extends StatelessWidget {
  final Widget child;
  const _MobilePageShell({required this.child});

  @override
  Widget build(BuildContext context) {
    final userInitial = sessionUserInitial(SessionStore.instance.user);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back,
            color: AppColors.foreground,
            size: 22,
          ),
          onPressed: () => context.go('/app/dashboard'),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: CircleAvatar(
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
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: child,
      ),
    );
  }
}

// ── Mobile shell ──────────────────────────────────────────────────────────────
class _MobileShell extends StatelessWidget {
  final int tabIndex;
  final ValueChanged<int> onTabChanged;

  static final _screens = [
    const DashboardContent(),
    const OrdersListScreen(),
    const MenuHubScreen(),
    const TablesListScreen(),
    const SettingsScreen(),
  ];

  const _MobileShell({required this.tabIndex, required this.onTabChanged});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: _MobileAppBar(title: _bottomTabs[tabIndex].label),
      drawer: _MobileDrawer(),
      body: IndexedStack(index: tabIndex, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tabIndex,
        onDestinationSelected: (i) {
          if (i == 4) {
            Scaffold.of(context).openDrawer();
          } else {
            onTabChanged(i);
          }
        },
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shadowColor: AppColors.border,
        elevation: 1,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: _bottomTabs
            .map(
              (t) => NavigationDestination(
                icon: Icon(t.icon),
                selectedIcon: Icon(t.activeIcon),
                label: t.label,
              ),
            )
            .toList(),
      ),
    );
  }
}

// ── Mobile AppBar ─────────────────────────────────────────────────────────────
class _MobileAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  const _MobileAppBar({required this.title});

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    final userInitial = sessionUserInitial(SessionStore.instance.user);

    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: AppColors.border),
      ),
      leading: Builder(
        builder: (ctx) => IconButton(
          icon: const Icon(Icons.menu, color: AppColors.foreground, size: 22),
          onPressed: () => Scaffold.of(ctx).openDrawer(),
        ),
      ),
      title: Text(
        title,
        style: GoogleFonts.getFont(
          'Google Sans',
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: AppColors.foreground,
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(
            Icons.notifications_outlined,
            color: AppColors.mutedFg,
            size: 22,
          ),
          onPressed: () {},
        ),
        Padding(
          padding: const EdgeInsets.only(right: 12),
          child: CircleAvatar(
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
        ),
      ],
    );
  }
}

// ── Mobile Drawer (full nav) ──────────────────────────────────────────────────
class _MobileDrawer extends StatefulWidget {
  @override
  State<_MobileDrawer> createState() => _MobileDrawerState();
}

class _MobileDrawerState extends State<_MobileDrawer> {
  final Set<String> _expanded = {};

  Future<void> _logout() async {
    await AppApi.instance.logout();
    if (!mounted) return;
    context.go('/auth/login');
  }

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

    return Drawer(
      backgroundColor: Colors.white,
      child: Column(
        children: [
          // Header
          Container(
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 16,
              left: 16,
              right: 16,
              bottom: 16,
            ),
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
                          fontSize: 14,
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
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(
                    Icons.close,
                    size: 20,
                    color: AppColors.mutedFg,
                  ),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          // Nav list
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              children: navItems.map((item) {
                if (item.children != null) {
                  return _DrawerGroup(
                    item: item,
                    currentPath: location,
                    expanded: _expanded.contains(item.label),
                    onToggle: () => setState(() {
                      _expanded.contains(item.label)
                          ? _expanded.remove(item.label)
                          : _expanded.add(item.label);
                    }),
                    onNavigate: () => Navigator.of(context).pop(),
                  );
                }
                final active = location == item.href;
                return _DrawerLink(
                  label: item.label,
                  icon: item.icon,
                  href: item.href!,
                  active: active,
                  onNavigate: () => Navigator.of(context).pop(),
                );
              }).toList(),
            ),
          ),

          // User footer
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
                  ),
                ),
                IconButton(
                  icon: const Icon(
                    Icons.logout,
                    size: 18,
                    color: AppColors.mutedFg,
                  ),
                  onPressed: _logout,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DrawerLink extends StatelessWidget {
  final String label;
  final IconData icon;
  final String href;
  final bool active;
  final VoidCallback onNavigate;

  const _DrawerLink({
    required this.label,
    required this.icon,
    required this.href,
    required this.active,
    required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        onNavigate();
        context.go(href);
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 18,
              color: active ? Colors.white : AppColors.mutedFg,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.getFont(
                  'Google Sans',
                  fontSize: 14,
                  fontWeight: active ? FontWeight.w500 : FontWeight.w400,
                  color: active ? Colors.white : AppColors.foreground,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerGroup extends StatelessWidget {
  final NavItem item;
  final String currentPath;
  final bool expanded;
  final VoidCallback onToggle;
  final VoidCallback onNavigate;

  const _DrawerGroup({
    required this.item,
    required this.currentPath,
    required this.expanded,
    required this.onToggle,
    required this.onNavigate,
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
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            decoration: BoxDecoration(
              color: anyActive ? AppColors.muted : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  item.icon,
                  size: 18,
                  color: anyActive ? AppColors.foreground : AppColors.mutedFg,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item.label,
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 14,
                      fontWeight: anyActive ? FontWeight.w500 : FontWeight.w400,
                      color: anyActive
                          ? AppColors.foreground
                          : AppColors.foreground,
                    ),
                  ),
                ),
                Icon(
                  expanded
                      ? Icons.keyboard_arrow_down
                      : Icons.keyboard_arrow_right,
                  size: 18,
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
                    onTap: () {
                      onNavigate();
                      context.go(child.href);
                    },
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 9,
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
                            size: 15,
                            color: active ? Colors.white : AppColors.mutedFg,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              child.label,
                              style: GoogleFonts.getFont(
                                'Google Sans',
                                fontSize: 13,
                                fontWeight: active
                                    ? FontWeight.w500
                                    : FontWeight.w400,
                                color: active
                                    ? Colors.white
                                    : AppColors.foreground,
                              ),
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

// ── Desktop shell ─────────────────────────────────────────────────────────────
class _DesktopShell extends StatelessWidget {
  final Widget child;
  const _DesktopShell({required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: Row(
        children: [
          const AppSidebar(),
          Expanded(
            child: Column(
              children: [
                const AppHeader(),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: child,
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
