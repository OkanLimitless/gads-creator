#!/bin/bash

# Script to prepare the project for deployment to Vercel
# This ensures all dependencies are properly installed and that caching issues are addressed

# Stop on error
set -e

echo "=== Starting deployment preparation ==="

# Make sure we have full build
echo "=== Cleaning previous build ==="
rm -rf .next || true

# Install all dependencies
echo "=== Installing dependencies ==="
npm ci

# Make sure we build with proper cleaning of caches
echo "=== Building project with clean cache ==="
npm run build

# Make sure logs directory exists in Vercel
echo "=== Creating log directories ==="
mkdir -p /tmp/logs || true

echo "=== Deployment preparation complete ==="
echo "You can now deploy to Vercel with 'vercel deploy'" 