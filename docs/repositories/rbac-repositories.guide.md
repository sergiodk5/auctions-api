# RBAC Repositories Guide

## Overview

The RBAC (Role-Based Access Control) repositories handle role and permission management in the system. This consists of three interconnected repositories that work together to provide comprehensive authorization capabilities:

- **RoleRepository**: Manages roles and role-permission relationships
- **PermissionRepository**: Manages individual permissions
- **UserRoleRepository**: Manages user-role assignments
- **UserPermissionRepository**: Optimized user permission aggregation with caching

## Architecture

### RBAC Model

```
Users ←→ UserRoles ←→ Roles ←→ RolePermissions ←→ Permissions
```

### Repository Responsibilities

| Repository                 | Primary Function            | Key Features                          |
| -------------------------- | --------------------------- | ------------------------------------- |
| `PermissionRepository`     | Permission CRUD             | Basic permission management           |
| `RoleRepository`           | Role CRUD + Role-Permission | Complex relationship management       |
| `UserRoleRepository`       | User-Role assignments       | Bulk operations, duplicate prevention |
| `UserPermissionRepository` | Permission aggregation      | High-performance caching              |

## PermissionRepository

### Interface

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

### Usage Examples

```typescript
// Create system permissions
const permissions = [
    { name: "user:read", description: "View user profiles" },
    { name: "user:write", description: "Edit user profiles" },
    { name: "user:delete", description: "Delete user accounts" },
    { name: "admin:*", description: "Full administrative access" },
];

for (const permData of permissions) {
    await permissionRepo.create(permData);
}

// Find permission by name for role assignment
const permission = await permissionRepo.findByName("user:read");
if (permission) {
    await roleRepo.assignPermission({ roleId: editorRole.id, permissionId: permission.id });
}
```

## RoleRepository

### Interface

```typescript
export interface IRoleRepository {
    // Basic CRUD
    findAll(): Promise<Role[]>;
    findById(id: number): Promise<Role | undefined>;
    findByName(name: string): Promise<Role | undefined>;
    findByIds(ids: number[]): Promise<Role[]>;

    // Enhanced queries
    findByIdWithPermissions(id: number): Promise<RoleWithPermissions | undefined>;
    findAllWithPermissions(): Promise<RoleWithPermissions[]>;

    // CRUD operations
    create(data: CreateRoleDto): Promise<Role>;
    update(id: number, data: UpdateRoleDto): Promise<Role | undefined>;
    delete(id: number): Promise<boolean>;

    // Permission management
    assignPermission(data: AssignRolePermissionDto): Promise<void>;
    removePermission(roleId: number, permissionId: number): Promise<boolean>;
    hasPermission(roleId: number, permissionName: string): Promise<boolean>;
    setPermissions(roleId: number, permissionIds: number[]): Promise<void>;
    getPermissions(roleId: number): Promise<Permission[]>;
}
```

### Key Features

#### 1. Enhanced Queries

```typescript
// Get role with all its permissions
const adminRole = await roleRepo.findByIdWithPermissions(1);
// Returns: { id: 1, name: "admin", permissions: [...] }

// Get all roles with their permissions
const allRoles = await roleRepo.findAllWithPermissions();
// Useful for admin interfaces
```

#### 2. Permission Management

```typescript
// Assign individual permission
await roleRepo.assignPermission({
    roleId: editorRole.id,
    permissionId: userReadPermission.id,
});

// Set all permissions at once (replaces existing)
await roleRepo.setPermissions(editorRole.id, [1, 2, 3]);

// Check if role has permission
const canRead = await roleRepo.hasPermission(editorRole.id, "user:read");
```

#### 3. Bulk Operations

```typescript
// Create role system
const roles = await Promise.all([
    roleRepo.create({ name: "admin" }),
    roleRepo.create({ name: "editor" }),
    roleRepo.create({ name: "viewer" }),
]);

// Setup role permissions
await roleRepo.setPermissions(roles[0].id, [1, 2, 3, 4]); // admin: all
await roleRepo.setPermissions(roles[1].id, [1, 2]); // editor: read, write
await roleRepo.setPermissions(roles[2].id, [1]); // viewer: read only
```

## UserRoleRepository

### Interface

```typescript
export interface IUserRoleRepository {
    assignRoles(userId: number, roleIds: number[]): Promise<void>;
    removeRoles(userId: number, roleIds: number[]): Promise<void>;
    getRoles(userId: number): Promise<Role[]>;
}
```

### Key Features

#### 1. Duplicate Prevention

```typescript
// Automatically prevents duplicate assignments
await userRoleRepo.assignRoles(userId, [1, 2, 3]); // Initial assignment
await userRoleRepo.assignRoles(userId, [2, 3, 4]); // Only assigns role 4

// Implementation handles duplicates efficiently:
const existingRoles = await this.db
    .select()
    .from(userRolesTable)
    .where(and(eq(userRolesTable.user_id, userId), inArray(userRolesTable.role_id, roleIds)));
const existingRoleIds = new Set(existingRoles.map((r) => r.role_id));
const newRoleIds = roleIds.filter((roleId) => !existingRoleIds.has(roleId));
```

#### 2. Bulk Operations

```typescript
// Assign multiple roles efficiently
await userRoleRepo.assignRoles(userId, [adminRole.id, editorRole.id]);

// Remove specific roles
await userRoleRepo.removeRoles(userId, [editorRole.id]);

// Get all user roles
const userRoles = await userRoleRepo.getRoles(userId);
```

### Usage Patterns

```typescript
// User promotion workflow
class UserService {
    async promoteToEditor(userId: number): Promise<void> {
        // Remove viewer role, add editor role
        const viewerRole = await this.roleRepo.findByName("viewer");
        const editorRole = await this.roleRepo.findByName("editor");

        if (viewerRole) {
            await this.userRoleRepo.removeRoles(userId, [viewerRole.id]);
        }

        if (editorRole) {
            await this.userRoleRepo.assignRoles(userId, [editorRole.id]);
        }

        // Clear permission cache
        await this.userPermissionRepo.invalidateUserPermissions(userId);
    }
}
```

## UserPermissionRepository

### Interface

```typescript
export interface IUserPermissionRepository {
    getPermissions(userId: number, options?: { useCache?: boolean }): Promise<Permission[]>;
    invalidateUserPermissions(userId: number): Promise<void>;
    invalidateAllUserPermissions(): Promise<void>;
}
```

### Key Features

#### 1. Performance Caching

```typescript
// Cached permission lookup (default behavior)
const permissions = await userPermissionRepo.getPermissions(userId);
// First call: Database query + cache store
// Subsequent calls: Redis cache retrieval (~0.5ms)

// Fresh database query (bypass cache)
const freshPermissions = await userPermissionRepo.getPermissions(userId, { useCache: false });
```

#### 2. Cache Management

```typescript
// Invalidate specific user (when roles change)
await userPermissionRepo.invalidateUserPermissions(userId);

// Invalidate all users (when permissions change globally)
await userPermissionRepo.invalidateAllUserPermissions();
```

#### 3. Graceful Degradation

```typescript
// Implementation handles cache failures gracefully
async getPermissions(userId: number, options = {}): Promise<Permission[]> {
    if (options.useCache) {
        try {
            const cached = await this.cache.get(`permissions:user:${userId}`);
            if (cached) return JSON.parse(cached);
        } catch (error) {
            console.warn("Cache failure, using database", error);
            // Continue to database query
        }
    }

    return this.fetchPermissionsFromDatabase(userId);
}
```

## Integration Patterns

### Complete RBAC Setup

```typescript
class RBACSetupService {
    async setupSystemRoles(): Promise<void> {
        // 1. Create permissions
        const permissions = await Promise.all([
            this.permissionRepo.create({ name: "user:read", description: "Read users" }),
            this.permissionRepo.create({ name: "user:write", description: "Write users" }),
            this.permissionRepo.create({ name: "user:delete", description: "Delete users" }),
            this.permissionRepo.create({ name: "admin:*", description: "Admin access" }),
        ]);

        // 2. Create roles
        const roles = await Promise.all([
            this.roleRepo.create({ name: "admin" }),
            this.roleRepo.create({ name: "editor" }),
            this.roleRepo.create({ name: "viewer" }),
        ]);

        // 3. Assign permissions to roles
        await this.roleRepo.setPermissions(
            roles[0].id,
            permissions.map((p) => p.id),
        ); // admin: all
        await this.roleRepo.setPermissions(roles[1].id, [permissions[0].id, permissions[1].id]); // editor: read, write
        await this.roleRepo.setPermissions(roles[2].id, [permissions[0].id]); // viewer: read only

        // 4. Assign roles to users
        await this.userRoleRepo.assignRoles(adminUserId, [roles[0].id]);
        await this.userRoleRepo.assignRoles(editorUserId, [roles[1].id]);
        await this.userRoleRepo.assignRoles(viewerUserId, [roles[2].id]);
    }
}
```

### Authorization Service Integration

```typescript
@injectable()
class AuthorizationService {
    constructor(
        @inject(TYPES.IUserPermissionRepository) private userPermissionRepo: IUserPermissionRepository,
        @inject(TYPES.IUserRoleRepository) private userRoleRepo: IUserRoleRepository,
    ) {}

    async hasPermission(userId: number, permissionName: string): Promise<boolean> {
        const permissions = await this.userPermissionRepo.getPermissions(userId);
        return permissions.some((p) => p.name === permissionName);
    }

    async hasRole(userId: number, roleName: string): Promise<boolean> {
        const roles = await this.userRoleRepo.getRoles(userId);
        return roles.some((r) => r.name === roleName);
    }

    async can(userId: number, action: string, resource?: string): Promise<boolean> {
        const permissionName = resource ? `${action}:${resource}` : action;

        // Check specific permission
        if (await this.hasPermission(userId, permissionName)) return true;

        // Check wildcard permission
        const wildcardPermission = resource ? `${action}:*` : `${action}:*`;
        if (await this.hasPermission(userId, wildcardPermission)) return true;

        // Check admin role
        return this.hasRole(userId, "admin");
    }
}
```

## Testing Strategies

### Unit Testing

```typescript
describe("RoleRepository", () => {
    let mockDb: any;
    let roleRepo: IRoleRepository;

    beforeEach(() => {
        mockDb = createMockDatabase();
        roleRepo = new RoleRepository({ db: mockDb } as any);
    });

    it("should create role and assign permissions", async () => {
        // Mock role creation
        mockDb.insert.mockReturnValue({
            values: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: 1, name: "editor" }]),
        });

        // Mock permission assignment
        mockDb.transaction.mockImplementation(async (callback) => {
            const mockTx = createMockTransaction();
            await callback(mockTx);
        });

        const role = await roleRepo.create({ name: "editor" });
        await roleRepo.setPermissions(role.id, [1, 2, 3]);

        expect(mockDb.insert).toHaveBeenCalled();
        expect(mockDb.transaction).toHaveBeenCalled();
    });
});
```

### Integration Testing

```typescript
describe("RBAC Integration", () => {
    let userRepo: IUserRepository;
    let roleRepo: IRoleRepository;
    let permissionRepo: IPermissionRepository;
    let userRoleRepo: IUserRoleRepository;
    let userPermissionRepo: IUserPermissionRepository;

    beforeEach(async () => {
        // Setup repositories with test container
        const container = createTestContainer();
        userRepo = container.get(TYPES.IUserRepository);
        roleRepo = container.get(TYPES.IRoleRepository);
        // ... other repositories
    });

    it("should handle complete RBAC workflow", async () => {
        // Create user
        const user = await userRepo.create({ email: "test@example.com", password: "password" });

        // Create permission
        const permission = await permissionRepo.create({
            name: "test:action",
            description: "Test permission",
        });

        // Create role with permission
        const role = await roleRepo.create({ name: "test-role" });
        await roleRepo.assignPermission({ roleId: role.id, permissionId: permission.id });

        // Assign role to user
        await userRoleRepo.assignRoles(user.id, [role.id]);

        // Verify user has permission
        const userPermissions = await userPermissionRepo.getPermissions(user.id);
        expect(userPermissions).toContainEqual(expect.objectContaining({ name: "test:action" }));

        // Verify role assignment
        const userRoles = await userRoleRepo.getRoles(user.id);
        expect(userRoles).toContainEqual(expect.objectContaining({ name: "test-role" }));
    });
});
```

## Performance Optimization

### Caching Strategy

```typescript
// User permissions: 5-minute cache
const PERMISSION_CACHE_TTL = 300;

// Role definitions: 1-hour cache (rarely change)
const ROLE_CACHE_TTL = 3600;

// Permission definitions: 24-hour cache (very stable)
const PERMISSION_DEF_CACHE_TTL = 86400;
```

### Batch Operations

```typescript
// Efficient role assignment for multiple users
async assignRoleToUsers(roleId: number, userIds: number[]): Promise<void> {
    const assignments = userIds.map(userId => ({ user_id: userId, role_id: roleId }));

    await this.db.insert(userRolesTable)
        .values(assignments)
        .onConflictDoNothing(); // Handle duplicates gracefully

    // Invalidate caches for all affected users
    await Promise.all(
        userIds.map(userId => this.userPermissionRepo.invalidateUserPermissions(userId))
    );
}
```

### Query Optimization

```typescript
// Optimized permission lookup with single query
private async fetchPermissionsFromDatabase(userId: number): Promise<Permission[]> {
    return this.db
        .selectDistinct({
            id: permissionsTable.id,
            name: permissionsTable.name,
            description: permissionsTable.description,
            created_at: permissionsTable.created_at,
            updated_at: permissionsTable.updated_at,
        })
        .from(userRolesTable)
        .innerJoin(rolePermissionsTable, eq(userRolesTable.role_id, rolePermissionsTable.role_id))
        .innerJoin(permissionsTable, eq(rolePermissionsTable.permission_id, permissionsTable.id))
        .where(eq(userRolesTable.user_id, userId));
}
```

## Common Issues and Solutions

### Issue: Permission Cache Staleness

**Problem**: User permissions not updated after role changes

**Solution**: Automatic cache invalidation

```typescript
async assignRoles(userId: number, roleIds: number[]): Promise<void> {
    // Perform assignment
    await this.performRoleAssignment(userId, roleIds);

    // Invalidate permission cache
    await this.userPermissionRepo.invalidateUserPermissions(userId);
}
```

### Issue: Role Permission Conflicts

**Problem**: Accidentally removing critical permissions

**Solution**: Permission validation and safeguards

```typescript
async removePermission(roleId: number, permissionId: number): Promise<boolean> {
    // Check if this is a critical permission for system roles
    const role = await this.findById(roleId);
    if (role?.name === "admin") {
        const permission = await this.permissionRepo.findById(permissionId);
        if (permission?.name === "admin:*") {
            throw new Error("Cannot remove admin permissions from admin role");
        }
    }

    // Proceed with removal
    return this.performPermissionRemoval(roleId, permissionId);
}
```

### Issue: Circular Role Dependencies

**Problem**: Complex role hierarchies causing issues

**Solution**: Flat role model with permission aggregation

```typescript
// Instead of role hierarchies, use permission aggregation
// User can have multiple roles, permissions are aggregated
const allPermissions = await this.userPermissionRepo.getPermissions(userId);
const uniquePermissions = Array.from(new Map(allPermissions.map((p) => [p.name, p])).values());
```

## Security Considerations

### Permission Naming

```typescript
// Use consistent naming patterns
const PERMISSION_PATTERNS = {
    RESOURCE_ACTION: "resource:action", // user:read, product:create
    WILDCARD: "resource:*", // user:*, admin:*
    SYSTEM: "system:function", // system:backup, system:config
};
```

### Role Assignment Validation

```typescript
async assignRoles(userId: number, roleIds: number[]): Promise<void> {
    // Validate roles exist
    const roles = await this.roleRepo.findByIds(roleIds);
    if (roles.length !== roleIds.length) {
        throw new Error("Some roles do not exist");
    }

    // Check user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    // Perform assignment
    await this.performRoleAssignment(userId, roleIds);
}
```

## Future Enhancements

### Planned Features

1. **Role Hierarchies**: Parent-child role relationships
2. **Permission Categories**: Grouping related permissions
3. **Conditional Permissions**: Context-based permission grants
4. **Audit Trail**: Track all permission changes
5. **Permission Templates**: Predefined permission sets

### Performance Improvements

1. **Permission Denormalization**: Store user permissions directly
2. **Bulk Cache Operations**: Batch cache invalidation
3. **Lazy Loading**: Load permissions on-demand
4. **Permission Bitmap**: Efficient permission storage
5. **Database Partitioning**: Scale role assignments

This RBAC repository system provides a flexible, performant, and secure foundation for authorization in enterprise applications.
