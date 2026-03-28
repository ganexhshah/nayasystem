<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\Restaurant;
use App\Services\BusinessMailService;
use Illuminate\Console\Command;

class SendWeeklyUpdatesCommand extends Command
{
    protected $signature = 'mail:send-weekly-updates';
    protected $description = 'Send weekly update emails to restaurant owners';

    public function handle(BusinessMailService $mailService): int
    {
        $start = now()->subDays(7);

        Restaurant::query()
            ->where('is_active', true)
            ->chunkById(100, function ($restaurants) use ($mailService, $start) {
                foreach ($restaurants as $restaurant) {
                    $orders = Order::query()
                        ->where('restaurant_id', $restaurant->id)
                        ->where('created_at', '>=', $start);

                    $metrics = [
                        'orders' => (clone $orders)->count(),
                        'revenue' => (clone $orders)->where('status', 'completed')->sum('total'),
                        'due_orders' => (clone $orders)
                            ->where('status', 'completed')
                            ->where('payment_status', 'unpaid')
                            ->count(),
                    ];

                    $mailService->sendWeeklySummary($restaurant, $metrics);
                }
            });

        $this->info('Weekly update emails sent.');

        return self::SUCCESS;
    }
}

