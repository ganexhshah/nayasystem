#!/bin/bash
set -e

echo "=== Naya System Backend Setup ==="

# Copy env
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

# Build and start containers
docker-compose up -d --build

echo "Waiting for containers to be ready..."
sleep 10

# Install dependencies
docker-compose exec app composer install

# Generate app key
docker-compose exec -u www-data app php artisan key:generate

# Publish vendor configs
docker-compose exec -u www-data app php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
docker-compose exec -u www-data app php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --tag="sanctum-migrations"

# Run migrations
docker-compose exec -u www-data app php artisan migrate --seed

# Clear caches
docker-compose exec -u www-data app php artisan config:clear
docker-compose exec -u www-data app php artisan cache:clear

echo ""
echo "=== Setup Complete ==="
echo "API running at: http://localhost:8000"
echo "PostgreSQL: localhost:5432"
echo "Redis: localhost:6379"
