# CI/CD Pipeline Configuration

This document describes the GitHub Actions CI/CD pipeline configuration for the Auctions API project.

## Overview

The CI/CD pipeline is configured to run on every push to the `master` branch and pull requests. It focuses on code quality checks and unit testing to ensure fast and reliable builds.

## Pipeline Structure

The pipeline includes the following checks:

- **Code Quality**: TypeScript compilation, ESLint linting, and Prettier formatting
- **Unit Testing**: Isolated unit tests with mocked dependencies and coverage reporting
- **Fast Feedback**: Optimized for quick feedback without external service dependencies

## Pipeline Steps

### 1. Setup

- Checkout code from repository
- Setup Node.js (version from `.nvmrc` file)
- Install dependencies with `npm ci` (clean install for CI)

### 2. Code Quality Checks

- **TypeScript Compilation**: `npm run type-check` - Validates TypeScript syntax and types
- **ESLint**: `npm run lint` - Checks for code quality and style issues
- **Prettier**: `npm run format:check` - Validates code formatting consistency

### 3. Unit Testing

- **Test Execution**: `npm run test:unit -- --coverage` - Runs unit tests with coverage
- **Coverage Upload**: Uploads coverage reports to Codecov for tracking

## Test Strategy

### Unit Tests Only

The CI pipeline only runs unit tests to ensure:

- ⚡ **Fast execution** - No database or service dependencies
- 🔒 **Reliability** - No external service failures
- 🧪 **Isolation** - Each test runs independently with mocked dependencies

### Integration Tests

Integration tests are **not run in GitHub Actions** and will be handled by a separate testing system:

- Local development environment
- Dedicated integration testing infrastructure
- Manual testing workflows

## Environment Variables

The CI environment uses minimal configuration:

```yaml
NODE_ENV: test
```

No database URLs, Redis connections, or external service configurations are needed since only unit tests run in CI.

## Coverage Reporting

- Coverage reports are generated using Jest
- Reports are uploaded to Codecov for historical tracking
- Coverage includes all unit tests across:
    - Controllers (with mocked services)
    - Services (with mocked repositories)
    - Repositories (with mocked database)
    - Middlewares (with mocked dependencies)
    - Utilities (pure functions)

## Local Development

For full testing including integration tests, use these commands locally:

```bash
# Run all tests (unit + integration)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests (requires local database)
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Benefits of This Approach

1. **Speed**: CI runs complete in under 2 minutes
2. **Reliability**: No external service dependencies that can fail
3. **Cost**: Lower CI/CD costs without database containers
4. **Feedback**: Quick feedback loop for developers
5. **Separation**: Clear separation between fast unit tests and comprehensive integration tests

## Future Enhancements

Integration testing will be handled by a separate system with:

- Dedicated testing environment with real databases
- End-to-end testing workflows
- Performance and load testing
- Security testing
    - Test Redis connectivity

4. **Testing**

    - Run comprehensive test suite with coverage
    - Upload coverage reports to Codecov

5. **Code Quality**
    - TypeScript type checking
    - ESLint linting
    - Prettier formatting checks

## Environment Variables

The CI environment uses the following test configuration:

```yaml
NODE_ENV: test
DATABASE_URL: postgres://postgres:postgres@localhost:5432/postgres_test
TEST_DATABASE_URL: postgres://postgres:postgres@localhost:5432/postgres_test
REDIS_HOST: localhost
REDIS_PORT: 6379
REDIS_PASSWORD: ""
JWT_SECRET: test_jwt_secret
JWT_REFRESH_SECRET: test_jwt_refresh_secret
JWT_RESET_SECRET: test_jwt_reset_secret
SMTP_HOST: localhost
SMTP_PORT: 1025
SMTP_SECURE: false
SMTP_USER: test
SMTP_PASS: test
MAILER_PROVIDER: sendgrid
SENDGRID_API_KEY: test_api_key
FRONTEND_URL: http://localhost:3000
MAILER_FROM_DOMAIN: test.com
```

## Test Scripts

The project includes specialized test scripts for CI:

- `npm run test` - Run all tests
- `npm run test:ci` - CI-optimized test run with coverage and forced exit
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run only integration tests
- `npm run test:coverage` - Run tests with coverage report

## Local Testing

To test the CI setup locally, you can use the provided script:

```bash
./scripts/test-ci-setup.sh
```

This script validates:

- PostgreSQL connectivity
- Redis connectivity
- Database migrations
- Test execution

## Troubleshooting

### Common Issues

1. **Hanging Processes**

    - Integration tests include proper cleanup with `afterAll` hooks
    - Database connections are properly closed
    - Use `--forceExit` flag in CI environment

2. **Service Health Checks**

    - Services include comprehensive health checks
    - Health checks run every 10 seconds with 5 retries
    - Pipeline waits for services to be healthy before proceeding

3. **Database Connection Issues**
    - Test database is created separately from the default database
    - Connection strings use explicit test database names
    - PostgreSQL client tools are installed in the CI environment

### Monitoring

- Check GitHub Actions tab for pipeline status
- Coverage reports are available in Codecov (when configured)
- Failed steps include detailed logs for debugging

## Security Considerations

- Test environment uses non-production secrets
- Database credentials are isolated to the CI environment
- Redis runs without authentication in test mode
- SMTP settings point to localhost for testing
