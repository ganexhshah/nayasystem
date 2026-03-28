@echo off
echo === Naya System Backend Setup ===

if not exist .env (
    copy .env.example .env
    echo Created .env from .env.example
    echo.
    echo IMPORTANT: Edit .env and set your R2/S3 credentials before continuing!
    pause
)

echo Starting Docker containers...
docker-compose up -d --build

echo Waiting for containers to be ready (15s)...
timeout /t 15 /nobreak

echo Installing PHP dependencies...
docker-compose exec app composer install

echo Generating app key...
docker-compose exec -u www-data app php artisan key:generate

echo Publishing Spatie Permission migrations...
docker-compose exec -u www-data app php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

echo Publishing Sanctum migrations...
docker-compose exec -u www-data app php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --tag="sanctum-migrations"

echo Running migrations and seeders...
docker-compose exec -u www-data app php artisan migrate --seed

echo Clearing caches...
docker-compose exec -u www-data app php artisan config:clear
docker-compose exec -u www-data app php artisan cache:clear

echo.
echo === Setup Complete ===
echo API: http://localhost:8000/api
echo PostgreSQL: localhost:5432
echo Redis: localhost:6379
echo.
pause
