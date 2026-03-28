<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RestaurantController;
use App\Http\Controllers\Api\MenuCategoryController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\ModifierGroupController;
use App\Http\Controllers\Api\ModifierController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\TableAreaController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\KotController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ExpenseCategoryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\InventoryItemController;
use App\Http\Controllers\Api\InventoryStockController;
use App\Http\Controllers\Api\InventoryMovementController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\BatchInventoryController;
use App\Http\Controllers\Api\KitchenController;
use App\Http\Controllers\Api\WaiterRequestController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\SubscriptionUserController;
use App\Http\Controllers\Api\BankAccountController;
use App\Http\Controllers\Api\ChequeBookController;
use App\Http\Controllers\Api\ChequeController;
use App\Http\Controllers\Api\CashAccountController;
use App\Http\Controllers\Api\DemoRequestController;
use App\Http\Controllers\Api\SupportTicketController;

// Handle CORS preflight for all API routes
Route::options('{any}', fn() => response()->noContent())->where('any', '.*');

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminRestaurantController;
use App\Http\Controllers\Api\Admin\SubscriptionPlanController;
use App\Http\Controllers\Api\Admin\SubscriptionController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AdminReportsController;
use App\Http\Controllers\Api\Admin\AdminSettingsController;
use App\Http\Controllers\Api\Admin\AdminDemoRequestController;
use App\Http\Controllers\Api\Admin\AdminSupportTicketController;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->group(function () {
    Route::post('/auth/login', [AdminAuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('admin.auth')->group(function () {
        Route::post('/auth/logout', [AdminAuthController::class, 'logout']);
        Route::get('/auth/me', [AdminAuthController::class, 'me']);

        Route::get('/dashboard', [AdminDashboardController::class, 'index']);

        Route::get('/restaurants/stats', [AdminRestaurantController::class, 'stats']);
        Route::apiResource('/restaurants', AdminRestaurantController::class)->except(['store']);

        Route::apiResource('/plans', SubscriptionPlanController::class)->except(['show']);

        Route::get('/subscriptions/summary', [SubscriptionController::class, 'summary']);
        Route::post('/subscriptions/{subscription}/renew', [SubscriptionController::class, 'renew']);
        Route::post('/subscriptions/{subscription}/cancel', [SubscriptionController::class, 'cancel']);
        Route::apiResource('/subscriptions', SubscriptionController::class)->except(['show']);

        Route::get('/users', [AdminUserController::class, 'index']);
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);

        Route::get('/reports', [AdminReportsController::class, 'index']);
        Route::get('/demo-requests', [AdminDemoRequestController::class, 'index']);
        Route::patch('/demo-requests/{demoRequest}', [AdminDemoRequestController::class, 'update']);
        Route::get('/support-tickets', [AdminSupportTicketController::class, 'index']);
        Route::patch('/support-tickets/{supportTicket}', [AdminSupportTicketController::class, 'update']);
        Route::post('/support-tickets/{supportTicket}/messages', [AdminSupportTicketController::class, 'reply']);

        Route::get('/settings', [AdminSettingsController::class, 'show']);
        Route::put('/settings', [AdminSettingsController::class, 'update']);
        Route::patch('/settings', [AdminSettingsController::class, 'update']);

        // Bulk menu image upload (admin uploads images for any restaurant item by name)
        Route::get('/menu-images', [\App\Http\Controllers\Api\Admin\AdminMenuImageController::class, 'index']);
        Route::post('/menu-images', [\App\Http\Controllers\Api\Admin\AdminMenuImageController::class, 'store']);
        Route::delete('/menu-images/{menuItem}', [\App\Http\Controllers\Api\Admin\AdminMenuImageController::class, 'destroy']);
    });
});

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
// Public plans for landing page
Route::get('/public/plans', fn() => response()->json(
    \App\Models\SubscriptionPlan::where('is_active', true)->orderBy('sort_order')->get()
));

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/google', [AuthController::class, 'googleAuth'])->middleware('throttle:20,1');
Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:5,1');
Route::post('/auth/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:10,1');
Route::post('/demo-requests', [DemoRequestController::class, 'store'])->middleware('throttle:10,1');

// Public restaurant menu (for customer-facing pages)
Route::get('/restaurants', [RestaurantController::class, 'publicIndex']);

Route::prefix('restaurant/{slug}')->group(function () {
    Route::get('/', [RestaurantController::class, 'publicShow']);
    Route::get('/menu', [MenuItemController::class, 'publicMenu']);
    Route::get('/tables', [TableController::class, 'publicTables']);
    Route::get('/ratings', [OrderController::class, 'restaurantRatings']);
    Route::post('/reservations', [ReservationController::class, 'store'])->middleware('throttle:30,1');
    Route::post('/orders', [OrderController::class, 'publicStore'])->middleware('throttle:30,1');
    Route::post('/waiter-requests', [WaiterRequestController::class, 'publicStore'])->middleware('throttle:30,1');
});

// Public order status polling (by order id, no auth)
Route::get('/public-orders/{id}/status', [OrderController::class, 'publicOrderStatus'])->middleware('throttle:60,1');
Route::post('/public-orders/{id}/rate', [OrderController::class, 'rateOrder'])->middleware('throttle:20,1');
Route::get('/public-ratings', [OrderController::class, 'publicRatings'])->middleware('throttle:60,1');

// Customer auth (per restaurant)
Route::prefix('restaurant/{slug}/customer')->group(function () {
    Route::post('/register', [CustomerAuthController::class, 'register']);
    Route::post('/login',    [CustomerAuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/google',   [CustomerAuthController::class, 'googleAuth'])->middleware('throttle:20,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me',      [CustomerAuthController::class, 'me']);
        Route::put('/me',      [CustomerAuthController::class, 'update']);
        Route::post('/logout', [CustomerAuthController::class, 'logout']);
        Route::get('/orders',  [CustomerAuthController::class, 'orders']);
    });
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('permission:reports.view');
    Route::get('/analytics/website', [DashboardController::class, 'websiteAnalytics'])->middleware('permission:reports.view');

    // Subscription (restaurant user)
    Route::get('/subscription', [SubscriptionUserController::class, 'current'])->middleware('permission:settings.manage');
    Route::post('/subscription/subscribe', [SubscriptionUserController::class, 'subscribe'])->middleware('permission:settings.manage');
    Route::get('/subscription/invoices', [SubscriptionUserController::class, 'invoices'])->middleware('permission:settings.manage');
    Route::post('/subscription/cancel', [SubscriptionUserController::class, 'cancel'])->middleware('permission:settings.manage');

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);

    // Restaurant Settings
    Route::get('/settings', [SettingsController::class, 'show'])->middleware('permission:settings.manage');
    Route::put('/settings', [SettingsController::class, 'update'])->middleware('permission:settings.manage');
    Route::patch('/settings', [SettingsController::class, 'update'])->middleware('permission:settings.manage');
    Route::post('/settings/logo', [SettingsController::class, 'uploadLogo'])->middleware('permission:settings.manage');
    Route::post('/settings/payment-qr', [SettingsController::class, 'uploadPaymentQr'])->middleware('permission:settings.manage');
    Route::post('/settings/payment-method', [SettingsController::class, 'updatePaymentMethod'])->middleware('permission:settings.manage');

    // Menu
    Route::apiResource('menu-categories', MenuCategoryController::class)->middleware('permission:menu.view|menu.create|menu.edit|menu.delete');
    Route::apiResource('menu-items', MenuItemController::class)->middleware('permission:menu.view|menu.create|menu.edit|menu.delete');
    Route::post('/menu-items/bulk-import', [MenuItemController::class, 'bulkImport'])->middleware('permission:menu.create|menu.edit');
    Route::post('/menu-items/sort', [MenuItemController::class, 'sort'])->middleware('permission:menu.edit');
    Route::apiResource('modifier-groups', ModifierGroupController::class)->middleware('permission:menu.view|menu.create|menu.edit|menu.delete');
    Route::apiResource('modifiers', ModifierController::class)->middleware('permission:menu.view|menu.create|menu.edit|menu.delete');
    Route::apiResource('menus', MenuController::class)->middleware('permission:menu.view|menu.create|menu.edit|menu.delete');

    // Tables
    Route::apiResource('table-areas', TableAreaController::class)->middleware('permission:tables.view|tables.manage');
    Route::apiResource('tables', TableController::class)->middleware('permission:tables.view|tables.manage');
    Route::get('/tables/{table}/qr-code', [TableController::class, 'qrCode'])->middleware('permission:tables.view|tables.manage');
    Route::get('/tables/{table}/qr-code/download', [TableController::class, 'downloadQrCode'])->middleware('permission:tables.view|tables.manage');
    Route::post('/tables/{table}/image', [TableController::class, 'uploadImage'])->middleware('permission:tables.manage');

    // Orders & KOT
    Route::apiResource('orders', OrderController::class)->middleware('permission:orders.view|orders.create|orders.edit|orders.delete');
    Route::post('/orders/{order}/status', [OrderController::class, 'updateStatus'])->middleware('permission:orders.edit');
    Route::post('/orders/{order}/add-items', [OrderController::class, 'addItems'])->middleware('permission:orders.edit|orders.create');
    Route::post('/orders/{order}/assign-waiter', [OrderController::class, 'assignWaiter'])->middleware('permission:orders.edit');
    Route::post('/orders/{order}/waiter-acceptance', [OrderController::class, 'updateWaiterAcceptance'])->middleware('permission:orders.edit');
    Route::post('/orders/{order}/invoice', [OrderController::class, 'generateInvoice'])->middleware('permission:orders.view');
    Route::apiResource('kots', KotController::class)->middleware('permission:kitchen.view|kitchen.manage');
    Route::post('/kots/{kot}/status', [KotController::class, 'updateStatus'])->middleware('permission:kitchen.manage');

    // POS
    Route::post('/pos/orders', [OrderController::class, 'posStore'])->middleware('permission:pos.access|orders.create');

    // Customers
    Route::apiResource('customers', CustomerController::class)->middleware('permission:customers.view|customers.manage');

    // Reservations
    Route::apiResource('reservations', ReservationController::class)->middleware('permission:reservations.view|reservations.manage');
    Route::post('/reservations/{reservation}/status', [ReservationController::class, 'updateStatus'])->middleware('permission:reservations.manage');

    // Payments
    Route::apiResource('payments', PaymentController::class)->middleware('permission:payments.view|payments.manage');
    Route::get('/due-payments', [PaymentController::class, 'duePayments'])->middleware('permission:payments.view|payments.manage');
    Route::get('/cash-account', [CashAccountController::class, 'index'])->middleware('permission:payments.view|payments.manage|expenses.view|expenses.manage');
    Route::apiResource('bank-accounts', BankAccountController::class)->middleware('permission:payments.view|payments.manage');
    Route::apiResource('cheque-books', ChequeBookController::class)->only(['index', 'store', 'show', 'destroy'])->middleware('permission:payments.view|payments.manage');
    Route::apiResource('cheques', ChequeController::class)->middleware('permission:payments.view|payments.manage');

    // Expenses
    Route::apiResource('expense-categories', ExpenseCategoryController::class)->middleware('permission:expenses.view|expenses.manage');
    Route::apiResource('expenses', ExpenseController::class)->middleware('permission:expenses.view|expenses.manage');
    Route::get('/support-tickets', [SupportTicketController::class, 'index']);
    Route::post('/support-tickets', [SupportTicketController::class, 'store']);
    Route::post('/support-tickets/{supportTicket}/messages', [SupportTicketController::class, 'reply']);

    // Staff
    Route::apiResource('staff', StaffController::class)->middleware('permission:staff.view|staff.manage');
    Route::post('/staff/{staff}/permissions', [StaffController::class, 'updatePermissions'])->middleware('permission:staff.manage');

    // Kitchen — static routes MUST come before {kitchen} wildcard
    Route::get('/kitchens', [KitchenController::class, 'index'])->middleware('permission:kitchen.view|kitchen.manage');
    Route::post('/kitchens', [KitchenController::class, 'store'])->middleware('permission:kitchen.manage');
    Route::put('/kitchens/{kitchen}', [KitchenController::class, 'update'])->middleware('permission:kitchen.manage');
    Route::delete('/kitchens/{kitchen}', [KitchenController::class, 'destroy'])->middleware('permission:kitchen.manage');
    Route::get('/kitchens/{kitchen}/kots', [KitchenController::class, 'kots'])->middleware('permission:kitchen.view|kitchen.manage');

    // Waiter Requests
    Route::apiResource('waiter-requests', WaiterRequestController::class)->middleware('permission:orders.view|orders.edit|tables.view|tables.manage');
    Route::post('/waiter-requests/{request}/status', [WaiterRequestController::class, 'updateStatus'])->middleware('permission:orders.edit|tables.manage');

    // Inventory
    Route::apiResource('inventory/categories', \App\Http\Controllers\Api\InventoryCategoryController::class)->middleware('permission:inventory.view|inventory.manage');
    Route::apiResource('inventory/units', \App\Http\Controllers\Api\InventoryUnitController::class)->middleware('permission:inventory.view|inventory.manage');
    Route::apiResource('inventory/items', InventoryItemController::class)->middleware('permission:inventory.view|inventory.manage');
    Route::apiResource('inventory/stocks', InventoryStockController::class)->middleware('permission:inventory.view|inventory.manage');
    Route::apiResource('inventory/movements', InventoryMovementController::class)->middleware('permission:inventory.view|inventory.manage');
    Route::apiResource('inventory/suppliers', SupplierController::class)->middleware('permission:inventory.view|inventory.manage');
    Route::apiResource('inventory/purchase-orders', PurchaseOrderController::class)->middleware('permission:inventory.view|inventory.manage');
    Route::post('/inventory/purchase-orders/{order}/receive', [PurchaseOrderController::class, 'receive'])->middleware('permission:inventory.manage');
    Route::apiResource('inventory/recipes', RecipeController::class)->middleware('permission:inventory.view|inventory.manage');
    Route::apiResource('inventory/batch-inventory', BatchInventoryController::class)->middleware('permission:inventory.view|inventory.manage');
    Route::get('/inventory/batch-reports', [BatchInventoryController::class, 'reports'])->middleware('permission:inventory.view|inventory.manage');
    Route::get('/inventory/dashboard', [\App\Http\Controllers\Api\InventoryDashboardController::class, 'index'])->middleware('permission:inventory.view|inventory.manage');

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/sales', [ReportController::class, 'sales'])->middleware('permission:reports.view');
        Route::get('/items', [ReportController::class, 'items'])->middleware('permission:reports.view');
        Route::get('/categories', [ReportController::class, 'categories'])->middleware('permission:reports.view');
        Route::get('/tax', [ReportController::class, 'tax'])->middleware('permission:reports.view');
        Route::get('/expenses', [ReportController::class, 'expenses'])->middleware('permission:reports.view');
        Route::get('/payments', [ReportController::class, 'payments'])->middleware('permission:reports.view');
        Route::get('/due-payments', [ReportController::class, 'duePayments'])->middleware('permission:reports.view');
        Route::get('/cancelled', [ReportController::class, 'cancelled'])->middleware('permission:reports.view');
        Route::get('/refund', [ReportController::class, 'refund'])->middleware('permission:reports.view');
        Route::get('/delivery', [ReportController::class, 'delivery'])->middleware('permission:reports.view');
        Route::get('/cod', [ReportController::class, 'cod'])->middleware('permission:reports.view');
        Route::get('/loyalty', [ReportController::class, 'loyalty'])->middleware('permission:reports.view');
    });
});
