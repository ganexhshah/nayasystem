<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Image Driver
    |--------------------------------------------------------------------------
    | Intervention Image supports "gd" and "imagick" as drivers.
    | GD is used here since it's installed in the Docker image.
    */
    'driver' => \Intervention\Image\Drivers\Gd\Driver::class,
];
