<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('password')->nullable()->after('email');
            $table->string('firebase_uid')->nullable()->after('password');
            $table->string('avatar')->nullable()->after('firebase_uid');
            $table->json('saved_addresses')->nullable()->after('address');
            $table->boolean('is_active')->default(true)->after('saved_addresses');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['password', 'firebase_uid', 'avatar', 'saved_addresses', 'is_active']);
        });
    }
};
