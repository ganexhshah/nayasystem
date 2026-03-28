<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            // Items that are instantly ready (no kitchen prep needed)
            // e.g. cigarettes, hookah, coke, packaged cake, bottled drinks
            $table->boolean('is_instant')->default(false)->after('is_available');
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn('is_instant');
        });
    }
};
