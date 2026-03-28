<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::command('mail:send-due-payment-reminders')->dailyAt('09:00');
Schedule::command('mail:send-weekly-updates')->weeklyOn(1, '08:00');
Schedule::command('mail:send-monthly-updates')->monthlyOn(1, '08:15');
