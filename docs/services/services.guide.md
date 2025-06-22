# Services Layer Guide

## Overview

The services layer in this TypeScript Express API provides the business logic and orchestration between controllers and repositories. Services encapsulate domain-specific operations, handle complex business rules, and coordinate between multiple data sources.

## Architecture

### Service Layer Principles

1. **Single Responsibility**: Each service focuses on a specific domain or business capability
2. **Dependency Injection**: All services use Inversify for dependency management
3. **Interface-Based Design**: Services implement well-defined interfaces for testability
4. **Business Logic Encapsulation**: Complex business rules are contained within services
5. **Repository Orchestration**: Services coordinate operations across multiple repositories

### Service Types

#### Core Services

- **UserService**: User management and CRUD operations
- **AuthenticationService**: Authentication, registration, and token management
- **AuthorizationService**: Permission and role-based access control
- **RoleService**: Role management operations
- **PermissionService**: Permission management operations

#### Infrastructure Services

- **DatabaseService**: Database connection and Drizzle ORM instance management
- **CacheService**: Redis client management and caching operations
- **MailerService**: Email sending and template management
- **ValidationService**: Data validation and schema enforcement

## Service Structure

### Basic Service Pattern

```typescript
import { TYPES } from "@/di/types";
import { inject, injectable } from "inversify";

export interface IExampleService {
    performOperation(data: SomeDto): Promise<Result>;
}

@injectable()
export default class ExampleService implements IExampleService {
    constructor(
        @inject(TYPES.IRepository) private readonly repo: IRepository,
        @inject(TYPES.IOtherService) private readonly otherService: IOtherService,
    ) {}

    async performOperation(data: SomeDto): Promise<Result> {
        // Business logic implementation
        return this.repo.performAction(data);
    }
}
```

### Service Interface Requirements

- **Explicit Return Types**: All public methods must have explicit return types
- **Async Operations**: Use `async/await` for all asynchronous operations
- **Error Handling**: Throw descriptive errors that can be handled by error middleware
- **Type Safety**: Use proper TypeScript types for all parameters and returns

## Dependency Injection

### Service Registration

Services are registered in `src/di/container.ts`:

```typescript
// Services
container.bind<IUserService>(TYPES.IUserService).to(UserService);
container.bind<IAuthenticationService>(TYPES.IAuthenticationService).to(AuthenticationService);
container.bind<IAuthorizationService>(TYPES.IAuthorizationService).to(AuthorizationService);
```

### Service Injection

Services inject their dependencies through the constructor:

```typescript
@injectable()
export default class UserService implements IUserService {
    constructor(
        @inject(TYPES.IUserRepository) private readonly userRepo: IUserRepository,
        @inject(TYPES.ICacheService) private readonly cacheService: ICacheService,
    ) {}
}
```

### TYPES Registry

Service type symbols are defined in `src/di/types.ts`:

```typescript
const TYPES = {
    // Services
    IUserService: Symbol.for("IUserService"),
    IAuthenticationService: Symbol.for("IAuthenticationService"),
    IAuthorizationService: Symbol.for("IAuthorizationService"),
};
```

## Business Logic Patterns

### Domain Validation

```typescript
async createUser(data: CreateUserDto): Promise<User> {
    // Business rule: check for existing user
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new Error("UserExists");

    // Delegate to repository
    return this.userRepo.create(data);
}
```

### Multi-Repository Coordination

```typescript
async assignUserRole(userId: number, roleId: number): Promise<void> {
    // Validate user exists
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error("UserNotFound");

    // Validate role exists
    const role = await this.roleRepo.findById(roleId);
    if (!role) throw new Error("RoleNotFound");

    // Perform assignment
    await this.userRoleRepo.assignRoles(userId, [roleId]);
}
```

### Caching Integration

```typescript
async getUserPermissions(userId: number, options?: { useCache?: boolean }): Promise<Permission[]> {
    const cacheKey = `user:${userId}:permissions`;

    if (options?.useCache !== false) {
        const cached = await this.cacheService.client.get(cacheKey);
        if (cached) return JSON.parse(cached);
    }

    const permissions = await this.getPermissionsFromDatabase(userId);

    // Cache for 1 hour
    await this.cacheService.client.setEx(cacheKey, 3600, JSON.stringify(permissions));

    return permissions;
}
```

## Error Handling

### Service-Level Errors

Services should throw descriptive errors that controllers can handle:

```typescript
// ✅ Good: Descriptive error names
throw new Error("UserNotFound");
throw new Error("EmailAlreadyVerified");
throw new Error("InvalidPermission");

// ❌ Bad: Generic errors
throw new Error("Something went wrong");
throw new Error("Error");
```

### Error Categories

- **Validation Errors**: Data validation failures
- **Business Logic Errors**: Domain rule violations
- **Resource Errors**: Missing or unavailable resources
- **Authorization Errors**: Permission or access issues

## Testing Services

### Unit Testing Pattern

```typescript
describe("UserService", () => {
    let mockRepo: jest.Mocked<IUserRepository>;
    let userService: UserService;

    beforeEach(() => {
        mockRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            // ... other methods
        };
        userService = new UserService(mockRepo);
    });

    it("should create user successfully", async () => {
        const userData: CreateUserDto = { email: "test@example.com" };
        const expectedUser: User = { id: 1, email: "test@example.com", emailVerified: false };

        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(expectedUser);

        const result = await userService.createUser(userData);

        expect(result).toEqual(expectedUser);
        expect(mockRepo.findByEmail).toHaveBeenCalledWith("test@example.com");
        expect(mockRepo.create).toHaveBeenCalledWith(userData);
    });
});
```

### Mocking Dependencies

- **Repository Mocks**: Mock all repository methods used by the service
- **Service Mocks**: Mock other services when testing service interactions
- **Infrastructure Mocks**: Mock database, cache, and external services

### Test Coverage Requirements

- **Happy Path**: Test successful operations
- **Error Cases**: Test all error scenarios
- **Edge Cases**: Test boundary conditions and unusual inputs
- **Business Rules**: Test all business logic and validations

## Best Practices

### Service Design

1. **Keep Services Focused**: Each service should have a clear, single responsibility
2. **Avoid Direct Database Access**: Always use repositories for data operations
3. **Use Type-Safe Interfaces**: Define clear interfaces for all services
4. **Handle Errors Gracefully**: Provide meaningful error messages
5. **Use Dependency Injection**: Never instantiate dependencies directly

### Performance Considerations

1. **Cache Frequently Accessed Data**: Use Redis for expensive operations
2. **Batch Repository Operations**: Minimize database calls
3. **Use Transactions**: For multi-step operations that need atomicity
4. **Optimize Query Patterns**: Work with repositories to optimize data access

### Security Considerations

1. **Validate All Inputs**: Use Zod schemas for data validation
2. **Check Permissions**: Verify user authorization before operations
3. **Sanitize Data**: Clean user inputs before processing
4. **Log Security Events**: Track authentication and authorization events

## Service-Specific Guides

- [Authentication Service Guide](./authentication-service.guide.md)
- [Authorization Service Guide](./authorization-service.guide.md)
- [User Service Guide](./user-service.guide.md)
- [Infrastructure Services Guide](./infrastructure-services.guide.md)

## Related Documentation

- [Repository Layer Guide](../repositories/repositories.guide.md)
- [Dependency Injection Guide](../di/container.guide.md)
- [Types Registry Guide](../di/types.guide.md)
- [Testing Guide](../testing.md)
