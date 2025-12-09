# 🧪 RMD Inventory System (Docker Test Version)

This is a **Dockerized test setup** for the Resource Management Division Inventory System. It includes:

- Laravel API backend (`rmd-inventory-backend/`)
- React Vite frontend (`rmd-inventory-frontend/`)
- MySQL database
- Docker-based development environment

---

## 🚀 Quick Start Guide

### Prerequisites
- PHP 8.1+ with Composer
- Node.js 18+ with npm
- MySQL 8.0+ (or XAMPP)
- Git

### 1. 📥 Clone this repository

```bash
git clone https://github.com/RexorGutierrez22/RMD-GSU_IMS.git
cd RMD-GSU_IMS
```

### 2. 🔧 Backend Setup

```bash
cd server
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --port=8000
```

### 3. 🎨 Frontend Setup

```bash
cd client
npm install
npm run dev
```

The system will be available at:
- Frontend: [http://localhost:3010](http://localhost:3010)
- Backend API: [http://localhost:8000](http://localhost:8000)

### 4. 📊 Database Setup

Ensure MySQL is running and create the database:
```sql
CREATE DATABASE rmd_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then run migrations:
```bash
cd server
php artisan migrate
```

---

## 📦 Folder Structure

```
RMD-GSU_IMS/
├── rmd-inventory-backend/     # Laravel API
│   ├── app/
│   ├── routes/
│   ├── database/
│   └── Dockerfile
├── rmd-inventory-frontend/    # React (Vite)
│   ├── src/
│   ├── public/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Environment Configuration

### Backend Configuration (.env)
```env
APP_NAME=Laravel
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=rmd_inventory
DB_USERNAME=laravel
DB_PASSWORD=laravel
```

### CORS Configuration (config/cors.php)
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:3000'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
```

---

## 🛠 Development Notes

- Make sure Docker Desktop is running before starting the system
- All services run in isolated containers:
  - Backend: PHP 8.2 with Laravel
  - Frontend: Node.js with React + Vite
  - Database: MySQL 8.0
- No need to install PHP, Node.js, or MySQL locally
- API endpoints are accessible at `http://localhost:8000/api`
- Frontend dev server runs at `http://localhost:3010`

### Available API Endpoints

- POST `/api/login` - User authentication
- POST `/api/logout` - User logout (requires auth)
- GET `/api/inventory` - Get inventory items
- POST `/api/transactions/borrow` - Create borrow request
- And many more...

---

## ⚠️ Important Reminders

- Always check logs if services aren't responding
- Use `docker-compose down` to stop all services
- Use `docker-compose up -d` for detached mode
- Check `EMAIL-TESTING.md` for email notification setup
