<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'category_id', 'user_id',
        'title', 'amount', 'date', 'notes', 'receipt',
    ];

    protected $casts = ['amount' => 'decimal:2', 'date' => 'date'];

    public function restaurant() { return $this->belongsTo(Restaurant::class); }
    public function category() { return $this->belongsTo(ExpenseCategory::class, 'category_id'); }
    public function user() { return $this->belongsTo(User::class); }
}
