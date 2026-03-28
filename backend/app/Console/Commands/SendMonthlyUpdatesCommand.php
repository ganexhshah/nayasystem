<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\Restaurant;
use App\Services\BusinessMailService;
use Illuminate\Console\Command;

class SendMonthlyUpdatesCommand extends Command
{
    protected $signature = 'mail:send-monthly-updates';
    protected $description = 'Send monthly update emails to restaurant owners';

    public function handle(BusinessMailService $mailService): int
    {
        $start = now()->subDays(30);

        Restaurant::query()
            ->where('is_active', true)
            ->chunkById(100, function ($restaurants) use ($mailService, $start) {
                foreach ($restaurants as $restaurant) {
                    $orders = Order::query()
                        ->where('restaurant_id', $restaurant->id)
                        ->where('created_at', '>=', $start);

                    $ordersCount = (clone $orders)->count();
                    $revenue = (clone $orders)->where('status', 'completed')->sum('total');

                    $metrics = [
                        'orders' => $ordersCount,
                        'revenue' => $revenue,
                        'avg_order_value' => $ordersCount > 0 ? ($revenue / $ordersCount) : 0,
                        'due_orders' => (clone $orders)
                            ->where('status', 'completed')
                            ->where('payment_status', 'unpaid')
                            ->count(),
                    ];

                    $mailService->sendMonthlySummary($restaurant, $metrics);
                }
            });

        $this->info('Monthly update emails sent.');

        return self::SUCCESS;
    }
}

