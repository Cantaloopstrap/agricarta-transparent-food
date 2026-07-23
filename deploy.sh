#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Agrikarta Domcloud Production Deployment..."

# 1. Frontend & Root Dependencies
echo "📦 Installing root frontend dependencies..."
npm install

# 2. Backend Microservice Dependencies
echo "📦 Installing Node.js backend dependencies..."
cd backend
npm install
cd ..

# 3. Python ML Engine Dependencies
echo "🐍 Installing Python ML Engine dependencies..."
cd ml-engine
if [ -d "venv" ]; then
    source venv/bin/activate
fi
pip install -r requirements.txt
cd ..

# 4. Build Vite React PWA Frontend
echo "🏗️ Building React PWA frontend..."
npx vite build

# 5. PM2 Process Management Reload
echo "🔄 Reloading PM2 processes..."
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
else
    echo "⚠️ PM2 not found in PATH. Skipping PM2 reload."
fi

echo "✅ Agrikarta Deployment Complete!"
