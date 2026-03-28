<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('menu_categories')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('image')->nullable();
            $table->string('sku')->nullable();
            $table->boolean('is_veg')->default(true);
            $table->boolean('is_available')->default(true);
            $table->integer('sort_order')->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->integer('preparation_time')->nullable()->comment('minutes');
            $table->integer('calories')->nullable();
            $table->jsonb('tags')->nullable();
            $table->timestamps();
        });

        Schema::create('modifier_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->integer('min_select')->default(0);
            $table->integer('max_select')->default(1);
            $table->boolean('is_required')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('modifiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('modifier_group_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->decimal('price', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('menu_item_modifier_groups', function (Blueprint $table) {
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('modifier_group_id')->constrained()->cascadeOnDelete();
            $table->primary(['menu_item_id', 'modifier_group_id']);
        });

        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('menu_menu_items', function (Blueprint $table) {
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
            $table->primary(['menu_id', 'menu_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_menu_items');
        Schema::dropIfExists('menus');
        Schema::dropIfExists('menu_item_modifier_groups');
        Schema::dropIfExists('modifiers');
        Schema::dropIfExists('modifier_groups');
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('menu_categories');
    }
};
