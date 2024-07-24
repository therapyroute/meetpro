#!/bin/bash
# Check if jq is installed
command -v jq >/dev/null 2>&1 && jq_installed=true || jq_installed=false

# Proceed only if jq is installed
if [ "$jq_installed" = true ]; then
  # Remove existing meteor settings from .env
  sed -i '/METEOR_SETTINGS*/d' .env

  # Add new settings using jq
  echo "METEOR_SETTINGS=""$(cat app/settings.json | jq '@json')" >> .env

  # Run docker-compose up
  docker compose up -d
else
  echo "Error: jq is not installed. Please install jq and try again."
  exit 1  # Exit with an error code
fi
