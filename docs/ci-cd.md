# CI/CD Pipeline Configuration

This document describes the GitHub Actions CI/CD pipeline configuration for the Auctions API project.

## Overview

The CI/CD pipeline is split into two separate workflows for optimal performance and clear separation of concerns:

1. **CI Workflow** (`ci.yml`) - Fast code quality checks
2. **Tests Workflow** (`test.yml`) - Comprehensive testing with full coverage

## Workflow Structure

### 1. CI Workflow (Code Quality)

**Purpose**: Fast feedback on code quality without external dependencies

**Triggers**: Push to `master`, Pull Requests
**Runtime**: ~30 seconds

**Steps**:

- TypeScript type checking (`npm run type-check`)
- ESLint code quality checks (`npm run lint`)
- Prettier formatting validation (`npm run format:check`)

### 2. Tests Workflow (Comprehensive Testing)

**Purpose**: Full test suite with database and Redis integration

**Triggers**: Push to `master`, Pull Requests, Manual dispatch
**Runtime**: ~1-2 minutes

**Services**:

- PostgreSQL 15 (test database)
- Redis 7 (caching and sessions)

**Steps**:

- Database migrations (`npm run db:migrate`)
- All tests with coverage (`npm run test:coverage`)
    - 18 Unit test suites (134 tests)
    - 3 Integration test suites (32 tests)
- Coverage reporting to Codecov

## Test Strategy

### Unified Test Execution

The Tests workflow runs **both unit and integration tests** in a single command (`npm run test:coverage`) for:

- 📊 **Complete Coverage** - Combined coverage metrics for all code
- 🔄 **Simplified Workflow** - Single test command handles everything
- 🎯 **Real Environment** - Integration tests use actual PostgreSQL and Redis
- **Comprehensive Testing**: Full database and cache integration
- **Manual Triggers**: Can be triggered manually for specific testing needs

For detailed information about integration testing, see [Integration Testing Documentation](./integration-testing.md).

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

### Main CI Pipeline (Unit Tests)

1. **Speed**: CI runs complete in under 2 minutes
2. **Reliability**: No external service dependencies that can fail
3. **Cost**: Lower CI/CD costs without database containers
4. **Feedback**: Quick feedback loop for developers
5. **Separation**: Clear separation between fast unit tests and comprehensive integration tests

### Integration Testing Pipeline

1. **Comprehensive**: Tests with real PostgreSQL and Redis services
2. **Realistic**: Uses actual database connections and cache operations
3. **Parallel**: Runs independently of main CI for non-blocking feedback
4. **Manual Control**: Can be triggered on-demand for specific scenarios
5. **Coverage**: Provides complete test coverage including service integrations

## Future Enhancements

Integration testing will be handled by a separate system with:

- Dedicated testing environment with real databases
- End-to-end testing workflows
- Performance and load testing
- Security testing

## Workflow Configuration

The project uses two GitHub Actions workflows:

### 1. Main CI Pipeline (`.github/workflows/ci.yml`)

Fast unit tests and quality checks:

```yaml
name: CI

on:
    push:
        branches: [master]
    pull_request:
        branches: [master]

jobs:
    unit-tests:
        runs-on: ubuntu-latest
        steps:
            - Checkout code
            - Setup Node.js
            - Install dependencies
            - Run quality checks (TypeScript, ESLint, Prettier)
            - Run unit tests with coverage
            - Upload coverage reports
```

### 2. Integration Tests Pipeline (`.github/workflows/integration-tests.yml`)

Comprehensive testing with real services:

```yaml
name: Integration Tests

on:
    push:
        branches: [master]
    pull_request:
        branches: [master]
    workflow_dispatch:

jobs:
    integration-tests:
        runs-on: ubuntu-latest
        services:
            postgres: # PostgreSQL 15-alpine
            redis: # Redis 7-alpine
        steps:
            - Setup environment and services
            - Run database migrations
            - Run integration tests
            - Generate comprehensive coverage
```

## Available Test Scripts

The project includes these test scripts:

- `npm test` - Run all tests (unit + integration)
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run only integration tests (requires database)
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode

## Troubleshooting

### Common Issues

1. **Test Failures**

    - Check that all mocks are properly configured
    - Ensure test isolation (no shared state between tests)
    - Verify TypeScript compilation passes

2. **Coverage Issues**
    - Coverage reports are generated in the `coverage/` directory
    - Codecov uploads may fail without affecting the build
    - Check Jest configuration for coverage thresholds

### Monitoring

- Check GitHub Actions tab for pipeline status
- Coverage reports are available in Codecov
- All quality checks must pass for the pipeline to succeed

## Migration from Complex CI

This simplified approach replaces the previous complex CI that included:

- PostgreSQL and Redis services
- Database migrations and setup
- Integration testing in CI
- Multiple environment variables and service configurations

The new approach focuses on fast feedback and reliability while moving integration testing to dedicated infrastructure.
