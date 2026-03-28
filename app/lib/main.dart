import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/app_api.dart';
import 'services/session_store.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/onboard/onboard_screen.dart';
import 'screens/app/dashboard/dashboard_screen.dart';
import 'screens/app/menu/menu_screen.dart';
import 'screens/app/menu/menu_categories_screen.dart';
import 'screens/app/menu/menu_items_screen.dart';
import 'screens/app/menu/menu_item_tools_screens.dart';
import 'screens/app/menu/modifier_groups_screen.dart';
import 'screens/app/menu/modifiers_screen.dart';
import 'screens/app/customers/customers_screen.dart';
import 'screens/app/delivery/delivery_screen.dart';
import 'screens/app/kitchens/kitchens_screen.dart';
import 'screens/app/tables/tables_screen.dart';
import 'screens/app/orders/orders_screen.dart';
import 'screens/app/orders/order_detail_screen.dart';
import 'screens/app/staff/staff_screen.dart';
import 'screens/app/expenses/expenses_screen.dart';
import 'screens/app/payments/payments_screen.dart';
import 'screens/app/reports/reports_screen.dart';
import 'screens/app/settings/settings_screen.dart';
import 'screens/app/pos/pos_screen.dart';
import 'screens/app/inventory/inventory_screens.dart';
import 'screens/app/inventory/inventory_extra_screens.dart';
import 'screens/app/cash_bank/cash_bank_screens.dart';
import 'screens/app/business/business_screens.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppApi.instance.initializeSession();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const NayaSystemApp());
}

final _router = GoRouter(
  initialLocation: SessionStore.instance.isAuthenticated
      ? '/app/dashboard'
      : '/auth/login',
  redirect: (context, state) {
    final loggedIn = SessionStore.instance.isAuthenticated;
    final path = state.uri.path;
    final isAuthPath = path.startsWith('/auth');
    final isAppPath = path.startsWith('/app') || path.startsWith('/pos');

    if (!loggedIn && isAppPath) {
      return '/auth/login';
    }
    if (loggedIn && isAuthPath) {
      return '/app/dashboard';
    }
    return null;
  },
  routes: [
    GoRoute(
      path: '/auth/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/auth/signup',
      builder: (context, state) => const SignupScreen(),
    ),
    GoRoute(
      path: '/auth/forgot-password',
      builder: (context, state) => const ForgotPasswordScreen(),
    ),
    GoRoute(
      path: '/auth/reset-password',
      builder: (context, state) => const ResetPasswordScreen(),
    ),
    GoRoute(
      path: '/onboard',
      builder: (context, state) => const OnboardScreen(),
    ),
    GoRoute(path: '/pos', builder: (context, state) => const PosScreen()),
    GoRoute(
      path: '/pos/dine-in',
      builder: (context, state) => const PosScreen(),
    ),
    GoRoute(path: '/app/pos', builder: (context, state) => const PosScreen()),
    GoRoute(
      path: '/app/pos/:orderType',
      builder: (context, state) => PosOrderTypeScreen(
        orderType: state.pathParameters['orderType'] ?? 'dine-in',
      ),
    ),
    GoRoute(
      path: '/app/pos/:orderType/checkout',
      builder: (context, state) => PosCheckoutScreen(
        orderType: state.pathParameters['orderType'] ?? 'dine-in',
      ),
    ),
    GoRoute(
      path: '/app/dashboard',
      builder: (context, state) => const DashboardScreen(),
    ),
    GoRoute(
      path: '/app/menu/menus',
      builder: (context, state) => const MenusListScreen(),
    ),
    GoRoute(
      path: '/app/menu/categories',
      builder: (context, state) => const MenuCategoriesScreen(),
    ),
    GoRoute(
      path: '/app/menu/items',
      builder: (context, state) => const MenuItemsScreen(),
    ),
    GoRoute(
      path: '/app/menu/items/add',
      builder: (context, state) => const MenuItemAddScreen(),
    ),
    GoRoute(
      path: '/app/menu/items/bulk-import',
      builder: (context, state) => const MenuItemsBulkImportScreen(),
    ),
    GoRoute(
      path: '/app/menu/items/sort-entities',
      builder: (context, state) => const MenuItemsSortEntitiesScreen(),
    ),
    GoRoute(
      path: '/app/menu/modifier-groups',
      builder: (context, state) => const ModifierGroupsScreen(),
    ),
    GoRoute(
      path: '/app/menu/modifiers',
      builder: (context, state) => const ModifiersScreen(),
    ),
    GoRoute(
      path: '/app/customers',
      builder: (context, state) => const CustomersScreen(),
    ),
    GoRoute(
      path: '/app/delivery',
      builder: (context, state) => const DeliveryScreen(),
    ),
    GoRoute(
      path: '/app/kitchens/settings',
      builder: (context, state) => const KitchenSettingsScreen(),
    ),
    GoRoute(
      path: '/app/kitchens/veg',
      builder: (context, state) =>
          const KotBoardScreen(title: 'Veg Kitchen KOT', kitchenType: 'veg'),
    ),
    GoRoute(
      path: '/app/kitchens/non-veg',
      builder: (context, state) => const KotBoardScreen(
        title: 'Non-Veg Kitchen KOT',
        kitchenType: 'non_veg',
      ),
    ),
    GoRoute(
      path: '/app/kitchens/all-kot',
      builder: (context, state) =>
          const KotBoardScreen(title: 'All Kitchen KOT'),
    ),
    GoRoute(
      path: '/app/kitchens/default',
      builder: (context, state) => const KotBoardScreen(
        title: 'Default Kitchen KOT',
        kitchenType: 'default',
      ),
    ),
    // Tables
    GoRoute(
      path: '/app/tables/areas',
      builder: (context, state) => const TableAreasScreen(),
    ),
    GoRoute(
      path: '/app/tables/list',
      builder: (context, state) => const TablesListScreen(),
    ),
    GoRoute(
      path: '/app/tables/qr-codes',
      builder: (context, state) => const TableQrCodesScreen(),
    ),
    // Orders
    GoRoute(
      path: '/app/orders/list',
      builder: (context, state) => const OrdersListScreen(),
    ),
    GoRoute(
      path: '/app/orders/list/:id',
      builder: (context, state) =>
          OrderDetailScreen(orderId: state.pathParameters['id'] ?? '0'),
    ),
    GoRoute(
      path: '/app/orders/kot',
      builder: (context, state) => const OrdersKotScreen(),
    ),
    GoRoute(
      path: '/app/waiter-requests',
      builder: (context, state) => const WaiterRequestsScreen(),
    ),
    GoRoute(
      path: '/app/reservations',
      builder: (context, state) => const ReservationsScreen(),
    ),
    // Staff
    GoRoute(
      path: '/app/staff',
      builder: (context, state) => const StaffScreen(),
    ),
    // Expenses
    GoRoute(
      path: '/app/expenses/expenses',
      builder: (context, state) => const ExpensesScreen(),
    ),
    GoRoute(
      path: '/app/expenses/categories',
      builder: (context, state) => const ExpenseCategoriesScreen(),
    ),
    // Payments
    GoRoute(
      path: '/app/payments/payments',
      builder: (context, state) => const PaymentsScreen(),
    ),
    GoRoute(
      path: '/app/payments/due-payments',
      builder: (context, state) => const DuePaymentsScreen(),
    ),
    // Reports
    GoRoute(
      path: '/app/reports/sales',
      builder: (context, state) => const SalesReportScreen(),
    ),
    GoRoute(
      path: '/app/reports/items',
      builder: (context, state) => const ItemReportScreen(),
    ),
    GoRoute(
      path: '/app/reports/categories',
      builder: (context, state) => const CategoryReportScreen(),
    ),
    GoRoute(
      path: '/app/reports/tax',
      builder: (context, state) => const TaxReportScreen(),
    ),
    GoRoute(
      path: '/app/reports/expenses',
      builder: (context, state) => const ExpensesReportScreen(),
    ),
    GoRoute(
      path: '/app/reports/payments',
      builder: (context, state) => const PaymentsReportScreen(),
    ),
    GoRoute(
      path: '/app/reports/due-payments',
      builder: (context, state) => const DuePaymentsReportScreen(),
    ),
    GoRoute(
      path: '/app/reports/cancelled',
      builder: (context, state) => const CancelledReportScreen(),
    ),
    GoRoute(
      path: '/app/reports/refund',
      builder: (context, state) => const RefundReportScreen(),
    ),
    GoRoute(
      path: '/app/reports/delivery',
      builder: (context, state) => const DeliveryReportScreen(),
    ),
    GoRoute(
      path: '/app/reports/cod',
      builder: (context, state) => const CodReportScreen(),
    ),
    GoRoute(
      path: '/app/reports/loyalty',
      builder: (context, state) => const LoyaltyReportScreen(),
    ),
    GoRoute(
      path: '/app/reports/removed-kot',
      builder: (context, state) => const RemovedKotReportScreen(),
    ),
    // Inventory
    GoRoute(
      path: '/app/inventory/dashboard',
      builder: (context, state) => const InventoryDashboardScreen(),
    ),
    GoRoute(
      path: '/app/inventory/item-categories',
      builder: (context, state) => const InventoryCategoriesScreen(),
    ),
    GoRoute(
      path: '/app/inventory/units',
      builder: (context, state) => const InventoryUnitsScreen(),
    ),
    GoRoute(
      path: '/app/inventory/items',
      builder: (context, state) => const InventoryItemsScreen(),
    ),
    GoRoute(
      path: '/app/inventory/stocks',
      builder: (context, state) => const InventoryStocksScreen(),
    ),
    GoRoute(
      path: '/app/inventory/movements',
      builder: (context, state) => const InventoryMovementsScreen(),
    ),
    GoRoute(
      path: '/app/inventory/suppliers',
      builder: (context, state) => const InventorySuppliersScreen(),
    ),
    GoRoute(
      path: '/app/inventory/purchase-orders',
      builder: (context, state) => const InventoryPurchaseOrdersScreen(),
    ),
    GoRoute(
      path: '/app/inventory/recipes',
      builder: (context, state) => const InventoryRecipesScreen(),
    ),
    GoRoute(
      path: '/app/inventory/batch-inventory',
      builder: (context, state) => const InventoryBatchInventoryScreen(),
    ),
    GoRoute(
      path: '/app/inventory/batch-reports',
      builder: (context, state) => const InventoryBatchReportsScreen(),
    ),
    GoRoute(
      path: '/app/inventory/batch-recipes',
      builder: (context, state) => const InventoryBatchRecipesScreen(),
    ),
    GoRoute(
      path: '/app/inventory/reports',
      builder: (context, state) => const InventoryReportsScreen(),
    ),
    GoRoute(
      path: '/app/inventory/settings',
      builder: (context, state) => const InventorySettingsScreen(),
    ),
    // Cash & Bank
    GoRoute(
      path: '/app/cash-bank/cash-account',
      builder: (context, state) => const CashAccountScreen(),
    ),
    GoRoute(
      path: '/app/cash-bank/bank-account',
      builder: (context, state) => const BankAccountsScreen(),
    ),
    GoRoute(
      path: '/app/cash-bank/cheque-books',
      builder: (context, state) => const ChequeBooksScreen(),
    ),
    GoRoute(
      path: '/app/cash-bank/cheques-management',
      builder: (context, state) => const ChequesManagementScreen(),
    ),
    GoRoute(
      path: '/app/cash-bank/cheques',
      builder: (context, state) => const ChequesScreen(),
    ),
    GoRoute(
      path: '/app/cash-bank/balance-transfer',
      builder: (context, state) => const BalanceTransferScreen(),
    ),
    // Business pages
    GoRoute(
      path: '/app/website',
      builder: (context, state) => const WebsiteAnalyticsScreen(),
    ),
    GoRoute(
      path: '/app/subscription',
      builder: (context, state) => const SubscriptionScreen(),
    ),
    GoRoute(
      path: '/app/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/app/support',
      builder: (context, state) => const SupportScreen(),
    ),
    // Settings
    GoRoute(
      path: '/app/settings',
      builder: (context, state) => const SettingsScreen(),
    ),
    GoRoute(
      path: '/app/settings/advanced-tabs',
      builder: (context, state) => const SettingsScreen(),
    ),
  ],
);

class NayaSystemApp extends StatelessWidget {
  const NayaSystemApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Naya System',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.white,
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF1C1C1C),
          surface: Colors.white,
          onSurface: Color(0xFF1C1C1C),
        ),
        textTheme: TextTheme(
          bodyLarge: GoogleFonts.getFont('Google Sans'),
          bodyMedium: GoogleFonts.getFont('Google Sans'),
          bodySmall: GoogleFonts.getFont('Google Sans'),
          labelLarge: GoogleFonts.getFont('Google Sans'),
          labelMedium: GoogleFonts.getFont('Google Sans'),
          labelSmall: GoogleFonts.getFont('Google Sans'),
          titleLarge: GoogleFonts.getFont('Google Sans'),
          titleMedium: GoogleFonts.getFont('Google Sans'),
          titleSmall: GoogleFonts.getFont('Google Sans'),
          headlineLarge: GoogleFonts.getFont('Google Sans'),
          headlineMedium: GoogleFonts.getFont('Google Sans'),
          headlineSmall: GoogleFonts.getFont('Google Sans'),
          displayLarge: GoogleFonts.getFont('Google Sans'),
          displayMedium: GoogleFonts.getFont('Google Sans'),
          displaySmall: GoogleFonts.getFont('Google Sans'),
        ),
      ),
      routerConfig: _router,
    );
  }
}
