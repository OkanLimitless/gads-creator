#!/bin/bash

# This script is executed by Vercel during the build step
# It ensures that the necessary directories exist and sets up the environment

echo "Running Vercel build script..."

# Create temp directories for logs
if [ -d "/tmp" ]; then
  mkdir -p /tmp/logs
  echo "Created log directory at /tmp/logs"
else 
  echo "No /tmp directory found, will rely on in-memory logging only"
fi

# Run the normal build process
npm run build

echo "Vercel build script completed successfully." 