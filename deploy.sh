#!/bin/bash
set -e

PROJECT_DIR="/var/www/tulpanomsk55"
REPO_URL="https://github.com/nsssssssd/pract.git"
BRANCH="main"
PM2_APP_NAME="tulpanomsk55"

echo "=== Deploy TulpanOmsk55 ==="

# 1. Go to project dir (clone if not exists)
if [ ! -d "$PROJECT_DIR" ]; then
  echo "Creating project directory..."
  mkdir -p "$PROJECT_DIR"
  git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# 2. Save uploads before pull
if [ -d "public/uploads" ]; then
  echo "Backing up uploads..."
  cp -r public/uploads /tmp/tulpan-uploads-backup
fi

# 3. Pull latest code
echo "Pulling latest code..."
git fetch origin
git reset --hard origin/$BRANCH

# 4. Restore uploads
echo "Restoring uploads..."
mkdir -p public/uploads
if [ -d "/tmp/tulpan-uploads-backup" ]; then
  cp -rn /tmp/tulpan-uploads-backup/* public/uploads/ 2>/dev/null || true
  rm -rf /tmp/tulpan-uploads-backup
fi

# 5. Install deps
echo "Installing dependencies..."
npm install

# 6. Build
echo "Building..."
npm run build

# 7. Restart PM2
echo "Restarting app..."
if pm2 list | grep -q "$PM2_APP_NAME"; then
  pm2 restart "$PM2_APP_NAME"
else
  echo "PM2 app not found. Starting new..."
  pm2 start npm --name "$PM2_APP_NAME" -- start
  pm2 save
fi

echo "=== Deploy finished ==="
