# Naya System - Backend API

Laravel 11 REST API for the Naya Restaurant Management System.

## Stack
- PHP 8.2 + Laravel 11
- PostgreSQL 15
- Redis 7
- Docker (Nginx + PHP-FPM)
- Laravel Sanctum (auth)
- Spatie Permission (roles)
- DomPDF (invoices)
- Intervention Image (uploads)
- Cloudflare R2 / AWS S3 (storage)

## Quick Start

```bash
# 1. Clone and enter backend directory
cd C:\Users\Ganesh shah\nayasytem\backend

# 2. Copy env and configure
cp .env.example .env
# Edit .env: set DB credentials, R2/S3 keys, FRONTEND_URL

# 3. Start Docker
docker-compose up -d --build

# 4. Install dependencies
docker-compose exec app composer install

# 5. Generate key & migrate
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan migrate --seed

# 6. Publish Spatie Permission tables
docker-compose exec app php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
docker-compose exec app php artisan migrate
```

API is available at **http://localhost:8000/api**

## Roles
| Role | Access |
|------|--------|
| owner | Full access |
| manager | All except staff/settings |
| cashier | POS, orders, payments |
| waiter | POS, orders, tables |
| kitchen | KOT management |
| delivery | View orders |

## Key Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/dashboard
GET    /api/menu-items
GET    /api/orders
POST   /api/pos/orders
GET    /api/reports/sales?from=2024-01-01&to=2024-01-31
POST   /api/orders/{id}/invoice   (PDF download)
```

## Storage (Cloudflare R2)
Set these in `.env`:
```
AWS_ACCESS_KEY_ID=your_r2_key
AWS_SECRET_ACCESS_KEY=your_r2_secret
AWS_BUCKET=your_bucket
AWS_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
AWS_DEFAULT_REGION=auto
AWS_USE_PATH_STYLE_ENDPOINT=true
```

## Mail Notifications
The backend now sends transactional emails for:
- Owner welcome (signup/google first login)
- Staff welcome + role update
- Password reset + password changed confirmation
- Invoice generated
- Subscription updates (subscribe, renew, cancel, admin changes, issue alerts)
- Branch added notifications (from settings branch list)
- Payment receipt + due payment reminders
- Weekly and monthly summary updates

### Mail Scheduler Commands
```bash
php artisan mail:send-due-payment-reminders
php artisan mail:send-weekly-updates
php artisan mail:send-monthly-updates
```
