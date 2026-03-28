<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->string('logo')->nullable();
            $table->string('currency', 10)->default('NPR');
            $table->string('timezone')->default('Asia/Kathmandu');
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('service_charge', 5, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->jsonb('settings')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurants');
    }
};
