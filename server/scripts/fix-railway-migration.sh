#!/bin/bash

# Script to fix failed Prisma migration on Railway
# This marks the failed migration as resolved without losing data

echo "🔧 Fixing failed Prisma migration on Railway..."
echo ""

# Mark the failed migration as resolved
npx prisma migrate resolve --applied 20251027000000_init

echo ""
echo "✅ Migration marked as resolved!"
echo ""
echo "Now deploying migrations..."

# Deploy any pending migrations
npx prisma migrate deploy

echo ""
echo "🎉 Done! Migrations should be fixed now."
