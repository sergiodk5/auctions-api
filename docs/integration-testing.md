# Integration Testing Workflow

This document describes the GitHub Actions integration testing workflow that complements the main CI pipeline.

## Overview

The integration testing workflow (`integration-tests.yml`) runs comprehensive tests that require real database and cache services. This workflow is separate from the main CI pipeline to provide:

- **Comprehensive Testing**: Full integration tests with real PostgreSQL and Redis
- **Parallel Execution**: Runs alongside the fast unit tests workflow
- **Manual Triggering**: Can be triggered manually via `workflow_dispatch`
- **Complete Coverage**: Combines unit and integration test coverage

## Workflow Configuration

### Triggers

- **Push to master**: Automatically runs on master branch pushes
- **Pull Requests**: Runs on PRs targeting master branch  
- **Manual Dispatch**: Can be triggered manually from GitHub Actions tab

### Service Containers

#### PostgreSQL Service
```yaml
postgres:
  image: postgres:15-alpine
  env:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: postgres_test
  options: >-
    --health-cmd pg_isready
    --health-interval 10s
    --health-timeout 5s
    --health-retries 5
  ports:
    - 5432:5432
```

#### Redis Service
```yaml
redis:
  image: redis:7-alpine
  options: >-
    --health-cmd "redis-cli ping"
    --health-interval 10s
    --health-timeout 5s
    --health-retries 5
  ports:
    - 6379:6379
```

## Workflow Steps

### 1. Environment Setup
- Checkout repository code
- Setup Node.js from `.nvmrc`
- Install npm dependencies

### 2. Database Setup
- Install PostgreSQL client tools
- Create test database (`postgres_test`)
- Verify PostgreSQL and Redis connectivity
- Run database migrations

### 3. Quality Checks
- TypeScript type checking
- ESLint linting
- Prettier formatting validation

### 4. Testing
- Run integration tests with real services
- Run full test suite with coverage
- Upload coverage reports to Codecov

## Environment Variables

The integration tests use realistic test environment variables:

```yaml
NODE_ENV: test
DATABASE_URL: postgres://postgres:postgres@localhost:5432/postgres_test
TEST_DATABASE_URL: postgres://postgres:postgres@localhost:5432/postgres_test
REDIS_HOST: localhost
REDIS_PORT: 6379
REDIS_PASSWORD: ""
JWT_SECRET: test_jwt_secret_integration
JWT_REFRESH_SECRET: test_jwt_refresh_secret_integration
JWT_RESET_SECRET: test_jwt_reset_secret_integration
SMTP_HOST: localhost
SMTP_PORT: 1025
SMTP_SECURE: false
SMTP_USER: test
SMTP_PASS: test
MAILER_PROVIDER: sendgrid
SENDGRID_API_KEY: test_api_key_integration
FRONTEND_URL: http://localhost:3000
MAILER_FROM_DOMAIN: test.com
```

## Test Commands

- `npm run test:integration` - Run only integration tests
- `npm run test:coverage` - Run all tests with coverage

## Health Checks

Both service containers include comprehensive health checks:

- **PostgreSQL**: `pg_isready` command with 10s intervals
- **Redis**: `redis-cli ping` command with 10s intervals
- **Retries**: 5 retries with 5s timeout for each service

## Coverage Reporting

- Coverage reports include both unit and integration tests
- Reports are uploaded to Codecov with `integration` flag
- Separate coverage tracking from unit tests workflow

## Comparison with Unit Tests Workflow

| Feature | Unit Tests CI | Integration Tests |
|---------|---------------|-------------------|
| **Speed** | ~2 minutes | ~5-8 minutes |
| **Services** | None | PostgreSQL + Redis |
| **Database** | Mocked | Real database |
| **Cache** | Mocked | Real Redis |
| **Purpose** | Fast feedback | Comprehensive validation |
| **Triggers** | All pushes/PRs | Master pushes/PRs + manual |

## Troubleshooting

### Common Issues

1. **Service Health Check Failures**
   - Services have 5 retry attempts with 10s intervals
   - Check GitHub Actions logs for health check status
   - Verify Docker images are accessible

2. **Database Connection Issues**
   - Test database is created separately (`postgres_test`)
   - PostgreSQL client tools are installed in workflow
   - Connection uses localhost with mapped ports

3. **Migration Failures**
   - Ensure `npm run db:migrate` script exists
   - Check DATABASE_URL environment variable
   - Verify migration files are committed

4. **Test Timeouts**
   - Integration tests may take longer than unit tests
   - Consider increasing Jest timeout for integration tests
   - Ensure proper test cleanup and connection closing

### Manual Testing

To run integration tests locally with the same setup:

```bash
# Start services with Docker Compose
docker-compose up -d postgres redis

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

## Monitoring

- Monitor workflow status in GitHub Actions tab
- Check coverage trends in Codecov
- Review integration test execution times
- Monitor service container resource usage

## Future Enhancements

- **End-to-End Tests**: Add API endpoint testing
- **Performance Tests**: Add load testing scenarios
- **Security Tests**: Add security vulnerability scanning
- **Multi-Database Tests**: Test against different PostgreSQL versions
- **Cache Strategies**: Test different Redis configurations
