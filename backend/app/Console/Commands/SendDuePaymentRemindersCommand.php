<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\Restaurant;
use App\Services\BusinessMailService;
use Illuminate\Console\Command;

class SendDuePaymentRemindersCommand extends Command
{
    protected $signature = 'mail:send-due-payment-reminders';
    protected $description = 'Send due payment reminder emails to customers';

    public function handle(BusinessMailService $mailService): int
    {
        Restaurant::query()
            ->where('is_active', true)
            ->chunkById(100, function ($restaurants) use ($mailService) {
                foreach ($restaurants as $restaurant) {
                    Order::query()
                        ->where('restaurant_id', $restaurant->id)
                        ->where('status', 'completed')
                        ->where('payment_status', 'unpaid')
                        ->with('customer')
                        ->chunkById(100, function ($orders) use ($mailService, $restaurant) {
                            foreach ($orders as $order) {
                                $mailService->sendDuePaymentReminder($order, $restaurant);
                            }
                        });
                }
            });

        $this->info('Due payment reminder emails sent.');

        return self::SUCCESS;
    }
}

