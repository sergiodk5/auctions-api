# Repositories Layer Guide

## Overview

The repository layer provides a clean abstraction over data access operations, implementing the Repository pattern to separate business logic from data access concerns. This layer sits between the service layer and the database, providing a consistent interface for data operations regardless of the underlying storage mechanism.

## Architecture

### Repository Pattern Benefits

1. **Separation of Concerns**: Business logic is isolated from data access logic
2. **Testability**: Easy to mock and test with in-memory implementations
3. **Flexibility**: Can swap data sources without changing business logic
4. **Consistency**: Uniform interface across all data operations
5. **Type Safety**: Full TypeScript support with strongly typed interfaces

### Design Principles

- **Interface-driven**: All repositories implement TypeScript interfaces
- **Dependency injection**: Injected via Inversify container
- **Database abstraction**: Uses Drizzle ORM for type-safe queries
- **Error handling**: Consistent error patterns across repositories
- **Caching**: Strategic caching for performance-critical operations

## Repository Overview

| Repository                    | Purpose                       | Key Features                            |
| ----------------------------- | ----------------------------- | --------------------------------------- |
| `UserRepository`              | User CRUD operations          | Password hashing, email verification    |
| `TokenRepository`             | JWT token management          | Redis caching, family-based revocation  |
| `RoleRepository`              | RBAC role management          | Role-permission relationships           |
| `PermissionRepository`        | Permission management         | CRUD operations for permissions         |
| `UserRoleRepository`          | User-role assignments         | Bulk operations, duplicate prevention   |
| `UserPermissionRepository`    | User permissions with caching | Performance-optimized permission lookup |
| `EmailVerificationRepository` | Email verification tokens     | Token lifecycle management              |

## Individual Repository Documentation

### UserRepository

Manages user accounts and authentication data.

```typescript
import { IUserRepository } from "@/repositories/user.repository";
import { TYPES } from "@/di/types";

// Dependency injection
@inject(TYPES.IUserRepository) private userRepo: IUserRepository
```

#### Interface

```typescript
export interface IUserRepository {
    findAll(): Promise<User[]>;
    findById(id: number): Promise<User | undefined>;
    findByEmail(email: string): Promise<User | undefined>;
    create(data: CreateUserDto): Promise<User>;
    update(id: number, data: Partial<CreateUserDto>): Promise<User | undefined>;
    delete(id: number): Promise<boolean>;
    markEmailAsVerified(id: number): Promise<void>;
}
```

#### Key Features

- **Password Security**: Automatic password hashing on create
- **Email Verification**: Built-in email verification status tracking
- **Selective Field Return**: Excludes sensitive data like passwords in most operations
- **Type Safety**: Strongly typed with Drizzle schema integration

#### Usage Examples

```typescript
// Create new user
const userData: CreateUserDto = {
    email: "user@example.com",
    password: "securepassword",
};
const newUser = await userRepo.create(userData);

// Find user for authentication (includes password)
const user = await userRepo.findByEmail("user@example.com");
if (user && (await comparePassword(password, user.password))) {
    // Authentication success
}

// Update user profile
const updated = await userRepo.update(userId, { email: "newemail@example.com" });

// Mark email as verified
await userRepo.markEmailAsVerified(userId);
```

### TokenRepository

Manages JWT tokens with Redis-based caching for performance and security.

#### Interface

```typescript
export interface ITokenRepository {
    storeRefreshToken(jti: string, familyId: string): Promise<void>;
    revokeRefreshToken(jti: string): Promise<void>;
    revokeFamily(familyId: string): Promise<void>;
    isRefreshTokenValid(jti: string): Promise<boolean>;
    addToDenyList(jti: string, ttlSeconds: number): Promise<void>;
    isAccessTokenRevoked(jti: string): Promise<boolean>;
}
```

#### Key Features

- **Refresh Token Families**: Groups related tokens for security
- **Redis Caching**: Fast token validation
- **Token Revocation**: Individual and family-based revocation
- **Access Token Deny List**: Immediate token invalidation
- **TTL Management**: Automatic expiration handling

#### Usage Examples

```typescript
// Store refresh token with family
const familyId = uuidv4();
const jti = uuidv4();
await tokenRepo.storeRefreshToken(jti, familyId);

// Check token validity
const isValid = await tokenRepo.isRefreshTokenValid(jti);

// Revoke specific token
await tokenRepo.revokeRefreshToken(jti);

// Revoke entire token family (logout from all devices)
await tokenRepo.revokeFamily(familyId);

// Add access token to deny list
await tokenRepo.addToDenyList(accessJti, 3600); // 1 hour TTL
```

### UserPermissionRepository

Optimized repository for user permission lookups with caching.

#### Interface

```typescript
export interface IUserPermissionRepository {
    getPermissions(userId: number, options?: { useCache?: boolean }): Promise<Permission[]>;
    invalidateUserPermissions(userId: number): Promise<void>;
    invalidateAllUserPermissions(): Promise<void>;
}
```

#### Key Features

- **Performance Caching**: 5-minute Redis cache for permissions
- **Cache Invalidation**: Selective and bulk cache clearing
- **Role-based Permissions**: Aggregates permissions from user roles
- **Graceful Degradation**: Continues working if cache fails

#### Usage Examples

```typescript
// Get user permissions (with caching)
const permissions = await userPermissionRepo.getPermissions(userId);

// Get fresh permissions (bypass cache)
const freshPermissions = await userPermissionRepo.getPermissions(userId, { useCache: false });

// Invalidate cache when roles change
await userPermissionRepo.invalidateUserPermissions(userId);

// Invalidate all user permissions (when permissions are updated globally)
await userPermissionRepo.invalidateAllUserPermissions();
```

### RoleRepository

Comprehensive role management with permission relationships.

#### Interface

```typescript
export interface IRoleRepository {
    findAll(): Promise<Role[]>;
    findById(id: number): Promise<Role | undefined>;
    findByName(name: string): Promise<Role | undefined>;
    findByIds(ids: number[]): Promise<Role[]>;
    findByIdWithPermissions(id: number): Promise<RoleWithPermissions | undefined>;
    findAllWithPermissions(): Promise<RoleWithPermissions[]>;
    create(data: CreateRoleDto): Promise<Role>;
    update(id: number, data: UpdateRoleDto): Promise<Role | undefined>;
    delete(id: number): Promise<boolean>;
    assignPermission(data: AssignRolePermissionDto): Promise<void>;
    removePermission(roleId: number, permissionId: number): Promise<boolean>;
    hasPermission(roleId: number, permissionName: string): Promise<boolean>;
    setPermissions(roleId: number, permissionIds: number[]): Promise<void>;
    getPermissions(roleId: number): Promise<Permission[]>;
}
```

#### Key Features

- **Rich Queries**: Multiple ways to fetch roles
- **Permission Management**: Full CRUD for role-permission relationships
- **Bulk Operations**: Efficient bulk permission assignment
- **Relationship Loading**: Eager loading of permissions when needed

#### Usage Examples

```typescript
// Create role with permissions
const role = await roleRepo.create({ name: "editor" });
await roleRepo.assignPermission({ roleId: role.id, permissionId: 1 });

// Get role with all permissions
const roleWithPerms = await roleRepo.findByIdWithPermissions(roleId);

// Set all permissions for a role (replaces existing)
await roleRepo.setPermissions(roleId, [1, 2, 3]);

// Check if role has specific permission
const hasPermission = await roleRepo.hasPermission(roleId, "user:read");
```

### UserRoleRepository

Manages user-role assignments efficiently.

#### Interface

```typescript
export interface IUserRoleRepository {
    assignRoles(userId: number, roleIds: number[]): Promise<void>;
    removeRoles(userId: number, roleIds: number[]): Promise<void>;
    getRoles(userId: number): Promise<Role[]>;
}
```

#### Key Features

- **Duplicate Prevention**: Automatically prevents duplicate role assignments
- **Bulk Operations**: Efficient batch role assignment/removal
- **Optimized Queries**: Only inserts new role assignments

#### Usage Examples

```typescript
// Assign multiple roles to user
await userRoleRepo.assignRoles(userId, [1, 2, 3]);

// Remove specific roles
await userRoleRepo.removeRoles(userId, [2]);

// Get all user roles
const userRoles = await userRoleRepo.getRoles(userId);
```

### PermissionRepository

Basic CRUD operations for permissions.

#### Interface

```typescript
export interface IPermissionRepository {
    findAll(): Promise<Permission[]>;
    findById(id: number): Promise<Permission | undefined>;
    findByName(name: string): Promise<Permission | undefined>;
    create(data: CreatePermissionDto): Promise<Permission>;
    update(id: number, data: UpdatePermissionDto): Promise<Permission | undefined>;
    delete(id: number): Promise<boolean>;
}
```

#### Usage Examples

```typescript
// Create permission
const permission = await permissionRepo.create({
    name: "product:create",
    description: "Create products",
});

// Find by name
const permission = await permissionRepo.findByName("user:read");

// Update permission
await permissionRepo.update(permissionId, { description: "Updated description" });
```

### EmailVerificationRepository

Manages email verification tokens lifecycle.

#### Interface

```typescript
export interface IEmailVerificationRepository {
    create(userId: number, token: string): Promise<void>;
    findByToken(token: string): Promise<{ id: number; userId: number } | null>;
    markAsVerified(id: number): Promise<void>;
    deleteByUserId(userId: number): Promise<void>;
}
```

#### Key Features

- **Token Management**: Secure token generation and validation
- **Automatic Cleanup**: Removes old tokens when creating new ones
- **Status Tracking**: Tracks verification status to prevent reuse

#### Usage Examples

```typescript
// Create verification token
await emailVerificationRepo.create(userId, secureToken);

// Verify token
const verification = await emailVerificationRepo.findByToken(token);
if (verification) {
    await emailVerificationRepo.markAsVerified(verification.id);
}

// Clean up user tokens
await emailVerificationRepo.deleteByUserId(userId);
```

## Testing Patterns

### Unit Testing with Mocks

```typescript
describe("UserService", () => {
    let mockUserRepo: jest.Mocked<IUserRepository>;
    let userService: UserService;

    beforeEach(() => {
        mockUserRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            markEmailAsVerified: jest.fn(),
        };
        userService = new UserService(mockUserRepo);
    });

    it("should create user when email is unique", async () => {
        const userData = { email: "test@example.com", password: "password" };
        mockUserRepo.findByEmail.mockResolvedValue(undefined);
        mockUserRepo.create.mockResolvedValue({ id: 1, ...userData });

        const result = await userService.createUser(userData);

        expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(userData.email);
        expect(mockUserRepo.create).toHaveBeenCalledWith(userData);
        expect(result.id).toBe(1);
    });
});
```

### Integration Testing with Mock Repositories

```typescript
import { MockUserRepository } from "@tests/mocks/repositories/mock-user.repository";

describe("User Integration Tests", () => {
    let testContainer: Container;
    let userRepo: IUserRepository;

    beforeEach(() => {
        testContainer = createEmptyTestContainer();
        MockUserRepository.bindToContainer(testContainer);
        userRepo = MockUserRepository.getInstance();
    });

    it("should handle complete user lifecycle", async () => {
        // Create user
        const userData = { email: "test@example.com", password: "password" };
        const user = await userRepo.create(userData);
        expect(user.id).toBeDefined();

        // Find by email
        const foundUser = await userRepo.findByEmail(userData.email);
        expect(foundUser?.email).toBe(userData.email);

        // Update user
        const updated = await userRepo.update(user.id, { email: "new@example.com" });
        expect(updated?.email).toBe("new@example.com");

        // Delete user
        const deleted = await userRepo.delete(user.id);
        expect(deleted).toBe(true);
    });
});
```

### Mock Repository Configuration

```typescript
// Configure mock behavior
MockUserRepository.configureInstance({
    shouldSimulateError: false,
    delay: 0,
    hashPasswords: true,
});

// Seed test data
const testUsers = [
    { id: 1, email: "admin@example.com", password: "hashed_admin", emailVerified: true },
    { id: 2, email: "user@example.com", password: "hashed_user", emailVerified: false },
];
MockUserRepository.getInstance().seedUsers(testUsers);

// Test with error simulation
MockUserRepository.configureInstance({ shouldSimulateError: true });
await expect(userRepo.findAll()).rejects.toThrow();
```

## Best Practices

### Repository Design

1. **Interface-First**: Always define interfaces before implementations
2. **Single Responsibility**: Each repository handles one entity type
3. **Consistent Naming**: Use standard CRUD method names
4. **Type Safety**: Leverage TypeScript and Drizzle schemas
5. **Error Handling**: Return `undefined` for not found, throw for errors

### Data Access Patterns

1. **Selective Fields**: Don't return sensitive data unless necessary
2. **Batch Operations**: Use bulk operations for better performance
3. **Caching Strategy**: Cache frequently accessed, slow-changing data
4. **Transaction Support**: Use database transactions for multi-step operations

### Testing Guidelines

1. **Mock Interfaces**: Mock repository interfaces, not implementations
2. **Test Edge Cases**: Test not found, duplicate, and error scenarios
3. **Verify Interactions**: Assert repository methods are called correctly
4. **Use Test Data**: Create realistic test data for integration tests

### Performance Considerations

1. **Query Optimization**: Use appropriate indexes and query patterns
2. **Caching**: Implement caching for expensive queries
3. **Pagination**: Support pagination for large result sets
4. **Connection Pooling**: Leverage database connection pooling

## Error Handling

### Standard Patterns

```typescript
// Repository method that might not find data
async findById(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(usersTable).where(eq(usersTable.id, id));
    return user; // Returns undefined if not found
}

// Repository method that expects to find data
async update(id: number, data: UpdateUserDto): Promise<User | undefined> {
    const [user] = await this.db
        .update(usersTable)
        .set(data)
        .where(eq(usersTable.id, id))
        .returning();

    return user; // Returns undefined if user doesn't exist
}

// Repository method that indicates success/failure
async delete(id: number): Promise<boolean> {
    const result = await this.db
        .delete(usersTable)
        .where(eq(usersTable.id, id))
        .returning({ id: usersTable.id });

    return result.length > 0;
}
```

### Error Categories

1. **Not Found**: Return `undefined` or empty arrays
2. **Database Errors**: Let database errors bubble up
3. **Validation Errors**: Should be handled at service layer
4. **Cache Errors**: Log warnings but don't fail operations

## Integration with Services

### Dependency Injection

```typescript
@injectable()
export class UserService {
    constructor(
        @inject(TYPES.IUserRepository) private userRepo: IUserRepository,
        @inject(TYPES.IUserRoleRepository) private userRoleRepo: IUserRoleRepository,
        @inject(TYPES.IUserPermissionRepository) private userPermissionRepo: IUserPermissionRepository,
    ) {}

    async createUserWithRole(userData: CreateUserDto, roleName: string): Promise<User> {
        // Create user
        const user = await this.userRepo.create(userData);

        // Find role
        const role = await this.roleRepo.findByName(roleName);
        if (!role) throw new Error("Role not found");

        // Assign role
        await this.userRoleRepo.assignRoles(user.id, [role.id]);

        // Invalidate permission cache
        await this.userPermissionRepo.invalidateUserPermissions(user.id);

        return user;
    }
}
```

### Cross-Repository Operations

```typescript
// Service coordinating multiple repositories
async assignUserRole(userId: number, roleName: string): Promise<void> {
    // Verify user exists
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error("User not found");

    // Find role
    const role = await this.roleRepo.findByName(roleName);
    if (!role) throw new Error("Role not found");

    // Assign role
    await this.userRoleRepo.assignRoles(userId, [role.id]);

    // Clear permission cache
    await this.userPermissionRepo.invalidateUserPermissions(userId);
}
```

## Extension Points

### Adding New Repositories

1. **Define Interface**: Create interface with method signatures
2. **Implement Repository**: Create implementation with Drizzle ORM
3. **Add to DI Container**: Register in dependency injection container
4. **Create Tests**: Add unit and integration tests
5. **Create Mocks**: Create mock implementation for testing

```typescript
// 1. Define interface
export interface IProductRepository {
    findAll(): Promise<Product[]>;
    findById(id: number): Promise<Product | undefined>;
    create(data: CreateProductDto): Promise<Product>;
    // ... other methods
}

// 2. Implement repository
@injectable()
export class ProductRepository implements IProductRepository {
    constructor(@inject(TYPES.IDatabaseService) private db: IDatabaseService) {}

    async findAll(): Promise<Product[]> {
        return this.db.select().from(productsTable);
    }
    // ... other methods
}

// 3. Register in container
container.bind<IProductRepository>(TYPES.IProductRepository).to(ProductRepository);
```

### Custom Query Methods

```typescript
// Add specialized query methods to existing repositories
export interface IUserRepository {
    // ... existing methods
    findActiveUsers(): Promise<User[]>;
    findUsersByRole(roleName: string): Promise<User[]>;
    findUnverifiedUsers(olderThan: Date): Promise<User[]>;
}

// Implementation
async findActiveUsers(): Promise<User[]> {
    return this.db
        .select()
        .from(usersTable)
        .where(and(
            eq(usersTable.emailVerified, true),
            isNull(usersTable.deletedAt)
        ));
}
```

## Future Enhancements

### Potential Improvements

1. **Audit Logging**: Add audit trails for data changes
2. **Soft Deletes**: Implement soft delete functionality
3. **Optimistic Locking**: Add version-based concurrency control
4. **Query Builder**: Enhanced query building for complex filters
5. **Event Sourcing**: Event-driven data change tracking

### Performance Optimizations

1. **Read Replicas**: Separate read/write database connections
2. **Query Analysis**: Monitor and optimize slow queries
3. **Cache Warming**: Preload frequently accessed data
4. **Bulk Operations**: Optimize batch operations
5. **Connection Pooling**: Fine-tune database connection pools

This repository layer provides a solid foundation for data access in the application, with clear separation of concerns, comprehensive testing support, and excellent performance characteristics through strategic caching and optimized query patterns.
