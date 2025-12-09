# 🔧 Testing Troubleshooting Guide

## Common Errors and Fixes

### **1. Factory Not Found Error**

**Error:**
```
Call to undefined method App\Models\User::factory()
```

**Fix:**
Ensure the model has `HasFactory` trait:
```php
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Model
{
    use HasFactory;
}
```

---

### **2. Database Connection Error**

**Error:**
```
SQLSTATE[HY000] [2002] No connection could be made
```

**Fix:**
1. Check `.env` file has database configuration
2. For testing, you can use SQLite in-memory database:

Update `phpunit.xml`:
```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
```

Or create `.env.testing`:
```env
DB_CONNECTION=sqlite
DB_DATABASE=:memory:
```

---

### **3. Migration Error**

**Error:**
```
SQLSTATE[42S02]: Base table or view not found
```

**Fix:**
Run migrations before tests:
```bash
php artisan migrate --env=testing
```

Or ensure `RefreshDatabase` trait is used in tests.

---

### **4. Cannot Set ID Directly**

**Error:**
```
Cannot set id attribute directly
```

**Fix:**
Don't set `id` when creating models. Instead, test after creation:

**Wrong:**
```php
$user = User::factory()->create(['id' => 1]);
```

**Correct:**
```php
$user = User::factory()->create();
// Then test the formatted_id
$this->assertStringStartsWith('USR-', $user->formatted_id);
```

---

### **5. Missing Table Error**

**Error:**
```
Base table or view 'users' not found
```

**Fix:**
1. Ensure migrations exist
2. Run: `php artisan migrate:fresh --env=testing`
3. Check database name in `.env`

---

### **6. Factory Definition Error**

**Error:**
```
Call to undefined method fake()
```

**Fix:**
Update factory to use `$this->faker` instead of `fake()`:

**Wrong:**
```php
'name' => fake()->name(),
```

**Correct:**
```php
'name' => $this->faker->name(),
```

---

### **7. Model Method Not Found**

**Error:**
```
Call to undefined method App\Models\InventoryItem::reduceQuantity()
```

**Fix:**
Check the actual method name in the model. It might be `borrowQuantity()` instead.

---

### **8. Authentication Token Error**

**Error:**
```
Call to undefined method createToken()
```

**Fix:**
Ensure the model uses `HasApiTokens` trait:
```php
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens;
}
```

---

## Quick Fixes

### **Fix All Common Issues at Once:**

1. **Update phpunit.xml for SQLite:**
```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
```

2. **Run migrations:**
```bash
php artisan migrate:fresh --env=testing
```

3. **Clear cache:**
```bash
php artisan config:clear
php artisan cache:clear
```

4. **Run tests:**
```bash
php artisan test
```

---

## Step-by-Step Debugging

### **1. Check Database Connection:**
```bash
php artisan tinker
>>> DB::connection()->getPdo();
```

### **2. Check Migrations:**
```bash
php artisan migrate:status
```

### **3. Check Factory:**
```bash
php artisan tinker
>>> App\Models\User::factory()->make();
```

### **4. Run Single Test:**
```bash
php artisan test --filter it_can_create_a_user
```

### **5. Check Test Output:**
```bash
php artisan test --verbose
```

---

## Environment Setup

### **For Testing, Create `.env.testing`:**

```env
APP_ENV=testing
APP_DEBUG=true
APP_KEY=base64:your-key-here

DB_CONNECTION=sqlite
DB_DATABASE=:memory:

CACHE_DRIVER=array
SESSION_DRIVER=array
QUEUE_CONNECTION=sync
MAIL_MAILER=array
```

---

## Still Having Issues?

1. **Share the exact error message**
2. **Check Laravel logs:** `storage/logs/laravel.log`
3. **Run with verbose output:** `php artisan test -v`
4. **Check PHP version:** `php -v` (needs 8.0+)
5. **Check dependencies:** `composer install`

---

## Common Test Patterns

### **Creating Test Data:**
```php
// Use factory
$user = User::factory()->create();

// With specific attributes
$user = User::factory()->create(['type' => 'student']);

// Multiple
User::factory()->count(5)->create();
```

### **Database Assertions:**
```php
$this->assertDatabaseHas('users', ['email' => 'test@example.com']);
$this->assertDatabaseMissing('users', ['email' => 'deleted@example.com']);
```

### **Model Assertions:**
```php
$this->assertEquals('John Doe', $user->full_name);
$this->assertTrue($user->isActive());
```

---

**Need more help? Share the exact error message!**

