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

## Workflow Configuration

The GitHub Actions workflow (`.github/workflows/ci.yml`) is configured with:

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
