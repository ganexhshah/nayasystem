<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Menu
            'menu.view', 'menu.create', 'menu.edit', 'menu.delete',
            // Orders
            'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
            // POS
            'pos.access',
            // Kitchen
            'kitchen.view', 'kitchen.manage',
            // Tables
            'tables.view', 'tables.manage',
            // Customers
            'customers.view', 'customers.manage',
            // Reservations
            'reservations.view', 'reservations.manage',
            // Payments
            'payments.view', 'payments.manage',
            // Expenses
            'expenses.view', 'expenses.manage',
            // Staff
            'staff.view', 'staff.manage',
            // Reports
            'reports.view',
            // Inventory
            'inventory.view', 'inventory.manage',
            // Settings
            'settings.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Owner - all permissions
        $owner = Role::firstOrCreate(['name' => 'owner']);
        $owner->syncPermissions(Permission::all());

        // Manager - most permissions except staff management
        $manager = Role::firstOrCreate(['name' => 'manager']);
        $manager->syncPermissions(Permission::whereNotIn('name', ['staff.manage', 'settings.manage'])->get());

        // Cashier
        $cashier = Role::firstOrCreate(['name' => 'cashier']);
        $cashier->syncPermissions(['pos.access', 'orders.view', 'orders.create', 'orders.edit', 'payments.view', 'payments.manage', 'customers.view']);

        // Waiter
        $waiter = Role::firstOrCreate(['name' => 'waiter']);
        $waiter->syncPermissions(['pos.access', 'orders.view', 'orders.create', 'orders.edit', 'tables.view', 'customers.view', 'reservations.view']);

        // Kitchen
        $kitchen = Role::firstOrCreate(['name' => 'kitchen']);
        $kitchen->syncPermissions(['kitchen.view', 'kitchen.manage', 'orders.view']);

        // Delivery
        $delivery = Role::firstOrCreate(['name' => 'delivery']);
        $delivery->syncPermissions(['orders.view']);

        // POS Operator
        $posOperator = Role::firstOrCreate(['name' => 'pos_operator']);
        $posOperator->syncPermissions(['pos.access', 'orders.view', 'orders.create', 'orders.edit', 'payments.view', 'payments.manage', 'tables.view', 'customers.view', 'menu.view']);

        // Aliases used by frontend
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions(Permission::all());

        $branchHead = Role::firstOrCreate(['name' => 'branch_head']);
        $branchHead->syncPermissions($manager->permissions);

        $chef = Role::firstOrCreate(['name' => 'chef']);
        $chef->syncPermissions(['kitchen.view', 'kitchen.manage', 'orders.view']);
    }
}
