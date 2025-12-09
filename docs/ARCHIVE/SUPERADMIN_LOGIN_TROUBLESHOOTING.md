# SuperAdmin Login Troubleshooting Guide

## Default SuperAdmin Credentials

- **Username**: `rmd_superadmin`
- **Password**: `rmd@superadmin`
- **Email**: `superadmin@usep.edu.ph`

## Verified Status

✅ **Account exists in database**
✅ **Password is correctly hashed**
✅ **Password verification works**
✅ **Admin record exists for token generation**
✅ **Token creation works**

## Common Issues & Solutions

### 1. "The provided credentials are incorrect"

**Possible Causes:**
- Typo in username or password
- Extra spaces before/after username
- Case sensitivity (though username should be case-insensitive)

**Solutions:**
- Double-check spelling: `rmd_superadmin` (with underscore, not hyphen)
- Make sure password is exactly: `rmd@superadmin` (with @ symbol)
- Try copying and pasting the credentials
- Clear browser cache and try again

### 2. Account Not Found

**Check if account exists:**
```bash
cd server
php check_superadmin.php
```

**If account doesn't exist, create it:**
```bash
php artisan db:seed --class=SuperAdminSeeder
```

### 3. Network/Connection Issues

**Check API connection:**
- Verify backend server is running: `php artisan serve`
- Check API URL in frontend: Should be `http://localhost:8000/api`
- Check browser console for network errors
- Verify CORS settings if accessing from different origin

### 4. Frontend Issues

**Check browser console:**
- Open Developer Tools (F12)
- Go to Console tab
- Look for JavaScript errors
- Go to Network tab and check the login request:
  - Status code should be 200 for success
  - Check request payload matches credentials
  - Check response for error messages

### 5. Database Issues

**Verify database connection:**
```bash
php artisan migrate:status
```

**Check if tables exist:**
- `superadmin` table should exist
- `admin` table should exist

## Testing Login Flow

Run the test script to verify everything works:
```bash
cd server
php test_superadmin_login.php
```

Expected output:
```
✓ Found superadmin: rmd_superadmin
✓ Password valid: YES
✓ Found existing admin record
✓ Token created successfully
✓ All checks passed! Login should work.
```

## Debug Mode

Enable debug mode to see detailed error messages:

1. Edit `server/.env`:
   ```
   APP_DEBUG=true
   ```

2. Check logs:
   ```bash
   tail -f storage/logs/laravel.log
   ```

3. Try login again and check logs for detailed error messages

## Manual Database Check

If login still fails, manually verify the account:

```bash
cd server
php artisan tinker
```

Then run:
```php
$superadmin = \App\Models\SuperAdmin::where('username', 'rmd_superadmin')->first();
if ($superadmin) {
    echo "Found: " . $superadmin->username . "\n";
    echo "Email: " . $superadmin->email . "\n";
    // Test password
    $valid = \Illuminate\Support\Facades\Hash::check('rmd@superadmin', $superadmin->password);
    echo "Password valid: " . ($valid ? "YES" : "NO") . "\n";
} else {
    echo "Account not found!\n";
}
```

## Still Having Issues?

1. **Check server logs**: `server/storage/logs/laravel.log`
2. **Check browser console** for frontend errors
3. **Verify API endpoint**: Try accessing `http://localhost:8000/api/test`
4. **Check database**: Ensure migrations are run and seeders executed
5. **Clear cache**: `php artisan cache:clear` and `php artisan config:clear`

## Alternative: Use Email Instead of Username

Try logging in with the email address:
- **Email**: `superadmin@usep.edu.ph`
- **Password**: `rmd@superadmin`

