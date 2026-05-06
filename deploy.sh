#!/bin/bash

# Deployment script for blank.cool
# Run this from /root/websites/BIGMExBLANK/

set -euo pipefail

TARGET_DIR="/var/www/blank.prince.sh"

echo "Starting deployment for blank.cool..."

echo "Building project..."
npm run build

echo "Ensuring target directory exists..."
mkdir -p "$TARGET_DIR"

echo "Clearing old files from $TARGET_DIR..."
find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

echo "Copying dist/ to $TARGET_DIR..."
cp -r dist/. "$TARGET_DIR/"

echo "Setting permissions..."
chown -R www-data:www-data "$TARGET_DIR"
chmod -R 755 "$TARGET_DIR"

echo "Reloading nginx..."
systemctl reload nginx

echo "Restarting blank-api service..."
systemctl restart blank-api

echo "Deployment complete: https://blank.cool"
