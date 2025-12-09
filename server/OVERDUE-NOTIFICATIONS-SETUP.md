# 📧 Automated Overdue Notifications Setup Guide

## Overview
This system automatically checks for overdue items daily and sends email notifications to all registered admins and staff members.

## Features
- ✅ Daily automated check for overdue items
- ✅ Automatic marking of overdue transactions
- ✅ Email notifications to all admins/staff
- ✅ Professional email template with detailed information
- ✅ Safe implementation - doesn't affect existing routes or connections

## Files Created

### 1. Console Command
- **Location:** `server/app/Console/Commands/CheckOverdueItems.php`
- **Purpose:** Checks for overdue items and sends notifications
- **Command:** `php artisan overdue:check`

### 2. Email Notification
- **Location:** `server/app/Mail/OverdueItemsNotification.php`
- **Purpose:** Mailable class for overdue items email

### 3. Email Template
- **Location:** `server/resources/views/emails/overdue-items-notification.blade.php`
- **Purpose:** HTML email template for overdue notifications

### 4. Scheduler Configuration
- **Location:** `server/app/Console/Kernel.php`
- **Schedule:** Daily at 9:00 AM (Asia/Manila timezone)

## Setup Instructions

### Step 1: Verify Email Configuration
Make sure your `.env` file has proper mail configuration:
```env
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@usep.edu.ph
MAIL_FROM_NAME="${APP_NAME}"
```

### Step 2: Test the Command Manually
Test the command before setting up the scheduler:
```bash
cd server
php artisan overdue:check
```

Test with dry-run (no emails sent):
```bash
php artisan overdue:check --dry-run
```

### Step 3: Set Up Laravel Scheduler
The scheduler is already configured in `app/Console/Kernel.php` to run daily at 9:00 AM.

**For Windows (Development):**
You'll need to run the scheduler manually or use Task Scheduler:
```bash
# Run this command every minute (or set up Windows Task Scheduler)
php artisan schedule:run
```

**For Linux/Production:**
Add this to your crontab:
```bash
* * * * * cd /path-to-your-project/server && php artisan schedule:run >> /dev/null 2>&1
```

### Step 4: Verify Admin/Staff Emails
Make sure all admins and super admins have valid email addresses in the database:
- `admin` table: `email` field
- `superadmin` table: `email` field

## How It Works

1. **Daily Check:** The scheduler runs `overdue:check` command daily at 9:00 AM
2. **Find Overdue Items:** Command finds all transactions with:
   - Status = 'borrowed'
   - Expected return date < today
3. **Mark as Overdue:** Automatically updates status to 'overdue'
4. **Get Staff List:** Retrieves all admins and super admins with email addresses
5. **Send Notifications:** Sends email to each admin/staff member with:
   - Total overdue count
   - Detailed list of overdue items
   - Borrower information
   - Days overdue
   - Action recommendations

## Email Recipients

**Only sends to:**
- ✅ Admins (from `admin` table) with valid email addresses
- ✅ Super Admins (from `superadmin` table) with valid email addresses

**Does NOT send to:**
- ❌ Students
- ❌ Employees
- ❌ Regular users
- ❌ Admins without email addresses

## Testing

### Test Command Manually
```bash
# Dry run (no emails sent)
php artisan overdue:check --dry-run

# Actual run (sends emails)
php artisan overdue:check
```

### Check Logs
Logs are written to `storage/logs/laravel.log`:
- Successful notifications
- Failed email attempts
- Error details

## Troubleshooting

### Emails Not Sending
1. Check mail configuration in `.env`
2. Verify admin/staff have email addresses
3. Check `storage/logs/laravel.log` for errors
4. Test mail configuration: `php artisan tinker` then `Mail::raw('Test', function($msg) { $msg->to('test@example.com')->subject('Test'); });`

### Scheduler Not Running
1. Verify cron job is set up (Linux) or Task Scheduler (Windows)
2. Check `php artisan schedule:list` to see scheduled tasks
3. Manually run: `php artisan schedule:run`

### No Overdue Items Found
- This is normal if there are no overdue items
- Command will log: "No overdue items found"

## Customization

### Change Schedule Time
Edit `server/app/Console/Kernel.php`:
```php
$schedule->command('overdue:check')
    ->dailyAt('09:00')  // Change time here
    ->timezone('Asia/Manila');
```

### Change Email Template
Edit `server/resources/views/emails/overdue-items-notification.blade.php`

### Add More Recipients
Edit `server/app/Console/Commands/CheckOverdueItems.php` to add more email recipients

## Security Notes

- ✅ Only sends to registered admins/staff
- ✅ Validates email addresses before sending
- ✅ Logs all email attempts
- ✅ Handles errors gracefully
- ✅ Doesn't expose sensitive data

## Maintenance

- Check logs regularly for failed email attempts
- Verify admin/staff email addresses are up to date
- Monitor scheduler execution
- Review overdue items regularly in dashboard

---

**Last Updated:** $(date)
**System:** RMD-GSU IMS v1.0.0

