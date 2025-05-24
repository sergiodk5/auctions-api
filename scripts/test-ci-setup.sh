#!/bin/bash

# Test script to validate CI environment setup
echo "🔍 Testing CI environment setup..."

# Check if we can connect to PostgreSQL
echo "📊 Testing PostgreSQL connection..."
PGPASSWORD=postgres psql -h localhost -U postgres -d postgres_test -c "SELECT version();" || {
    echo "❌ PostgreSQL connection failed"
    exit 1
}

# Check if we can connect to Redis
echo "📊 Testing Redis connection..."
redis-cli -h localhost -p 6379 ping || {
    echo "❌ Redis connection failed"
    exit 1
}

# Check if we can run migrations
echo "📊 Testing database migrations..."
npm run db:migrate || {
    echo "❌ Database migrations failed"
    exit 1
}

# Check if we can run tests
echo "📊 Testing Jest execution..."
npm run test || {
    echo "❌ Tests failed"
    exit 1
}

echo "✅ All CI environment checks passed!"
