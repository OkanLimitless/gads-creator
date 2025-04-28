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

# Check for Vercel environment
if [ "$VERCEL" = "1" ]; then
  echo "=== Running in Vercel environment ==="
  # Create tmp directories needed for logging
  mkdir -p /tmp/logs || true
  # Ensure the script doesn't fail if this fails
  echo "Created /tmp/logs directory in Vercel environment"
fi

# Make sure we build with proper cleaning of caches
echo "=== Building project with clean cache ==="
npm run build

echo "=== Deployment preparation complete ==="
echo "You can now deploy to Vercel with 'vercel deploy'" 