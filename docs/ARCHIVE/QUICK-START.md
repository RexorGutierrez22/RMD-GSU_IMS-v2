# 🚀 Quick Start - Fix Database Connection

## ✅ What I've Fixed

1. **Updated APP_URL** in `.env` file to `http://localhost:8000`
2. **Created helper scripts** to diagnose and fix connection issues
3. **Added timeout handling** in AdminLogin.jsx (already done)

## 🔧 Step-by-Step Fix

### Step 1: Verify XAMPP is Running
- Open **XAMPP Control Panel**
- Ensure **Apache** and **MySQL** both show "Running" (green)
- If MySQL isn't running, click "Start"

### Step 2: Fix phpMyAdmin (If Stuck)
phpMyAdmin might be stuck due to:
- Browser cache issues
- Apache configuration

**Quick Fix:**
1. Clear browser cache: `Ctrl + Shift + Delete`
2. Try accessing: `http://127.0.0.1/phpmyadmin` (instead of localhost)
3. If still stuck, restart Apache in XAMPP Control Panel

### Step 3: Verify Database Exists
Run this PowerShell script to check:
```powershell
.\fix-database-connection.ps1
```

Or manually:
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Check if database `rmd_inventory` exists in left sidebar
3. If NOT, create it:
   - Click "New" button
   - Database name: `rmd_inventory`
   - Collation: `utf8mb4_unicode_ci`
   - Click "Create"

### Step 4: Start Backend Server
**Easy way:**
```bash
start-backend-server.bat
```

**Manual way:**
```bash
cd server
php artisan serve --port=8000
```

You should see:
```
Laravel development server started: http://127.0.0.1:8000
```

### Step 5: Test Connection
Open browser:
- `http://localhost:8000/api/test`
- Should show: `{"message":"API is working!"}`

### Step 6: Run Migrations (If Needed)
If database exists but tables are missing:
```bash
cd server
php artisan migrate
```

**⚠️ IMPORTANT:** This is SAFE - it only creates missing tables, won't destroy existing data!

### Step 7: Try Admin Login Again
1. Go to: `http://localhost:3010/admin`
2. Use credentials:
   - Username: `RMD_Staff` or `Rexor22`
   - Password: `rmd@admin`
3. Should now work without timeout!

## 🆘 Troubleshooting

### Backend Server Won't Start
**Port 8000 already in use?**
```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual number)
taskkill /PID <PID_NUMBER> /F
```

### phpMyAdmin Still Stuck
1. Try different browser (Chrome, Firefox, Edge)
2. Try: `http://127.0.0.1/phpmyadmin` instead of `localhost`
3. Check XAMPP error logs:
   - `C:\xampp\apache\logs\error.log`
   - `C:\xampp\mysql\data\*.err`

### Database Connection Still Failing
1. Verify MySQL is running in XAMPP
2. Check `.env` file database settings:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=rmd_inventory
   DB_USERNAME=root
   DB_PASSWORD=
   ```
3. Test MySQL directly:
   ```bash
   mysql -u root -h 127.0.0.1
   ```

## 📋 Files Created

1. **`fix-database-connection.ps1`** - Comprehensive diagnostic script
2. **`quick-fix-env.ps1`** - Quick .env fixer
3. **`start-backend-server.bat`** - Easy server starter
4. **`DATABASE-FIX-GUIDE.md`** - Detailed troubleshooting guide

## ✅ Checklist

- [ ] XAMPP MySQL is running
- [ ] Database `rmd_inventory` exists
- [ ] `.env` file has correct APP_URL (http://localhost:8000)
- [ ] Backend server is running on port 8000
- [ ] Can access `http://localhost:8000/api/test`
- [ ] Admin login works

## 🎯 Expected Results

After following these steps:
- ✅ phpMyAdmin should load normally
- ✅ Backend API responds at `http://localhost:8000/api/test`
- ✅ Admin login no longer times out
- ✅ Can successfully log into admin dashboard

---

**Need more help?** Check `DATABASE-FIX-GUIDE.md` for detailed troubleshooting!

