# 📊 Backup System - Quick Summary

## 🎯 What It Does

Automatically backs up your database and files on a schedule, so you never lose data.

---

## ⏰ Schedule Overview

```
┌─────────────────────────────────────────────────────────┐
│                    DAILY SCHEDULE                        │
├─────────────────────────────────────────────────────────┤
│ 2:00 AM  →  Database Backup                             │
│            (Creates SQL dump, saves as ZIP)              │
│                                                          │
│ 4:00 AM  →  Cleanup Old Backups                         │
│            (Removes backups older than retention)       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  WEEKLY SCHEDULE                        │
├─────────────────────────────────────────────────────────┤
│ Sunday 3:00 AM  →  Full System Backup                   │
│                     (Database + All Files)             │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 How It Works (Step by Step)

### **Daily Database Backup (2:00 AM)**

```
1. Scheduler triggers at 2:00 AM
   ↓
2. Runs: php artisan backup:database
   ↓
3. Creates MySQL database dump
   ↓
4. Compresses to ZIP file
   ↓
5. Saves to: storage/app/backups/
   ↓
6. Logs result
   ↓
7. Sends email if fails
```

**Result:** `backup-database-2025-11-29-02-00-15.zip`

---

### **Weekly Full Backup (Sunday 3:00 AM)**

```
1. Scheduler triggers Sunday at 3:00 AM
   ↓
2. Runs: php artisan backup:full
   ↓
3. Creates MySQL database dump
   ↓
4. Copies all application files
   ↓
5. Compresses everything to ZIP
   ↓
6. Saves to: storage/app/backups/
   ↓
7. Logs result
   ↓
8. Sends email if fails
```

**Result:** `backup-full-2025-12-01-03-00-22.zip`

---

### **Daily Cleanup (4:00 AM)**

```
1. Scheduler triggers at 4:00 AM
   ↓
2. Runs: php artisan backup:clean
   ↓
3. Scans backup directory
   ↓
4. Applies retention policy:
   • Keeps daily backups: 16 days
   • Keeps weekly backups: 8 weeks
   • Keeps monthly backups: 4 months
   • Keeps yearly backups: 2 years
   • Max storage: 5 GB
   ↓
5. Deletes old backups
   ↓
6. Logs cleanup actions
```

---

## 📁 What Gets Backed Up

### **Database Backup:**
- ✅ All tables
- ✅ All data
- ✅ Database structure

### **Full Backup:**
- ✅ Database (complete)
- ✅ Application code
- ✅ Configuration files
- ✅ Routes
- ✅ Migrations
- ✅ Models & Controllers
- ✅ Views

### **Excluded:**
- ❌ vendor/ (can reinstall)
- ❌ node_modules/ (can reinstall)
- ❌ Cache files
- ❌ Log files
- ❌ .env file

---

## 📍 Where Backups Are Stored

```
server/
└── storage/
    └── app/
        └── backups/
            ├── backup-database-2025-11-29-02-00-15.zip
            ├── backup-database-2025-11-30-02-00-18.zip
            ├── backup-full-2025-12-01-03-00-22.zip
            └── ...
```

---

## 🛠️ Manual Commands

```bash
# Create database backup now
php artisan backup:database

# Create full backup now
php artisan backup:full

# Clean old backups now
php artisan backup:clean

# List all backups
php artisan backup:list

# Check backup health
php artisan backup:monitor

# View scheduled tasks
php artisan schedule:list
```

---

## 🔔 Notifications

**Emails sent when:**
- ❌ Backup fails
- ⚠️ Unhealthy backup detected
- ❌ Cleanup fails

**No emails for:**
- ✅ Successful backups (to avoid spam)
- ✅ Successful cleanup

---

## 📊 Retention Policy

| Backup Type | Kept For |
|------------|----------|
| All backups | 7 days minimum |
| Daily backups | 16 days |
| Weekly backups | 8 weeks |
| Monthly backups | 4 months |
| Yearly backups | 2 years |
| **Max Storage** | **5 GB** |

---

## ✅ How to Verify It's Working

### **1. Test Manual Backup:**
```bash
php artisan backup:database
```
**Expected:** ✅ Success message

### **2. Check Backup Files:**
```bash
# Windows
dir server\storage\app\backups

# Linux/Mac
ls -lh server/storage/app/backups
```
**Expected:** ZIP files with timestamps

### **3. Check Scheduled Tasks:**
```bash
php artisan schedule:list
```
**Expected:** Shows all scheduled backups

### **4. Check Logs:**
```bash
tail -f server/storage/logs/laravel.log | grep backup
```
**Expected:** Backup operation logs

---

## 🚨 Troubleshooting

### **Backup Not Running?**
1. Check if package is installed: `composer show spatie/laravel-backup`
2. Run scheduler manually: `php artisan schedule:run`
3. Check logs: `tail -f storage/logs/laravel.log`

### **Backup Fails?**
1. Check database connection in `.env`
2. Check disk space
3. Check directory permissions: `chmod -R 775 storage/app/backups`

### **No Email Notifications?**
1. Check mail configuration in `.env`
2. Verify `BACKUP_EMAIL` is set

---

## 🎯 Key Points

✅ **Fully Automated** - Runs on schedule, no manual work needed
✅ **Safe** - Doesn't affect existing system
✅ **Reliable** - Error handling and logging
✅ **Organized** - Automatic cleanup of old backups
✅ **Monitored** - Health checks and notifications
✅ **Recoverable** - Easy to restore from backups

---

## 📋 Next Steps

1. **Install Package:**
   ```bash
   cd server
   composer require spatie/laravel-backup
   ```

2. **Test Backup:**
   ```bash
   php artisan backup:database
   ```

3. **Set Up Scheduler:**
   - Windows: Task Scheduler
   - Linux: Crontab

4. **Monitor:**
   - Check logs regularly
   - Verify backups are created
   - Test restore procedure

---

**That's it! Once installed, the system runs automatically.** 🚀

