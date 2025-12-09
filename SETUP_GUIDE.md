# 🚀 Complete Setup Guide for Team Members

This guide will help your teammates clone and run the project smoothly.

---

## ✅ Pre-Flight Checklist

Before starting, ensure you have:

- [ ] PHP 8.1+ installed (`php -v`)
- [ ] Composer installed (`composer --version`)
- [ ] Node.js 18+ installed (`node -v`)
- [ ] npm installed (`npm -v`)
- [ ] MySQL 8.0+ running (XAMPP/WAMP or standalone)
- [ ] Git installed (`git --version`)

---

## 📥 Step-by-Step Setup

### 1. Clone Repository

```bash
git clone https://github.com/RexorGutierrez22/RMD-GSU_IMS-v2.git
cd RMD-GSU_IMS-v2
```

---

### 2. Backend Setup (Laravel)

#### 2.1 Install Dependencies

```bash
cd server
composer install
```

**Expected output:** Dependencies will be installed. This may take 2-5 minutes.

#### 2.2 Create Environment File

```bash
cp .env.example .env
```

#### 2.3 Generate Application Key

```bash
php artisan key:generate
```

**Expected output:** `Application key set successfully.`

#### 2.4 Create Database

**Option A: Using phpMyAdmin (XAMPP)**
1. Open: `http://localhost/phpmyadmin`
2. Click "New" button
3. Database name: `rmd_inventory`
4. Collation: `utf8mb4_unicode_ci`
5. Click "Create"

**Option B: Using MySQL Command Line**
```sql
CREATE DATABASE rmd_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2.5 Configure Database in .env

Open `server/.env` and update:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rmd_inventory
DB_USERNAME=root
DB_PASSWORD=          # Leave empty if no password, or enter your MySQL password
```

#### 2.6 Run Migrations

```bash
php artisan migrate
```

**Expected output:** All tables created successfully.

#### 2.7 Seed Database (Optional - adds sample data)

```bash
php artisan db:seed
```

#### 2.8 Start Backend Server

```bash
php artisan serve --port=8000
```

**Expected output:**
```
Laravel development server started: http://127.0.0.1:8000
```

**✅ Test Backend:**
- Open browser: `http://localhost:8000/api/test`
- Should see: `{"message":"API is working!"}`

---

### 3. Frontend Setup (React)

#### 3.1 Install Dependencies

Open a **NEW terminal window** (keep backend running):

```bash
cd client
npm install
```

**Expected output:** Dependencies installed. This may take 2-5 minutes.

#### 3.2 Configure Environment

```bash
cp .env.example .env
```

**Verify `client/.env` contains:**
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=RMD Inventory System
```

#### 3.3 Start Frontend Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**✅ Test Frontend:**
- Open browser: `http://localhost:5173`
- Should see the landing page

---

## 🎯 Verification Steps

### ✅ Backend Working?
- [ ] `http://localhost:8000/api/test` returns JSON
- [ ] No errors in terminal
- [ ] Database connection successful

### ✅ Frontend Working?
- [ ] Landing page loads
- [ ] No console errors (F12 → Console tab)
- [ ] Can navigate to registration pages

### ✅ Integration Working?
- [ ] Can register a student/employee
- [ ] Can log in as admin
- [ ] Dashboard loads without errors

---

## 🐛 Troubleshooting

### Backend Issues

**Error: `SQLSTATE[HY000] [2002] Connection refused`**
- ✅ **Fix:** Start MySQL service (XAMPP Control Panel → Start MySQL)

**Error: `Class 'PDO' not found`**
- ✅ **Fix:** Install PHP PDO extension
  - Windows: Enable in `php.ini`: `extension=pdo_mysql`
  - Linux: `sudo apt-get install php-pdo php-mysql`

**Error: `500 Internal Server Error`**
- ✅ **Fix:** 
  1. Check `.env` file exists in `server/` folder
  2. Verify database credentials in `.env`
  3. Run `php artisan config:clear`

**Error: `Port 8000 already in use`**
- ✅ **Fix:** 
  ```bash
  # Find process using port 8000
  netstat -ano | findstr :8000
  
  # Kill process (replace PID)
  taskkill /PID <PID_NUMBER> /F
  
  # Or use different port
  php artisan serve --port=8001
  ```

### Frontend Issues

**Error: `Cannot connect to API` or `Network Error`**
- ✅ **Fix:**
  1. Ensure backend is running on port 8000
  2. Check `client/.env` has: `VITE_API_URL=http://localhost:8000/api`
  3. Restart frontend server after changing `.env`
  4. Clear browser cache (Ctrl+Shift+Delete)

**Error: `Module not found`**
- ✅ **Fix:**
  ```bash
  cd client
  rm -rf node_modules package-lock.json
  npm install
  ```

**Error: `Port 5173 already in use`**
- ✅ **Fix:** Vite will automatically use next available port (5174, 5175, etc.)

**Blank Page / White Screen**
- ✅ **Fix:**
  1. Check browser console (F12) for errors
  2. Verify backend is running
  3. Check `VITE_API_URL` in `.env` matches backend port
  4. Try hard refresh: Ctrl+Shift+R

---

## 📋 Quick Commands Reference

### Backend
```bash
cd server
composer install              # Install dependencies
php artisan key:generate      # Generate app key
php artisan migrate           # Run migrations
php artisan db:seed          # Seed database
php artisan serve            # Start server
php artisan config:clear     # Clear config cache
```

### Frontend
```bash
cd client
npm install                   # Install dependencies
npm run dev                  # Start dev server
npm run build                # Build for production
```

---

## 🔄 Daily Workflow

### Starting Development

1. **Start MySQL** (XAMPP Control Panel)
2. **Start Backend:**
   ```bash
   cd server
   php artisan serve --port=8000
   ```
3. **Start Frontend** (new terminal):
   ```bash
   cd client
   npm run dev
   ```

### Pulling Latest Changes

```bash
git pull origin main

# Backend
cd server
composer install
php artisan migrate

# Frontend
cd client
npm install
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Backend API responds at `http://localhost:8000/api/test`
2. ✅ Frontend loads at `http://localhost:5173`
3. ✅ Can register students/employees
4. ✅ Can log in as admin
5. ✅ Dashboard displays without errors
6. ✅ No red errors in browser console

---

## 🆘 Still Having Issues?

1. **Check logs:**
   - Backend: `server/storage/logs/laravel.log`
   - Frontend: Browser console (F12)

2. **Verify versions:**
   ```bash
   php -v        # Should be 8.1+
   node -v       # Should be 18+
   composer -v   # Should be latest
   ```

3. **Contact team lead** with:
   - Error messages
   - Steps you've taken
   - Screenshots if possible

---

**Happy Coding! 🚀**

