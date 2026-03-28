<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->string('item_type')->default('Veg')->after('sku');
        });

        DB::table('menu_items')->update([
            'item_type' => DB::raw("CASE WHEN is_veg THEN 'Veg' ELSE 'Non Veg' END"),
        ]);
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn('item_type');
        });
    }
};
