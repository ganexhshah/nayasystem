<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChequeBook extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'bank_account_id',
        'user_id',
        'bank_name',
        'cheque_from',
        'cheque_to',
        'total_cheques',
    ];

    protected $casts = [
        'total_cheques' => 'integer',
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

    public function cheques()
    {
        return $this->hasMany(Cheque::class);
    }
}
