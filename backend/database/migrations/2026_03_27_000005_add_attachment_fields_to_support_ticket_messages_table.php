<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('support_ticket_messages', function (Blueprint $table) {
            $table->string('attachment_name')->nullable()->after('message');
            $table->text('attachment_path')->nullable()->after('attachment_name');
            $table->text('attachment_url')->nullable()->after('attachment_path');
            $table->string('attachment_mime')->nullable()->after('attachment_url');
            $table->unsignedBigInteger('attachment_size')->nullable()->after('attachment_mime');
        });
    }

    public function down(): void
    {
        Schema::table('support_ticket_messages', function (Blueprint $table) {
            $table->dropColumn([
                'attachment_name',
                'attachment_path',
                'attachment_url',
                'attachment_mime',
                'attachment_size',
            ]);
        });
    }
};
