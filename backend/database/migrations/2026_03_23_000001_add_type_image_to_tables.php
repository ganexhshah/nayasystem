<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->string('type')->default('table')->after('name'); // table, cabin
            $table->string('image')->nullable()->after('type');
            $table->text('description')->nullable()->after('image');
            $table->json('special_features')->nullable()->after('description'); // e.g. ["Window View","Private","AC"]
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->string('special_package')->nullable()->after('notes'); // e.g. "Birthday Package"
            $table->json('pre_order_items')->nullable()->after('special_package'); // [{name,price,qty}]
            $table->decimal('package_price', 10, 2)->default(0)->after('pre_order_items');
        });
    }

    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropColumn(['type', 'image', 'description', 'special_features']);
        });
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn(['special_package', 'pre_order_items', 'package_price']);
        });
    }
};
