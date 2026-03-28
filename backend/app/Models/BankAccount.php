<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'user_id',
        'bank_name',
        'account_name',
        'account_number',
        'account_type',
        'swift_code',
        'branch_address',
        'opening_balance',
        'current_balance',
        'opening_date_bs',
        'opening_date_ad',
        'logo',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'opening_date_ad' => 'date',
    ];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function chequeBooks()
    {
        return $this->hasMany(ChequeBook::class);
    }

    public function cheques()
    {
        return $this->hasMany(Cheque::class);
    }
}
