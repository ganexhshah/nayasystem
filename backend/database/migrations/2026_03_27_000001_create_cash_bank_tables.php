<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('bank_name');
            $table->string('account_name');
            $table->string('account_number');
            $table->string('account_type')->default('Savings');
            $table->string('swift_code')->nullable();
            $table->string('branch_address')->nullable();
            $table->decimal('opening_balance', 12, 2)->default(0);
            $table->decimal('current_balance', 12, 2)->default(0);
            $table->string('opening_date_bs')->nullable();
            $table->date('opening_date_ad')->nullable();
            $table->string('logo')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'bank_name']);
            $table->unique(['restaurant_id', 'account_number']);
        });

        Schema::create('cheque_books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bank_account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('bank_name');
            $table->string('cheque_from');
            $table->string('cheque_to');
            $table->unsignedInteger('total_cheques')->default(0);
            $table->timestamps();

            $table->index(['restaurant_id', 'bank_name']);
        });

        Schema::create('cheques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bank_account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cheque_book_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type');
            $table->string('bank_name');
            $table->string('cheque_no');
            $table->string('entry_date_bs')->nullable();
            $table->date('entry_date_ad')->nullable();
            $table->string('transaction_date_bs')->nullable();
            $table->date('transaction_date_ad')->nullable();
            $table->string('party_type')->nullable();
            $table->string('party_name');
            $table->decimal('amount', 12, 2);
            $table->string('voucher_no')->nullable();
            $table->string('status')->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'type']);
            $table->index(['restaurant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cheques');
        Schema::dropIfExists('cheque_books');
        Schema::dropIfExists('bank_accounts');
    }
};
