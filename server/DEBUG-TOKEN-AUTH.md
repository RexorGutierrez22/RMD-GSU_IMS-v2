# 🔍 Debug Token Authentication

## Steps to Debug

1. **Check Browser Console:**
   - Open DevTools > Console
   - Look for token logs (🔑 Token found, 📤 Request headers)
   - Copy the token preview

2. **Check Backend Logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```
   - Look for: 🔍 Sanctum auth check
   - Look for: ✅ Token found or ❌ Token not found

3. **Check Token in Database:**
   ```sql
   SELECT id, tokenable_type, tokenable_id, name, created_at
   FROM personal_access_tokens
   WHERE tokenable_type = 'App\\Models\\Admin'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

4. **Test Token Manually:**
   - Get token from browser localStorage
   - Test with curl:
   ```bash
   curl -X POST http://localhost:8000/api/admin/upload-profile-image \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Accept: application/json" \
     -F "image=@/path/to/test-image.jpg"
   ```

## Common Issues

1. **Token not in database** - Admin needs to log in again
2. **Token expired** - Check token expiration settings
3. **Token format wrong** - Should be plain text from `createToken()->plainTextToken`
4. **Middleware not running** - Check route middleware configuration

