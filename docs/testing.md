# Testing Guide

This guide covers how to run tests locally and understand the testing infrastructure.

## Quick Start

### Running All Tests

```bash
npm test
```

### Running Unit Tests Only

```bash
npm run test:unit
```

### Running Integration Tests

#### With Docker (Recommended)

```bash
# Start test services, run integration tests, then clean up
npm run test:integration:local

# Or manually manage services
npm run test:setup          # Start PostgreSQL and Redis
npm run test:integration    # Run integration tests
npm run test:teardown       # Stop and clean up services
```

#### Without Docker

If you have PostgreSQL and Redis running locally:

```bash
# Set environment variables
export NODE_ENV=test
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres_test
export TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres_test
export REDIS_HOST=localhost
export REDIS_PORT=6379

# Create test database
createdb -h localhost -U postgres postgres_test

# Run migrations
npm run db:migrate

# Run integration tests
npm run test:integration
```

## Test Structure

```
tests/
├── unit/                    # Unit tests with mocked dependencies
│   ├── controllers/         # Controller logic tests
│   ├── services/           # Business logic tests
│   ├── repositories/       # Data access layer tests
│   ├── middlewares/        # Middleware tests
│   └── utils/              # Utility function tests
├── integration/            # Integration tests with real services
│   ├── auth/               # Authentication flow tests
│   └── routes/             # API endpoint tests
├── helpers/                # Test utilities and setup
│   └── database.helper.ts  # Database management utilities
└── setup/                  # Test environment setup
    └── integration.setup.ts # Integration test initialization
```

## Environment Setup

### Required Services

**For Unit Tests:**

- No external services required (all dependencies mocked)

**For Integration Tests:**

- PostgreSQL 15+
- Redis 7+

### Environment Variables

Create a `.env.test` file for local testing:

```bash
NODE_ENV=test
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres_test
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres_test
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""
JWT_SECRET=test_jwt_secret
JWT_REFRESH_SECRET=test_jwt_refresh_secret
JWT_RESET_SECRET=test_jwt_reset_secret
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=test
SMTP_PASS=test
MAILER_PROVIDER=sendgrid
SENDGRID_API_KEY=test_api_key
FRONTEND_URL=http://localhost:3000
MAILER_FROM_DOMAIN=test.com
```

## Troubleshooting

### Database Connection Issues

1. **PostgreSQL not running:**

    ```bash
    # Using Docker
    docker-compose -f docker-compose.test.yml up -d postgres_test

    # Using local PostgreSQL
    brew services start postgresql
    ```

2. **Test database doesn't exist:**

    ```bash
    createdb -h localhost -U postgres postgres_test
    ```

3. **Connection refused:**
    - Check if PostgreSQL is running on port 5432 (or 5433 for test container)
    - Verify connection string in environment variables
    - Check firewall settings

### Redis Connection Issues

1. **Redis not running:**

    ```bash
    # Using Docker
    docker-compose -f docker-compose.test.yml up -d redis

    # Using local Redis
    brew services start redis
    ```

2. **Connection refused:**
    - Check if Redis is running on port 6379
    - Verify REDIS_HOST and REDIS_PORT environment variables

### Test Failures

1. **Database cleanup errors:**

    - Ensure test database exists and is accessible
    - Check for proper table creation via migrations

2. **Timeout issues:**

    - Integration tests have 30s timeout by default
    - Database setup might take time on first run

3. **Port conflicts:**
    - Default ports: PostgreSQL (5432/5433), Redis (6379)
    - Change ports in docker-compose.test.yml if needed

## Coverage

View coverage reports:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## CI/CD

- **Unit tests** run on every push/PR (fast feedback)
- **Integration tests** have separate workflow with service containers
- Both contribute to overall coverage reporting

For more details, see:

- [CI/CD Documentation](./ci-cd.md)
- [Integration Testing Workflow](./integration-testing.md)
