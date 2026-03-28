<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;
use Intervention\Image\Laravel\Facades\Image as ImageProcessor;

class ValidateImageFile implements ValidationRule
{
    private $maxWidth = 4000;
    private $maxHeight = 4000;
    private $minWidth = 50;
    private $minHeight = 50;

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!($value instanceof UploadedFile)) {
            $fail("The {$attribute} must be a valid file.");
            return;
        }

        // File type validation
        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($value->getMimeType(), $allowedMimes)) {
            $fail("The {$attribute} must be a valid image (JPEG, PNG, GIF, or WebP).");
            return;
        }

        // File size validation (max 5MB)
        if ($value->getSize() > 5 * 1024 * 1024) {
            $fail("The {$attribute} must not exceed 5MB.");
            return;
        }

        // Image dimension validation
        try {
            $image = ImageProcessor::read($value);
            $width = $image->width();
            $height = $image->height();

            if ($width < $this->minWidth || $height < $this->minHeight) {
                $fail("The {$attribute} must be at least {$this->minWidth}x{$this->minHeight} pixels.");
                return;
            }

            if ($width > $this->maxWidth || $height > $this->maxHeight) {
                $fail("The {$attribute} must not exceed {$this->maxWidth}x{$this->maxHeight} pixels.");
                return;
            }
        } catch (\Throwable $e) {
            $fail("The {$attribute} could not be processed. Ensure it's a valid image file.");
            return;
        }
    }
}
