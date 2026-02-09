#!/bin/bash
# Run E2E Playwright tests
# Usage: ./scripts/test-e2e.sh [--project=chromium|qa-report] [--url=https://...]
#
# Environment variables:
#   TEST_URL           - Base URL to test against (default: http://localhost:3000)
#   TEST_USER_EMAIL    - Login email for authenticated tests
#   TEST_USER_PASSWORD - Login password for authenticated tests

set -e

PROJECT="chromium"
URL=""

for arg in "$@"; do
  case $arg in
    --project=*)
      PROJECT="${arg#*=}"
      ;;
    --url=*)
      URL="${arg#*=}"
      ;;
  esac
done

if [ -n "$URL" ]; then
  export TEST_URL="$URL"
fi

echo "=== E2E Playwright Tests ==="
echo "Project: $PROJECT"
echo "URL: ${TEST_URL:-http://localhost:3000}"

cd apps/web

# Ensure playwright is installed
npx playwright install chromium --with-deps 2>/dev/null || true

# Run tests
npx playwright test --project="$PROJECT"

echo "=== E2E Tests complete ==="
