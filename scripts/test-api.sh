#!/bin/bash
# Run API backend tests
# Usage: ./scripts/test-api.sh [--coverage]

set -e

echo "=== API Backend Tests ==="

# Generate Prisma client
echo "Generating Prisma client..."
cd apps/api && npx prisma generate && cd ../..

# Run tests
if [ "$1" = "--coverage" ]; then
  echo "Running tests with coverage..."
  npx jest --config apps/api/jest.config.ts --verbose --coverage
else
  echo "Running tests..."
  npx jest --config apps/api/jest.config.ts --verbose
fi

echo "=== Tests complete ==="
