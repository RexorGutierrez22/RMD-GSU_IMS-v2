# 🚀 Backup System - Quick Start Guide

## Installation (One-Time Setup)

### 1. Install Package
```bash
cd server
composer require spatie/laravel-backup
```

### 2. Publish Configuration (Optional - we already created it)
```bash
php artisan vendor:publish --provider="Spatie\Backup\BackupServiceProvider"
```

### 3. Create Backup Directory
```bash
mkdir -p storage/app/backups
```

### 4. Test Backup
```bash
php artisan backup:database
```

## What's Already Configured ✅

- ✅ Backup configuration file (`config/backup.php`)
- ✅ Database backup command (`backup:database`)
- ✅ Full backup command (`backup:full`)
- ✅ Scheduled tasks in Kernel.php:
  - Daily database backup: 2:00 AM
  - Weekly full backup: Sunday 3:00 AM
  - Daily cleanup: 4:00 AM

## Environment Variables (Optional)

Add to `.env`:
```env
BACKUP_EMAIL=admin@usep.edu.ph
BACKUP_PASSWORD=null
```

## Manual Commands

```bash
# Database backup only
php artisan backup:database

# Full system backup
php artisan backup:full

# Clean old backups
php artisan backup:clean

# List all backups
php artisan backup:list

# Monitor backup health
php artisan backup:monitor
```

## Scheduler Setup

### Windows (Development)
Run manually for testing:
```bash
php artisan schedule:run
```

Or set up Windows Task Scheduler to run this every minute.

### Linux/Production
Add to crontab:
```bash
* * * * * cd /path/to/server && php artisan schedule:run >> /dev/null 2>&1
```

## Backup Location
Backups are stored in: `storage/app/backups/`

## That's It! 🎉
Once the package is installed and scheduler is running, backups will happen automatically.

