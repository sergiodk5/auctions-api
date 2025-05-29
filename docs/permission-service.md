# Permission Service Usage Guide

The `PermissionService` provides a high-level service layer for managing permissions with CRUD operations and name-based lookups.

## Overview

The Permission Service acts as a business logic layer on top of the Permission Repository, providing:

- CRUD operations for permissions
- Name-based permission lookup
- Input validation and error handling
- Business rule enforcement (e.g., unique permission names)

## Interface

```typescript
export interface IPermissionService {
    getAllPermissions(): Promise<Permission[]>;
    getPermissionById(id: number): Promise<Permission>;
    getPermissionByName(name: string): Promise<Permission>;
    createPermission(data: CreatePermissionDto): Promise<Permission>;
    updatePermission(id: number, data: UpdatePermissionDto): Promise<Permission>;
    deletePermission(id: number): Promise<void>;
}
```

## Basic Usage

```typescript
import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import { IPermissionService } from "@/services/permission.service";

// Get service from DI container
const permissionService = container.get<IPermissionService>(TYPES.IPermissionService);
```

## Operations

### Get All Permissions

```typescript
const permissions = await permissionService.getAllPermissions();
console.log(`Found ${permissions.length} permissions`);
```

### Get Permission by ID

```typescript
try {
    const permission = await permissionService.getPermissionById(1);
    console.log(`Permission: ${permission.name}`);
} catch (error) {
    console.error("Permission not found");
}
```

### Get Permission by Name

```typescript
try {
    const permission = await permissionService.getPermissionByName("users:read");
    console.log(`Permission ID: ${permission.id}`);
} catch (error) {
    console.error("Permission not found");
}
```

### Create Permission

```typescript
try {
    const newPermission = await permissionService.createPermission({
        name: "posts:create",
        description: "Create new posts",
    });
    console.log(`Created permission with ID: ${newPermission.id}`);
} catch (error) {
    console.error("Permission already exists or creation failed");
}
```

### Update Permission

```typescript
try {
    const updatedPermission = await permissionService.updatePermission(1, {
        description: "Updated description",
    });
    console.log(`Updated permission: ${updatedPermission.name}`);
} catch (error) {
    console.error("Permission not found or update failed");
}
```

### Delete Permission

```typescript
try {
    await permissionService.deletePermission(1);
    console.log("Permission deleted successfully");
} catch (error) {
    console.error("Permission not found or deletion failed");
}
```

## Error Handling

The service throws specific error messages for different scenarios:

- `"PermissionNotFound"` - When a permission is not found by ID or name
- `"PermissionExists"` - When trying to create a permission with an existing name

```typescript
try {
    const permission = await permissionService.getPermissionById(999);
} catch (error) {
    if (error.message === "PermissionNotFound") {
        // Handle permission not found
    }
}
```

## Integration Examples

### In a Controller

```typescript
@injectable()
export class PermissionController {
    constructor(
        @inject(TYPES.IPermissionService)
        private readonly permissionService: IPermissionService,
    ) {}

    async getPermissions(req: Request, res: Response) {
        try {
            const permissions = await this.permissionService.getAllPermissions();
            res.json(permissions);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch permissions" });
        }
    }

    async createPermission(req: Request, res: Response) {
        try {
            const permission = await this.permissionService.createPermission(req.body);
            res.status(201).json(permission);
        } catch (error) {
            if (error.message === "PermissionExists") {
                res.status(409).json({ error: "Permission already exists" });
            } else {
                res.status(500).json({ error: "Failed to create permission" });
            }
        }
    }
}
```

### In Authorization Logic

```typescript
@injectable()
export class AuthorizationService {
    constructor(
        @inject(TYPES.IPermissionService)
        private readonly permissionService: IPermissionService,
        @inject(TYPES.IUserPermissionRepository)
        private readonly userPermissionRepo: IUserPermissionRepository,
    ) {}

    async validatePermission(permissionName: string): Promise<boolean> {
        try {
            // Validate that the permission exists
            await this.permissionService.getPermissionByName(permissionName);
            return true;
        } catch (error) {
            return false;
        }
    }

    async userHasPermission(userId: number, permissionName: string): Promise<boolean> {
        // First validate the permission exists
        const isValidPermission = await this.validatePermission(permissionName);
        if (!isValidPermission) {
            return false;
        }

        // Check if user has the permission
        const userPermissions = await this.userPermissionRepo.getPermissions(userId);
        return userPermissions.some((p) => p.name === permissionName);
    }
}
```

## Benefits

1. **Business Logic Separation**: Separates business rules from data access logic
2. **Error Consistency**: Provides consistent error handling across the application
3. **Validation**: Ensures data integrity (e.g., unique permission names)
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Testability**: Easily mockable for unit testing
6. **DI Integration**: Seamlessly integrates with the dependency injection container

## Testing

The service includes comprehensive unit tests covering:

- All CRUD operations
- Error scenarios (not found, already exists)
- Proper repository method calls
- Return value validation

Test coverage: 11 tests covering all methods and error cases.
