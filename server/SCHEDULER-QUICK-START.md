# ⚡ Quick Start: Laravel Scheduler Setup

## 🎯 What You Need to Do

### 1. Fix MySQL Path (5 minutes)

**Option A:** Add MySQL to PATH
- Find MySQL bin folder (usually `C:\xampp\mysql\bin`)
- Add to Windows PATH (System Properties → Environment Variables)
- Restart terminal

**Option B:** Add to `.env` file:
```env
DB_DUMP_PATH="C:/xampp/mysql/bin/mysqldump.exe"
```

### 2. Set Up Task Scheduler (10 minutes)

**Easiest Method:**
1. Run `setup-scheduler.bat` as Administrator
2. Done!

**Manual Method:**
1. Open Task Scheduler (`Win + R` → `taskschd.msc`)
2. Create Basic Task → Name: "Laravel Scheduler"
3. Trigger: "When computer starts" + Repeat every 1 minute
4. Action: Start program → `php` → Arguments: `artisan schedule:run`
5. Start in: `C:\Users\USER\Desktop\Projects\PULL\RMD-GSU_IMS\server`
6. Run with highest privileges

### 3. Test It (2 minutes)

```bash
cd server
php artisan schedule:run
php artisan backup:database
```

### 4. Verify (1 minute)

- Check `storage/app/backups/` for backup files
- Check Task Scheduler → "Laravel Scheduler" → Last Run Result should be "0x0"

---

## ✅ That's It!

Your backups will now run automatically:
- **Daily** at 2:00 AM (database)
- **Weekly** on Sunday at 3:00 AM (full backup)
- **Daily** at 4:00 AM (cleanup)

---

**Need help?** See `SCHEDULER-SETUP-GUIDE.md` for detailed instructions.

