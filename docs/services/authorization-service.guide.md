# Authorization Service Guide

## Overview

The `AuthorizationService` manages Role-Based Access Control (RBAC) operations, providing comprehensive permission checking, role validation, and user authorization capabilities. It's the central service for all access control decisions in the application.

## Interface

```typescript
export interface IAuthorizationService {
    // Permission checking
    hasPermission(userId: number, permissionName: string): Promise<boolean>;
    hasAnyPermission(userId: number, permissionNames: string[]): Promise<boolean>;
    hasAllPermissions(userId: number, permissionNames: string[]): Promise<boolean>;

    // Role checking
    hasRole(userId: number, roleName: string): Promise<boolean>;
    hasAnyRole(userId: number, roleNames: string[]): Promise<boolean>;
    hasAllRoles(userId: number, roleNames: string[]): Promise<boolean>;

    // Data retrieval
    getUserPermissions(userId: number, options?: { useCache?: boolean }): Promise<Permission[]>;
    getUserRoles(userId: number): Promise<string[]>;

    // Advanced authorization
    canPerformAction(userId: number, action: string, resource?: string): Promise<boolean>;
}
```

## Dependencies

The service orchestrates multiple RBAC repositories:

```typescript
@injectable()
export default class AuthorizationService implements IAuthorizationService {
    constructor(
        @inject(TYPES.IUserRoleRepository) private readonly userRoleRepo: IUserRoleRepository,
        @inject(TYPES.IUserPermissionRepository) private readonly userPermissionRepo: IUserPermissionRepository,
        @inject(TYPES.IRoleRepository) private readonly roleRepo: IRoleRepository,
        @inject(TYPES.ICacheService) private readonly cacheService: ICacheService,
    ) {}
}
```

## Core Operations

### Permission Checking

#### Single Permission Check

```typescript
async hasPermission(userId: number, permissionName: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, { useCache: true });
    return permissions.some(p => p.name === permissionName);
}
```

#### Multiple Permission Checks

```typescript
async hasAnyPermission(userId: number, permissionNames: string[]): Promise<boolean> {
    if (permissionNames.length === 0) return false;

    const permissions = await this.getUserPermissions(userId, { useCache: true });
    const userPermissionNames = new Set(permissions.map(p => p.name));

    return permissionNames.some(name => userPermissionNames.has(name));
}

async hasAllPermissions(userId: number, permissionNames: string[]): Promise<boolean> {
    if (permissionNames.length === 0) return true;

    const permissions = await this.getUserPermissions(userId, { useCache: true });
    const userPermissionNames = new Set(permissions.map(p => p.name));

    return permissionNames.every(name => userPermissionNames.has(name));
}
```

### Role Checking

#### Single Role Check

```typescript
async hasRole(userId: number, roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes(roleName);
}
```

#### Multiple Role Checks

```typescript
async hasAnyRole(userId: number, roleNames: string[]): Promise<boolean> {
    if (roleNames.length === 0) return false;

    const userRoles = await this.getUserRoles(userId);
    const userRoleSet = new Set(userRoles);

    return roleNames.some(role => userRoleSet.has(role));
}

async hasAllRoles(userId: number, roleNames: string[]): Promise<boolean> {
    if (roleNames.length === 0) return true;

    const userRoles = await this.getUserRoles(userId);
    const userRoleSet = new Set(userRoles);

    return roleNames.every(role => userRoleSet.has(role));
}
```

### User Permissions Aggregation

```typescript
async getUserPermissions(userId: number, options?: { useCache?: boolean }): Promise<Permission[]> {
    const cacheKey = `user:${userId}:permissions`;

    // Try cache first (unless explicitly disabled)
    if (options?.useCache !== false) {
        const cached = await this.cacheService.client.get(cacheKey);
        if (cached) {
            return JSON.parse(cached) as Permission[];
        }
    }

    // Fetch from database
    const permissions = await this.getPermissionsFromDatabase(userId);

    // Cache for 1 hour
    await this.cacheService.client.setEx(cacheKey, 3600, JSON.stringify(permissions));

    return permissions;
}

private async getPermissionsFromDatabase(userId: number): Promise<Permission[]> {
    // Get permissions from roles
    const rolePermissions = await this.userRoleRepo.getUserPermissions(userId);

    // Get direct user permissions
    const directPermissions = await this.userPermissionRepo.getUserPermissions(userId);

    // Combine and deduplicate
    const allPermissions = [...rolePermissions, ...directPermissions];
    const uniquePermissions = this.deduplicatePermissions(allPermissions);

    return uniquePermissions;
}
```

### Advanced Authorization

#### Action-Based Authorization

```typescript
async canPerformAction(userId: number, action: string, resource?: string): Promise<boolean> {
    // Build permission name from action and resource
    const permissionName = resource ? `${action}:${resource}` : action;

    // Check for specific permission
    if (await this.hasPermission(userId, permissionName)) {
        return true;
    }

    // Check for wildcard permissions
    const wildcardPermission = resource ? `${action}:*` : `${action}`;
    if (await this.hasPermission(userId, wildcardPermission)) {
        return true;
    }

    // Check for admin role (can do everything)
    return this.hasRole(userId, 'admin');
}
```

## Caching Strategy

### Permission Caching

The service implements intelligent caching for user permissions:

```typescript
// Cache Structure
const cacheKey = `user:${userId}:permissions`;
const cacheTTL = 3600; // 1 hour

// Cache Invalidation
async invalidateUserPermissions(userId: number): Promise<void> {
    const cacheKey = `user:${userId}:permissions`;
    await this.cacheService.client.del(cacheKey);
}

// Batch Cache Invalidation
async invalidateUsersPermissions(userIds: number[]): Promise<void> {
    const keys = userIds.map(id => `user:${id}:permissions`);
    if (keys.length > 0) {
        await this.cacheService.client.del(keys);
    }
}
```

### Cache Benefits

- **Performance**: O(1) permission lookups after initial cache
- **Reduced Database Load**: Fewer complex JOIN queries
- **Consistency**: TTL-based cache expiration ensures data freshness
- **Flexibility**: Can bypass cache when needed

## Permission Aggregation

### Hierarchical Permission Resolution

The service aggregates permissions from multiple sources:

1. **Direct User Permissions**: Permissions assigned directly to the user
2. **Role-Based Permissions**: Permissions inherited from assigned roles
3. **Permission Inheritance**: Higher-level permissions that include lower-level ones

```typescript
private deduplicatePermissions(permissions: Permission[]): Permission[] {
    const seen = new Set<number>();
    return permissions.filter(permission => {
        if (seen.has(permission.id)) {
            return false;
        }
        seen.add(permission.id);
        return true;
    });
}
```

### Permission Priority

1. **Explicit Deny**: If explicitly denied, access is forbidden
2. **Explicit Allow**: If explicitly allowed, access is granted
3. **Role-Based**: Check role-based permissions
4. **Default Deny**: If no permission found, access is denied

## Error Handling

### Authorization Errors

```typescript
// Permission errors
throw new Error("InsufficientPermissions"); // User lacks required permission
throw new Error("InvalidPermission"); // Permission doesn't exist
throw new Error("UserNotFound"); // User doesn't exist

// Role errors
throw new Error("InvalidRole"); // Role doesn't exist
throw new Error("RoleNotAssigned"); // User doesn't have required role

// System errors
throw new Error("AuthorizationServiceError"); // Internal service error
```

### Graceful Degradation

```typescript
async hasPermissionSafe(userId: number, permissionName: string): Promise<boolean> {
    try {
        return await this.hasPermission(userId, permissionName);
    } catch (error) {
        // Log error but don't expose internal details
        console.error('Authorization check failed:', error);

        // Default to deny access on error
        return false;
    }
}
```

## Usage Examples

### Middleware Integration

```typescript
// Authorization middleware using the service
@injectable()
export default class AuthorizationMiddleware implements IAuthorizationMiddleware {
    constructor(
        @inject(TYPES.IAuthorizationService)
        private readonly authzService: IAuthorizationService,
    ) {}

    requirePermission(permission: string) {
        return async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.user?.id;

            if (!userId || !(await this.authzService.hasPermission(userId, permission))) {
                return res.status(403).json({
                    success: false,
                    message: "Insufficient permissions",
                });
            }

            next();
        };
    }
}
```

### Controller Usage

```typescript
@injectable()
export default class UsersController {
    constructor(
        @inject(TYPES.IAuthorizationService)
        private readonly authzService: IAuthorizationService,
    ) {}

    async deleteUser(req: Request, res: Response): Promise<void> {
        const userId = req.user.id;
        const targetUserId = parseInt(req.params.id);

        // Check if user can delete users OR can delete own account
        const canDeleteUsers = await this.authzService.hasPermission(userId, "users:delete");
        const canDeleteOwn =
            userId === targetUserId && (await this.authzService.hasPermission(userId, "profile:delete"));

        if (!canDeleteUsers && !canDeleteOwn) {
            res.status(403).json({
                success: false,
                message: "Cannot delete this user",
            });
            return;
        }

        // Proceed with deletion
        await this.userService.deleteUser(targetUserId);
        res.json({ success: true, message: "User deleted" });
    }
}
```

### Service-to-Service Authorization

```typescript
@injectable()
export default class PostService {
    constructor(
        @inject(TYPES.IAuthorizationService)
        private readonly authzService: IAuthorizationService,
    ) {}

    async createPost(userId: number, postData: CreatePostDto): Promise<Post> {
        // Check if user can create posts
        if (!(await this.authzService.hasPermission(userId, "posts:create"))) {
            throw new Error("InsufficientPermissions");
        }

        return this.postRepo.create({ ...postData, authorId: userId });
    }
}
```

## Testing

### Unit Testing

```typescript
describe("AuthorizationService", () => {
    let authzService: AuthorizationService;
    let mockUserRoleRepo: jest.Mocked<IUserRoleRepository>;
    let mockUserPermissionRepo: jest.Mocked<IUserPermissionRepository>;
    let mockCacheService: jest.Mocked<ICacheService>;

    beforeEach(() => {
        // Setup mocks
        mockUserRoleRepo = {
            getUserPermissions: jest.fn(),
        };

        authzService = new AuthorizationService(
            mockUserRoleRepo,
            mockUserPermissionRepo,
            mockRoleRepo,
            mockCacheService,
        );
    });

    describe("hasPermission", () => {
        it("should return true when user has permission", async () => {
            const mockPermissions = [{ id: 1, name: "posts:create", resource: "posts", action: "create" }];

            jest.spyOn(authzService, "getUserPermissions").mockResolvedValue(mockPermissions);

            const result = await authzService.hasPermission(1, "posts:create");
            expect(result).toBe(true);
        });

        it("should return false when user lacks permission", async () => {
            jest.spyOn(authzService, "getUserPermissions").mockResolvedValue([]);

            const result = await authzService.hasPermission(1, "posts:create");
            expect(result).toBe(false);
        });
    });
});
```

### Integration Testing

```typescript
describe("AuthorizationService Integration", () => {
    let container: Container;
    let authzService: IAuthorizationService;

    beforeEach(async () => {
        // Setup test container and database
        container = createTestContainer();
        authzService = container.get<IAuthorizationService>(TYPES.IAuthorizationService);

        // Seed test data
        await seedTestData();
    });

    it("should correctly aggregate permissions from roles and direct assignments", async () => {
        // User has 'editor' role and direct 'posts:delete' permission
        const permissions = await authzService.getUserPermissions(testUserId);

        expect(permissions).toContainEqual(
            expect.objectContaining({ name: "posts:create" }), // From editor role
        );
        expect(permissions).toContainEqual(
            expect.objectContaining({ name: "posts:delete" }), // Direct permission
        );
    });
});
```

## Performance Optimization

### Batch Operations

```typescript
// Batch permission checks for multiple users
async checkMultipleUsersPermission(
    userIds: number[],
    permission: string
): Promise<Map<number, boolean>> {
    const results = new Map<number, boolean>();

    // Batch fetch all user permissions
    const userPermissions = await Promise.all(
        userIds.map(id => this.getUserPermissions(id, { useCache: true }))
    );

    // Check permission for each user
    userIds.forEach((userId, index) => {
        const hasPermission = userPermissions[index]
            .some(p => p.name === permission);
        results.set(userId, hasPermission);
    });

    return results;
}
```

### Optimized Cache Usage

```typescript
// Warm cache for multiple users
async warmPermissionCache(userIds: number[]): Promise<void> {
    const uncachedUsers = [];

    // Check which users need cache warming
    for (const userId of userIds) {
        const cacheKey = `user:${userId}:permissions`;
        const cached = await this.cacheService.client.exists(cacheKey);
        if (!cached) {
            uncachedUsers.push(userId);
        }
    }

    // Batch fetch and cache permissions for uncached users
    if (uncachedUsers.length > 0) {
        await Promise.all(
            uncachedUsers.map(userId =>
                this.getUserPermissions(userId, { useCache: false })
            )
        );
    }
}
```

## Best Practices

### Security

1. **Default Deny**: Always deny access if no explicit permission is found
2. **Validate User Existence**: Ensure user exists before checking permissions
3. **Use Specific Permissions**: Prefer specific permissions over broad ones
4. **Cache Securely**: Don't cache sensitive data longer than necessary
5. **Log Authorization Events**: Track permission checks for auditing

### Performance

1. **Cache Aggressively**: Cache permission data with appropriate TTL
2. **Batch Database Queries**: Minimize database roundtrips
3. **Use Set Operations**: Use Sets for efficient permission lookups
4. **Optimize Permission Queries**: Index database properly for permission lookups

### Design

1. **Keep Logic in Service**: Don't duplicate authorization logic in controllers
2. **Use Descriptive Names**: Make permission names self-documenting
3. **Handle Edge Cases**: Account for empty arrays and null values
4. **Provide Flexibility**: Allow bypassing cache when consistency is critical

## Related Documentation

- [Authentication Service Guide](./authentication-service.guide.md)
- [RBAC Repositories Guide](../repositories/rbac-repositories.guide.md)
- [Role Service Guide](./role-service.guide.md)
- [Permission Service Guide](./permission-service.guide.md)
- [Authorization Middleware Guide](../middlewares/authorization-middleware.guide.md)
