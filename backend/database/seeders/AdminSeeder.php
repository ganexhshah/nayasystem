<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $seedPassword = env('ADMIN_SEED_PASSWORD', Str::random(24));

        // Default super admin
        AdminUser::firstOrCreate(
            ['email' => 'admin@nayasystem.com'],
            [
                'name'     => 'Super Admin',
                'password' => Hash::make($seedPassword),
                'role'     => 'superadmin',
                'is_active'=> true,
            ]
        );

        // Default subscription plans
        $plans = [
            [
                'name'          => 'Basic',
                'price_monthly' => 29,
                'price_yearly'  => 290,
                'currency'      => 'USD',
                'trial_days'    => 14,
                'color'         => 'slate',
                'sort_order'    => 1,
                'features'      => [
                    'Up to 50 menu items',
                    '1 staff account',
                    'Basic reports',
                    'QR code ordering',
                    'Email support',
                ],
            ],
            [
                'name'          => 'Premium',
                'price_monthly' => 99,
                'price_yearly'  => 990,
                'currency'      => 'USD',
                'trial_days'    => 14,
                'color'         => 'indigo',
                'sort_order'    => 2,
                'features'      => [
                    'Unlimited menu items',
                    '10 staff accounts',
                    'Advanced reports',
                    'QR code ordering',
                    'Inventory management',
                    'POS system',
                    'Priority support',
                ],
            ],
            [
                'name'          => 'Enterprise',
                'price_monthly' => 199,
                'price_yearly'  => 1990,
                'currency'      => 'USD',
                'trial_days'    => 30,
                'color'         => 'purple',
                'sort_order'    => 3,
                'features'      => [
                    'Everything in Premium',
                    'Unlimited staff',
                    'Multi-branch support',
                    'Custom integrations',
                    'Dedicated account manager',
                    '24/7 phone support',
                    'Custom branding',
                ],
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::firstOrCreate(['name' => $plan['name']], $plan);
        }
    }
}
