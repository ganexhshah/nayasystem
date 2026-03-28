<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cheque extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'bank_account_id',
        'cheque_book_id',
        'user_id',
        'type',
        'bank_name',
        'cheque_no',
        'entry_date_bs',
        'entry_date_ad',
        'transaction_date_bs',
        'transaction_date_ad',
        'party_type',
        'party_name',
        'amount',
        'voucher_no',
        'status',
        'remarks',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'entry_date_ad' => 'date',
        'transaction_date_ad' => 'date',
    ];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function chequeBook()
    {
        return $this->belongsTo(ChequeBook::class);
    }
}
