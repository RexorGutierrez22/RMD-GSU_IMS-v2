# 🧪 RMD-GSU Inventory Management System

A comprehensive Inventory Management System for the Resource Management Division (RMD) at GSU, built with Laravel backend and React frontend.

---

## 🚀 Quick Start Guide

### Prerequisites

Before you begin, ensure you have the following installed:

- **PHP 8.1+** with Composer
- **Node.js 18+** with npm
- **MySQL 8.0+** (or XAMPP/WAMP)
- **Git**

---

## 📥 Step 1: Clone the Repository

```bash
git clone https://github.com/RexorGutierrez22/RMD-GSU_IMS-v2.git
cd RMD-GSU_IMS-v2
```

---

## 🔧 Step 2: Backend Setup (Laravel)

### 2.1 Install PHP Dependencies

```bash
cd server
composer install
```

### 2.2 Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 2.3 Configure Database

1. **Create MySQL Database:**
   ```sql
   CREATE DATABASE rmd_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Update `.env` file** with your database credentials:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=rmd_inventory
   DB_USERNAME=root
   DB_PASSWORD=your_password
   ```

### 2.4 Run Migrations

```bash
php artisan migrate
php artisan db:seed
```

### 2.5 Start Backend Server

```bash
php artisan serve --port=8000
```

The backend API will be available at: `http://localhost:8000`

---

## 🎨 Step 3: Frontend Setup (React)

### 3.1 Install Node Dependencies

```bash
cd client
npm install
```

### 3.2 Configure Environment

```bash
# Copy the example environment file (if not exists)
cp .env.example .env
```

**Update `client/.env`** to match your backend URL:
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=RMD Inventory System
```

### 3.3 Start Frontend Development Server

```bash
npm run dev
```

The frontend will be available at: `http://localhost:5173` (or the port shown in terminal)

---

## ✅ Step 4: Verify Installation

1. **Backend API Test:**
   - Open: `http://localhost:8000/api/test`
   - Should return: `{"message":"API is working!"}`

2. **Frontend:**
   - Open: `http://localhost:5173`
   - Should see the landing page

---

## 🔑 Default Credentials

### Super Admin
- **Username:** `superadmin@usep.edu.ph`
- **Password:** Check with your team lead

### Admin/Staff
- **Username:** `RMD_Staff` or `Rexor22`
- **Password:** `rmd@admin`

> ⚠️ **Important:** Change default passwords in production!

---

## 📁 Project Structure

```
RMD-GSU_IMS-v2/
├── server/                 # Laravel Backend
│   ├── app/               # Application logic
│   ├── database/          # Migrations & Seeders
│   ├── routes/            # API routes
│   └── config/            # Configuration files
│
├── client/                # React Frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── package.json       # Dependencies
│
└── docs/                  # Documentation
```

---

## 🛠️ Common Issues & Solutions

### Backend Issues

**Problem:** `SQLSTATE[HY000] [2002] Connection refused`
- **Solution:** Ensure MySQL is running (XAMPP Control Panel)

**Problem:** `Class 'PDO' not found`
- **Solution:** Install PHP PDO extension: `sudo apt-get install php-pdo`

**Problem:** `500 Internal Server Error`
- **Solution:** Check `.env` file exists and has correct database credentials

### Frontend Issues

**Problem:** `Cannot connect to API`
- **Solution:** 
  1. Ensure backend is running on port 8000
  2. Check `client/.env` has correct `VITE_API_URL`
  3. Restart frontend dev server after changing `.env`

**Problem:** `Module not found` errors
- **Solution:** Run `npm install` again in `client/` directory

---

## 📧 Email Configuration (Optional)

To enable email notifications, update `server/.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@usep.edu.ph
MAIL_FROM_NAME="${APP_NAME}"
```

---

## 🔄 Updating the Code

When pulling latest changes:

```bash
# Backend
cd server
composer install
php artisan migrate

# Frontend
cd client
npm install
```

---

## 📚 Additional Documentation

- **Email Setup:** See `EMAIL-TESTING.md`
- **Cleanup Summary:** See `CLEANUP_SUMMARY.md`
- **Archived Docs:** See `docs/ARCHIVE/`

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Create a Pull Request

---

## 📝 License

This project is for internal use by RMD-GSU.

---

## 🆘 Need Help?

- Check the troubleshooting section above
- Review documentation in `docs/` folder
- Contact your team lead

---

**Happy Coding! 🚀**

