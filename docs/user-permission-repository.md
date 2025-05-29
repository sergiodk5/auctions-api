# User Permission Repository Usage Examples

The `UserPermissionRepository` provides efficient permission retrieval for users with Redis caching support.

## Basic Usage

```typescript
import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import { IUserPermissionRepository } from "@/repositories/user-permission.repository";

// Get repository from DI container
const userPermissionRepo = container.get<IUserPermissionRepository>(TYPES.IUserPermissionRepository);

// Get all permissions for a user (with caching enabled by default)
const permissions = await userPermissionRepo.getPermissions(userId);

// Get permissions without caching
const freshPermissions = await userPermissionRepo.getPermissions(userId, { useCache: false });

// Get permissions with explicit caching
const cachedPermissions = await userPermissionRepo.getPermissions(userId, { useCache: true });
```

## Cache Management

```typescript
// Invalidate cache for a specific user (useful when user roles change)
await userPermissionRepo.invalidateUserPermissions(userId);

// Invalidate all user permission caches (useful when permissions or role-permission mappings change)
await userPermissionRepo.invalidateAllUserPermissions();
```

## Integration Examples

### In a Service
```typescript
@injectable()
export class AuthorizationService {
    constructor(
        @inject(TYPES.IUserPermissionRepository) 
        private readonly userPermissionRepo: IUserPermissionRepository
    ) {}

    async userHasPermission(userId: number, requiredPermission: string): Promise<boolean> {
        const permissions = await this.userPermissionRepo.getPermissions(userId);
        return permissions.some(p => p.name === requiredPermission);
    }

    async getUserPermissionNames(userId: number): Promise<string[]> {
        const permissions = await this.userPermissionRepo.getPermissions(userId);
        return permissions.map(p => p.name);
    }
}
```

### In a Middleware
```typescript
export const permissionMiddleware = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userPermissionRepo = container.get<IUserPermissionRepository>(TYPES.IUserPermissionRepository);
        const permissions = await userPermissionRepo.getPermissions(userId);
        
        const hasPermission = permissions.some(p => p.name === requiredPermission);
        if (!hasPermission) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        next();
    };
};
```

### Cache Invalidation After Role Changes
```typescript
// After assigning roles to a user
await userRoleRepo.assignRoles(userId, roleIds);
await userPermissionRepo.invalidateUserPermissions(userId);

// After updating role permissions globally
await roleRepo.setPermissions(roleId, permissionIds);
await userPermissionRepo.invalidateAllUserPermissions();
```

## Performance Benefits

- **5-minute cache TTL**: Reduces database queries for frequently accessed permissions
- **Automatic fallback**: If cache fails, seamlessly falls back to database
- **Selective invalidation**: Invalidate specific users or all users as needed
- **Bulk operations**: Efficient database queries using JOIN operations

## Cache Key Structure

- Individual user permissions: `permissions:user:<userId>`
- Cache TTL: 300 seconds (5 minutes)
- Automatic serialization/deserialization of Permission objects
