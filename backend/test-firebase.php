<?php
require '/var/www/vendor/autoload.php';
$app = require '/var/www/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $auth = app('Kreait\Firebase\Contract\Auth');
    echo "Firebase Auth resolved: " . get_class($auth) . "\n";
    $auth->verifyIdToken('badtoken');
} catch (\Throwable $e) {
    echo get_class($e) . ": " . $e->getMessage() . "\n";
}
