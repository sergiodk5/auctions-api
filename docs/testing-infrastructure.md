# Testing Infrastructure Documentation

## Overview

This document explains the testing infrastructure for the auctions API, including isolated container testing, mock services, and repositories for reliable, fast, and independent tests.

## Core Components

### 1. Test Containers

#### Empty Test Container (`tests/helpers/empty-test-container.helper.ts`)

Creates a fresh, empty DI container for each test:

```typescript
import { createEmptyTestContainer } from "../../helpers/empty-test-container.helper";

const testContainer = createEmptyTestContainer();
```

#### Base Test Container (`tests/helpers/test-container.helper.ts`)

Creates a container with common test bindings:

```typescript
import { createTestContainer } from "../../helpers/test-container.helper";

const testContainer = createTestContainer();
```

### 2. Test App Factory (`tests/helpers/test-app.factory.ts`)

Creates Express applications with custom DI containers:

```typescript
import { createTestApp } from "../../helpers/test-app.factory";

const app = createTestApp(testContainer);
```

### 3. Mock Services

#### MockDatabaseService (`tests/mocks/services/mock-database.service.ts`)

Mocks database operations with configurable behavior.

#### MockAuthService (`tests/mocks/services/mock-auth.service.ts`)

Mocks authentication with configurable users and tokens.

#### MockAuthorizationService (`tests/mocks/services/mock-authorization.service.ts`)

Mocks authorization with configurable permissions.

#### MockUserService (`tests/mocks/services/mock-user.service.ts`)

In-memory user service for testing CRUD operations.

#### MockMailerService (`tests/mocks/services/mock-mailer.service.ts`)

Tracks email sending and provides email inspection utilities:

```typescript
MockMailerService.bindToContainer(testContainer);
const mailerService = MockMailerService.getInstance();

// Send emails
await mailerService.sendWelcomeEmail("user@example.com", "http://verify-link");

// Inspect sent emails
const sentEmails = mailerService.getSentEmails();
expect(sentEmails).toHaveLength(1);
```

#### MockPermissionService (`tests/mocks/services/mock-permission.service.ts`)

In-memory permission service for testing RBAC:

```typescript
MockPermissionService.bindToContainer(testContainer);
const permissionService = MockPermissionService.getInstance();

// Seed test data
permissionService.seedPermissions([
    { id: 1, name: "user:read", description: "Read users", ... }
]);

// Test operations
const permissions = await permissionService.getAllPermissions();
```

### 4. Mock Repositories

#### MockTokenRepository (`tests/mocks/repositories/mock-token.repository.ts`)

In-memory token management for testing authentication flows:

```typescript
MockTokenRepository.bindToContainer(testContainer);
const tokenRepo = MockTokenRepository.getInstance();

// Test token operations
await tokenRepo.storeRefreshToken("jti123", "family456");
expect(await tokenRepo.isRefreshTokenValid("jti123")).toBe(true);
```

#### MockUserRepository (`tests/mocks/repositories/mock-user.repository.ts`)

In-memory user data management:

```typescript
MockUserRepository.bindToContainer(testContainer);
const userRepo = MockUserRepository.getInstance();

// Configure hashing
MockUserRepository.configureInstance({ hashPasswords: true });

// Seed test users
userRepo.seedUsers([
    { id: 1, email: "test@example.com", password: "hashed_pass", ... }
]);
```

### 5. Test Helpers

#### TestMailerHelper (`tests/helpers/test-mailer.helper.ts`)

Provides email testing utilities:

```typescript
const mailerHelper = new TestMailerHelper();
mailerHelper.expectEmailSent("user@example.com", "Welcome");
```

    mockPermissions: ["user:read", "user:write"]

});

````

#### MockAuthorizationService
- **Location**: `tests/mocks/services/mock-authorization.service.ts`
- **Purpose**: Mock authorization/RBAC operations
- **Features**:
  - Configurable permission checks
  - Simulate user roles and permissions
  - Fine-grained authorization control

```typescript
const mockAuthz = new MockAuthorizationService();
mockAuthz.setUserPermissions(["user:read", "admin:access"]);
````

#### MockUserService

- **Location**: `tests/mocks/services/mock-user.service.ts`
- **Purpose**: Mock user operations
- **Features**:
    - In-memory user management
    - CRUD operation simulation
    - Error scenario testing

```typescript
const mockUser = new MockUserService();
mockUser.addMockUser({
    id: 1,
    email: "test@example.com",
    isVerified: true,
});
```

### Test Helpers

#### TestMailerHelper

- **Location**: `tests/helpers/test-mailer.helper.ts`
- **Purpose**: Track and verify email sending in tests
- **Features**:
    - Email tracking and verification
    - Query sent emails by recipient
    - No actual email sending

```typescript
const testMailer = new TestMailerHelper();
await testMailer.sendMail({
    to: "user@example.com",
    subject: "Test Email",
});

expect(testMailer.getSentEmails()).toHaveLength(1);
```

#### Empty Test Container

- **Location**: `tests/helpers/empty-test-container.helper.ts`
- **Purpose**: Create isolated DI containers for tests
- **Usage**: Start with clean container and bind only needed services

```typescript
const testContainer = createEmptyTestContainer();
testContainer.bind(TYPES.IUserService).toConstantValue(mockUserService);
```

## Usage Patterns

### 1. Isolated Container Testing

```typescript
describe("Feature Tests", () => {
    let testContainer: Container;
    let mockDb: MockDatabaseService;
    let app: Application;

    beforeEach(() => {
        testContainer = createEmptyTestContainer();
        mockDb = new MockDatabaseService({ shouldQuerySucceed: true });

        testContainer.bind(TYPES.IDatabaseService).toConstantValue(mockDb);
        app = createTestApp(testContainer);
    });

    afterEach(() => {
        mockDb.reset();
    });

    it("should handle database errors", async () => {
        mockDb.updateConfig({ shouldQuerySucceed: false });

        const response = await request(app).get("/api/data");
        expect(response.status).toBe(500);
    });
});
```

### 2. Mixed Real/Mock Services

```typescript
// Use real business logic services but mock external dependencies
testContainer.bind(TYPES.IUserService).to(UserService); // Real service
testContainer.bind(TYPES.IDatabaseService).toConstantValue(mockDb); // Mock
testContainer.bind(TYPES.IMailerService).toConstantValue(testMailer); // Mock
```

### 3. Permission Testing

```typescript
it("should deny access without permission", async () => {
    mockAuthz.setUserPermissions([]); // No permissions

    const response = await request(app).delete("/users/1").set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
});

it("should allow access with permission", async () => {
    mockAuthz.setUserPermissions(["user:delete"]);

    const response = await request(app).delete("/users/1").set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
});
```

### 4. Error Scenario Testing

```typescript
it("should handle service failures gracefully", async () => {
    mockAuth.updateConfig({
        shouldThrowError: true,
        errorMessage: "Auth service is down",
    });

    const response = await request(app).get("/protected-resource").set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
});
```

## Benefits

1. **Isolation**: Each test runs with its own service configuration
2. **Speed**: No need for real database connections or external services
3. **Reliability**: Eliminate flaky tests due to external dependencies
4. **Control**: Precisely control service behavior for edge case testing
5. **Debugging**: Clear visibility into service interactions and call patterns

## Best Practices

1. **Reset Mocks**: Always reset mock state between tests
2. **Specific Configuration**: Configure mocks with only the behavior needed for each test
3. **Verify Interactions**: Use mock call tracking to verify expected service interactions
4. **Mix Appropriately**: Use real services for business logic, mocks for external dependencies
5. **Test Error Paths**: Use mock error simulation to test error handling thoroughly

## Example Test Structure

See `tests/integration/examples/isolated-container.integration.test.ts` for a complete example of how to structure tests using this infrastructure.

## Migration from Existing Tests

To migrate existing tests to use this new infrastructure:

1. Replace real service dependencies with mocks
2. Use `createEmptyTestContainer()` instead of shared DI container
3. Configure mocks for specific test scenarios
4. Use `createTestApp(testContainer)` with your custom container

This approach provides much better test isolation and control while maintaining the ability to test real integration scenarios when needed.
