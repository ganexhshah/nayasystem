<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ComplexPassword implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Password must contain at least:
        // - 8 characters total
        // - 1 uppercase letter
        // - 1 lowercase letter
        // - 1 digit (0-9)
        // - 1 special character (!@#$%^&*)
        
        if (strlen($value) < 8) {
            $fail('The password must be at least 8 characters.');
            return;
        }

        if (!preg_match('/[A-Z]/', $value)) {
            $fail('The password must contain at least one uppercase letter.');
            return;
        }

        if (!preg_match('/[a-z]/', $value)) {
            $fail('The password must contain at least one lowercase letter.');
            return;
        }

        if (!preg_match('/\d/', $value)) {
            $fail('The password must contain at least one number.');
            return;
        }

        if (!preg_match('/[!@#$%^&*()_+=\-\[\]{};:\'",.<>?\/\\|`~]/', $value)) {
            $fail('The password must contain at least one special character (!@#$%^&*).');
            return;
        }
    }
}
