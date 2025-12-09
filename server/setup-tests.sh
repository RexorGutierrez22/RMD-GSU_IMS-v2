#!/bin/bash

# Test Setup Script for RMD-GSU IMS

echo "🧪 Setting up test environment..."

# Clear caches
echo "📦 Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Run migrations for testing
echo "🗄️  Running migrations..."
php artisan migrate:fresh --env=testing --force

# Run tests
echo "✅ Running tests..."
php artisan test

echo "✨ Done!"

