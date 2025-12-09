# 💾 How the Automated Backup System Works

## 📖 Overview

The automated backup system uses the **Spatie Laravel Backup** package to create scheduled backups of your database and application files. The system is fully configured and ready to use once the package is installed.

---

## 🔄 How It Works

### **1. Daily Database Backups (2:00 AM)**

**What Happens:**
```
Every day at 2:00 AM (Asia/Manila timezone):
1. System checks for scheduled tasks
2. Runs: php artisan backup:database
3. Command executes: backup:run --only-db
4. Creates SQL dump of your MySQL database
5. Compresses it into a ZIP file
6. Saves to: storage/app/backups/
7. Logs the result
```

**Backup File Format:**
- `backup-database-YYYY-MM-DD-HH-MM-SS.zip`
- Contains: `database-dumps/mysql.sql`

**Example:**
- `backup-database-2025-11-29-02-00-15.zip`

---

### **2. Weekly Full System Backups (Sunday 3:00 AM)**

**What Happens:**
```
Every Sunday at 3:00 AM (Asia/Manila timezone):
1. System checks for scheduled tasks
2. Runs: php artisan backup:full
3. Command executes: backup:run (full backup)
4. Creates SQL dump of database
5. Copies application files (excluding vendor, node_modules, etc.)
6. Compresses everything into a ZIP file
7. Saves to: storage/app/backups/
8. Logs the result
```

**Backup File Format:**
- `backup-full-YYYY-MM-DD-HH-MM-SS.zip`
- Contains:
  - `database-dumps/mysql.sql`
  - `app/` (application files)
  - `config/` (configuration files)
  - `routes/` (route files)
  - `database/` (migrations, seeders)
  - Other important files

**Example:**
- `backup-full-2025-12-01-03-00-22.zip`

---

### **3. Automatic Cleanup (4:00 AM Daily)**

**What Happens:**
```
Every day at 4:00 AM:
1. System runs: php artisan backup:clean
2. Checks all backup files
3. Applies retention policy:
   - Removes backups older than 7 days (if not daily/weekly/monthly)
   - Keeps daily backups for 16 days
   - Keeps weekly backups for 8 weeks
   - Keeps monthly backups for 4 months
   - Keeps yearly backups for 2 years
4. Ensures total backup size doesn't exceed 5000 MB (5 GB)
5. Deletes old backups automatically
6. Logs cleanup actions
```

**Retention Policy:**
- **All backups:** 7 days minimum
- **Daily backups:** 16 days
- **Weekly backups:** 8 weeks (56 days)
- **Monthly backups:** 4 months
- **Yearly backups:** 2 years
- **Maximum storage:** 5000 MB (5 GB)

---

## 🎯 The Complete Flow

### **Daily Schedule:**

```
2:00 AM → Database Backup
         ↓
         Creates: backup-database-YYYY-MM-DD-02-00-XX.zip
         ↓
         Saves to: storage/app/backups/
         ↓
         Logs success/failure

4:00 AM → Cleanup
         ↓
         Checks all backups
         ↓
         Removes old backups based on retention policy
         ↓
         Ensures storage limit (5 GB)
         ↓
         Logs cleanup actions
```

### **Weekly Schedule (Sunday):**

```
3:00 AM → Full System Backup
         ↓
         Creates: backup-full-YYYY-MM-DD-03-00-XX.zip
         ↓
         Includes: Database + All Application Files
         ↓
         Saves to: storage/app/backups/
         ↓
         Logs success/failure
```

---

## 📁 What Gets Backed Up

### **Database Backup Includes:**
- ✅ All database tables
- ✅ All data
- ✅ Database structure
- ✅ Indexes and constraints

### **Full Backup Includes:**
- ✅ Database (complete dump)
- ✅ Application code (`app/` directory)
- ✅ Configuration files (`config/`)
- ✅ Routes (`routes/`)
- ✅ Migrations (`database/migrations/`)
- ✅ Seeders (`database/seeders/`)
- ✅ Models (`app/Models/`)
- ✅ Controllers (`app/Http/Controllers/`)
- ✅ Views (`resources/views/`)
- ✅ Public assets (`public/` - if configured)

### **What's Excluded:**
- ❌ `vendor/` (can be reinstalled via composer)
- ❌ `node_modules/` (can be reinstalled via npm)
- ❌ `storage/app/backups/` (backup directory itself)
- ❌ `storage/framework/cache/` (temporary cache)
- ❌ `storage/framework/sessions/` (temporary sessions)
- ❌ `storage/framework/views/` (compiled views)
- ❌ `storage/logs/` (log files)
- ❌ `.git/` (version control)
- ❌ `.env` (environment file - sensitive)

---

## 🔧 How the Commands Work

### **1. `backup:database` Command**

**Location:** `server/app/Console/Commands/BackupDatabase.php`

**What It Does:**
```php
1. Calls: Artisan::call('backup:run', ['--only-db' => true])
2. Spatie package creates database dump
3. Compresses to ZIP
4. Saves to configured disk
5. Logs the result
6. Returns success/failure status
```

**Manual Usage:**
```bash
php artisan backup:database
```

---

### **2. `backup:full` Command**

**Location:** `server/app/Console/Commands/BackupFull.php`

**What It Does:**
```php
1. Calls: Artisan::call('backup:run')
2. Spatie package creates:
   - Database dump
   - File backup (all included files)
3. Compresses everything to ZIP
4. Saves to configured disk
5. Logs the result
6. Returns success/failure status
```

**Manual Usage:**
```bash
php artisan backup:full
```

---

### **3. `backup:clean` Command**

**Built-in Spatie Command**

**What It Does:**
```php
1. Scans backup directory
2. Applies retention strategy
3. Deletes old backups based on:
   - Age (days/weeks/months/years)
   - Storage limit (5 GB)
4. Keeps backups according to policy
5. Logs cleanup actions
```

**Manual Usage:**
```bash
php artisan backup:clean
```

---

## 📊 Backup File Structure

### **Database Backup ZIP Contents:**
```
backup-database-2025-11-29-02-00-15.zip
└── database-dumps/
    └── mysql.sql          (Complete database dump)
```

### **Full Backup ZIP Contents:**
```
backup-full-2025-12-01-03-00-22.zip
├── database-dumps/
│   └── mysql.sql          (Complete database dump)
├── app/
│   ├── Console/
│   ├── Http/
│   ├── Models/
│   └── ...
├── config/
│   ├── app.php
│   ├── database.php
│   └── ...
├── routes/
│   └── api.php
├── database/
│   ├── migrations/
│   └── seeders/
└── ... (other application files)
```

---

## 🔔 Email Notifications

### **When Emails Are Sent:**

1. **Backup Fails** ❌
   - Sent to: `BACKUP_EMAIL` (from .env) or `MAIL_FROM_ADDRESS`
   - Subject: "Backup Failed - [App Name]"
   - Includes: Error details, timestamp

2. **Unhealthy Backup Found** ⚠️
   - Sent when: Backup is too old or storage limit exceeded
   - Subject: "Unhealthy Backup Detected"
   - Includes: Health check details

3. **Cleanup Fails** ❌
   - Sent when: Old backup cleanup fails
   - Subject: "Backup Cleanup Failed"
   - Includes: Error details

### **When Emails Are NOT Sent:**
- ✅ Successful backups (to avoid spam)
- ✅ Successful cleanup
- ✅ Healthy backups found

---

## 🗄️ Storage Location

### **Default Storage:**
- **Path:** `server/storage/app/backups/`
- **Disk:** `local` (configurable)
- **Format:** ZIP files

### **Cloud Storage (Optional):**
You can configure cloud storage in `config/backup.php`:
```php
'disks' => [
    'local',
    's3',  // AWS S3
    // or 'google', 'dropbox', etc.
],
```

---

## 📈 Monitoring & Health Checks

### **Automatic Health Monitoring:**

The system automatically monitors backups and checks:

1. **Maximum Age:** Backups must be less than 1 day old
2. **Maximum Storage:** Total backups must be less than 5000 MB

### **Check Backup Health:**
```bash
php artisan backup:monitor
```

**Output:**
- ✅ Healthy: All backups are recent and within limits
- ⚠️ Unhealthy: Issues detected (sends email notification)

---

## 🛠️ Manual Operations

### **Create Backup Now:**
```bash
# Database only
php artisan backup:database

# Full system
php artisan backup:full
```

### **List All Backups:**
```bash
php artisan backup:list
```

### **Clean Old Backups:**
```bash
php artisan backup:clean
```

### **Monitor Backup Health:**
```bash
php artisan backup:monitor
```

### **View Scheduled Tasks:**
```bash
php artisan schedule:list
```

---

## 🔍 How to Verify It's Working

### **Step 1: Check if Package is Installed**
```bash
cd server
composer show spatie/laravel-backup
```

### **Step 2: Test Manual Backup**
```bash
php artisan backup:database
```

**Expected Output:**
```
🗄️  Starting database backup...
✅ Database backup completed successfully
```

### **Step 3: Check Backup Files**
```bash
# Windows
dir server\storage\app\backups

# Linux/Mac
ls -lh server/storage/app/backups
```

**Expected:** ZIP files with timestamps

### **Step 4: Check Logs**
```bash
# View recent backup logs
tail -f server/storage/logs/laravel.log | grep backup
```

### **Step 5: Verify Scheduler**
```bash
php artisan schedule:list
```

**Expected Output:**
```
overdue:check ................... Next Due: 9 hours from now
backup:database ................. Next Due: 14 hours from now
backup:full ..................... Next Due: 6 days from now
backup:clean .................... Next Due: 16 hours from now
```

---

## 🚨 Troubleshooting

### **Backup Not Running?**

1. **Check Scheduler:**
   ```bash
   php artisan schedule:run
   ```

2. **Check Logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

3. **Verify Package:**
   ```bash
   composer show spatie/laravel-backup
   ```

4. **Check Permissions:**
   ```bash
   # Ensure backup directory is writable
   chmod -R 775 storage/app/backups
   ```

### **Backup Fails?**

1. **Check Database Connection:**
   - Verify `.env` database credentials
   - Test: `php artisan tinker` then `DB::connection()->getPdo();`

2. **Check Disk Space:**
   ```bash
   df -h  # Linux/Mac
   # or check drive space on Windows
   ```

3. **Check Permissions:**
   - Backup directory must be writable
   - Database user must have SELECT privileges

### **No Email Notifications?**

1. **Check Mail Configuration:**
   - Verify `.env` mail settings
   - Test: `php artisan tinker` then send test email

2. **Check Backup Email:**
   - Verify `BACKUP_EMAIL` in `.env`
   - Defaults to `MAIL_FROM_ADDRESS`

---

## 📋 Daily Operations Flow

### **What Happens Automatically:**

```
┌─────────────────────────────────────────┐
│ 2:00 AM - Database Backup              │
├─────────────────────────────────────────┤
│ ✓ Check scheduled tasks                │
│ ✓ Run backup:database                  │
│ ✓ Create database dump                  │
│ ✓ Compress to ZIP                      │
│ ✓ Save to storage/app/backups/          │
│ ✓ Log result                           │
│ ✓ Send email if fails                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 4:00 AM - Cleanup                      │
├─────────────────────────────────────────┤
│ ✓ Check scheduled tasks                │
│ ✓ Run backup:clean                     │
│ ✓ Scan backup directory                │
│ ✓ Apply retention policy               │
│ ✓ Delete old backups                   │
│ ✓ Check storage limit                  │
│ ✓ Log cleanup actions                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Sunday 3:00 AM - Full Backup            │
├─────────────────────────────────────────┤
│ ✓ Check scheduled tasks                │
│ ✓ Run backup:full                      │
│ ✓ Create database dump                  │
│ ✓ Copy application files               │
│ ✓ Compress everything to ZIP           │
│ ✓ Save to storage/app/backups/          │
│ ✓ Log result                           │
│ ✓ Send email if fails                  │
└─────────────────────────────────────────┘
```

---

## 🔐 Security Features

1. **Backup Encryption (Optional):**
   - Set `BACKUP_PASSWORD` in `.env`
   - Backups will be encrypted with password

2. **Secure Storage:**
   - Backups stored in `storage/app/backups/`
   - Not accessible via web (outside public directory)
   - Can be moved to cloud storage

3. **Access Control:**
   - Only system can create backups
   - Requires proper permissions
   - Logs all backup operations

---

## 📊 Backup Statistics

### **Typical Backup Sizes:**
- **Database only:** 1-50 MB (depends on data)
- **Full system:** 10-200 MB (depends on files)

### **Storage Requirements:**
- **Daily backups (16 days):** ~800 MB - 8 GB
- **Weekly backups (8 weeks):** ~80 MB - 1.6 GB
- **Monthly backups (4 months):** ~40 MB - 800 MB
- **Total estimated:** ~1-10 GB (with cleanup)

---

## 🎯 Key Benefits

1. **Automated:** No manual intervention needed
2. **Reliable:** Runs on schedule automatically
3. **Safe:** Doesn't affect existing system
4. **Flexible:** Can run manually anytime
5. **Monitored:** Health checks and notifications
6. **Organized:** Automatic cleanup of old backups
7. **Recoverable:** Easy to restore from backups

---

## 🔄 Restore Process

### **Restore Database:**
```bash
# 1. Extract backup
unzip backup-database-YYYY-MM-DD-HH-MM-SS.zip

# 2. Import database
mysql -u username -p database_name < database-dumps/mysql.sql
```

### **Restore Full System:**
```bash
# 1. Extract backup
unzip backup-full-YYYY-MM-DD-HH-MM-SS.zip

# 2. Restore files
# Copy files to appropriate locations

# 3. Import database (same as above)
```

---

## ✅ Summary

**The backup system works by:**
1. ✅ Running scheduled tasks automatically
2. ✅ Creating database dumps and file backups
3. ✅ Compressing backups to ZIP files
4. ✅ Storing in secure location
5. ✅ Cleaning up old backups automatically
6. ✅ Monitoring backup health
7. ✅ Sending notifications on failures

**Once the package is installed, everything runs automatically!**

---

**Last Updated:** System Implementation
**Status:** ✅ Ready to Use (after package installation)
