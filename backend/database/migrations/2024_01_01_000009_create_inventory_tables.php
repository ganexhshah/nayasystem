<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('inventory_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('abbreviation', 10);
            $table->timestamps();
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('inventory_categories')->nullOnDelete();
            $table->foreignId('unit_id')->nullable()->constrained('inventory_units')->nullOnDelete();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->text('description')->nullable();
            $table->decimal('cost_price', 10, 2)->default(0);
            $table->decimal('reorder_level', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('inventory_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->unique()->constrained('inventory_items')->cascadeOnDelete();
            $table->decimal('quantity', 12, 3)->default(0);
            $table->timestamp('last_updated_at')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_type')->nullable();
            $table->string('type');
            $table->decimal('quantity', 12, 3);
            $table->decimal('cost_price', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('contact_person')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('po_number')->unique();
            $table->string('status')->default('draft');
            $table->decimal('total', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->date('expected_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamps();
        });

        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->decimal('quantity', 12, 3);
            $table->decimal('received_quantity', 12, 3)->default(0);
            $table->decimal('unit_price', 10, 2);
            $table->timestamps();
        });

        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->decimal('yield_quantity', 10, 3)->nullable();
            $table->foreignId('yield_unit_id')->nullable()->constrained('inventory_units')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->decimal('quantity', 12, 3);
            $table->foreignId('unit_id')->nullable()->constrained('inventory_units')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('batch_inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('batch_number')->unique();
            $table->string('type');
            $table->string('status')->default('draft');
            $table->text('notes')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('batch_inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_inventory_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->decimal('quantity', 12, 3);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_inventory_items');
        Schema::dropIfExists('batch_inventories');
        Schema::dropIfExists('recipe_ingredients');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('inventory_stocks');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('inventory_units');
        Schema::dropIfExists('inventory_categories');
    }
};
