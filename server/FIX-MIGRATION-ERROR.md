# 🔧 Fix Migration Error - Column 'unit' Not Found

## Problem

The error occurs because:
- Migration `2025_01_20_000001_add_image_path_to_inventory_items.php` tries to add `image_path` **after** `unit` column
- But `unit` column is added in a later migration (`2025_10_06_024550_add_frontend_fields_to_inventory_items_table.php`)
- Migration timestamps cause the image_path migration to run first, before `unit` exists

## ✅ Fix Applied

Updated the migration to:
1. Check if `image_path` already exists (prevents duplicate column errors)
2. Remove the `->after('unit')` clause (avoids dependency on column that might not exist)
3. Just add the column without specifying position

## 🔄 How to Fix Your Database

### Option 1: Reset and Re-run Migrations (Recommended for Development)

```bash
cd server

# Reset all migrations (WARNING: This deletes all data!)
php artisan migrate:fresh

# Or just reset the specific migration
php artisan migrate:rollback --step=1
php artisan migrate
```

### Option 2: Manually Fix the Database

If you can't reset migrations, manually fix:

```sql
-- Check if image_path exists
SHOW COLUMNS FROM inventory_items LIKE 'image_path';

-- If it doesn't exist, add it
ALTER TABLE inventory_items ADD COLUMN image_path VARCHAR(255) NULL;
```

### Option 3: Fix Migration Order (If Needed)

If the issue persists, you can rename the migration file to run after the unit column is added:

```bash
# Rename to run later (change date to after 2025_10_06)
# From: 2025_01_20_000001_add_image_path_to_inventory_items.php
# To:   2025_10_07_000001_add_image_path_to_inventory_items.php
```

## 🧪 For Tests

The migration is now fixed, so tests should work. Run:

```bash
cd server
php artisan migrate:fresh --env=testing
php artisan test
```

## ✅ Verification

After fixing, verify:

```bash
# Check migration status
php artisan migrate:status

# Check if column exists
php artisan tinker
>>> Schema::hasColumn('inventory_items', 'image_path');
```

---

**The migration file has been fixed. Now reset your database and re-run migrations.**

