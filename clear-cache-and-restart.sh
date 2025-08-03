#!/bin/bash

echo "🧹 Clearing all caches and restarting fresh..."

# Stop any running dev server
echo "⏹️  Stopping any running processes..."
pkill -f "vite" || true

# Clear Vite cache
echo "🗑️  Clearing Vite cache..."
rm -rf node_modules/.vite

# Clear dist folder
echo "🗑️  Clearing dist folder..."
rm -rf dist

# Clear any TypeScript cache
echo "🗑️  Clearing TypeScript cache..."
rm -rf .tsbuildinfo

# Clear npm cache (just in case)
echo "🗑️  Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies to be safe
echo "📦 Reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install

# Test build
echo "🔨 Testing build..."
npm run build

echo "✅ Cache cleared and build successful!"
echo ""
echo "🚀 Now run: npm run dev"
echo "🌐 Then open your browser in incognito mode to avoid browser cache"
echo "🔄 Or press Ctrl+Shift+R (Cmd+Shift+R on Mac) to hard refresh"
