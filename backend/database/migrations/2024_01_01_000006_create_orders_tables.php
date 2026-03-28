<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kitchens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type')->default('default');
            $table->boolean('is_active')->default(true);
            $table->jsonb('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('kitchen_categories', function (Blueprint $table) {
            $table->foreignId('kitchen_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_category_id')->constrained()->cascadeOnDelete();
            $table->primary(['kitchen_id', 'menu_category_id']);
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('table_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('order_number')->unique();
            $table->string('order_type')->default('dine_in');
            $table->string('status')->default('pending');
            $table->string('payment_status')->default('unpaid');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('service_charge', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->text('delivery_address')->nullable();
            $table->timestamps();
        });

        Schema::create('kots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('kitchen_id')->nullable()->constrained()->nullOnDelete();
            $table->string('kot_number')->unique();
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('printed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('kot_id')->nullable()->constrained('kots')->nullOnDelete();
            $table->string('name');
            $table->decimal('price', 10, 2);
            $table->integer('quantity');
            $table->jsonb('modifiers')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('kots');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('kitchen_categories');
        Schema::dropIfExists('kitchens');
    }
};
