# Role Routes Guide

## Overview

Role routes handle role management operations in the RBAC (Role-Based Access Control) system. These routes allow administrators to create, update, delete roles and manage role-permission associations. All role routes require admin-level access.

## Route Structure

### Role Router Setup

```typescript
// src/routes/role.route.ts
import { IRoleController } from "@/controllers/role.controller";
import {
    assignRolePermissionSchema,
    createRoleSchema,
    setRolePermissionsSchema,
    updateRoleSchema,
} from "@/db/rbac-validation.schema";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IAuthorizationMiddleware } from "@/middlewares/authorization.middleware";
import { IValidationMiddleware } from "@/middlewares/validation.middleware";
import express from "express";

const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const roleController = container.get<IRoleController>(TYPES.IRoleController);

const roleRoute = express.Router();

// Apply authentication to all role routes
roleRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));

// Apply admin role requirement to all role routes
roleRoute.use(authorizationMiddleware.requireRoles(["admin"]));
```

## Role CRUD Operations

### List All Roles

```typescript
// GET /api/v1/roles
roleRoute.get("/", roleController.getAllRoles.bind(roleController));
```

**Purpose**: Retrieve all roles in the system
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: None

**Query Parameters** (optional):

```typescript
?include_permissions=true  // Include role permissions in response
?page=1&limit=10          // Pagination parameters
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Roles retrieved successfully",
    data: [
        {
            id: number,
            name: string,
            description: string,
            createdAt: string,
            updatedAt: string,
            permissions?: Permission[] // if include_permissions=true
        }
    ],
    pagination?: {
        page: number,
        limit: number,
        total: number,
        pages: number
    }
}
```

### Create New Role

```typescript
// POST /api/v1/roles
roleRoute.post("/", validationMiddleware.validate(createRoleSchema), roleController.createRole.bind(roleController));
```

**Purpose**: Create a new role
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: `createRoleSchema`

**Request Body**:

```typescript
{
    name: string; // Unique role name
    description: string; // Role description
}
```

**Response**:

```typescript
// Success (201 Created)
{
    success: true,
    message: "Role created successfully",
    data: {
        id: number,
        name: string,
        description: string,
        createdAt: string,
        updatedAt: string
    }
}

// Error (409 Conflict)
{
    success: false,
    message: "Role name already exists"
}
```

### Get Role by ID

```typescript
// GET /api/v1/roles/:id
roleRoute.get("/:id", roleController.getRoleById.bind(roleController));
```

**Purpose**: Retrieve specific role by ID
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: ID parameter validation in controller

**Path Parameters**:

- `id`: Role ID (integer)

**Query Parameters** (optional):

```typescript
?include_permissions=true  // Include role permissions in response
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Role retrieved successfully",
    data: {
        id: number,
        name: string,
        description: string,
        createdAt: string,
        updatedAt: string,
        permissions?: Permission[] // if include_permissions=true
    }
}

// Error (404 Not Found)
{
    success: false,
    message: "Role not found"
}
```

### Update Role

```typescript
// PUT /api/v1/roles/:id
roleRoute.put("/:id", validationMiddleware.validate(updateRoleSchema), roleController.updateRole.bind(roleController));
```

**Purpose**: Update existing role
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: `updateRoleSchema`

**Path Parameters**:

- `id`: Role ID (integer)

**Request Body**:

```typescript
{
    name?: string;        // Updated role name (must be unique)
    description?: string; // Updated role description
}
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Role updated successfully",
    data: {
        id: number,
        name: string,
        description: string,
        createdAt: string,
        updatedAt: string
    }
}

// Error (404 Not Found)
{
    success: false,
    message: "Role not found"
}

// Error (409 Conflict)
{
    success: false,
    message: "Role name already exists"
}
```

### Delete Role

```typescript
// DELETE /api/v1/roles/:id
roleRoute.delete("/:id", roleController.deleteRole.bind(roleController));
```

**Purpose**: Delete role from system
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: ID parameter validation in controller

**Path Parameters**:

- `id`: Role ID (integer)

**Response**:

```typescript
// Success (204 No Content)
// No response body

// Error (404 Not Found)
{
    success: false,
    message: "Role not found"
}

// Error (400 Bad Request)
{
    success: false,
    message: "Cannot delete role: role is assigned to users"
}
```

## Role Permission Management

### Assign Permission to Role

```typescript
// POST /api/v1/roles/:id/permissions
roleRoute.post(
    "/:id/permissions",
    validationMiddleware.validate(assignRolePermissionSchema),
    roleController.assignPermissionToRole.bind(roleController),
);
```

**Purpose**: Assign a single permission to a role
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: `assignRolePermissionSchema`

**Path Parameters**:

- `id`: Role ID (integer)

**Request Body**:

```typescript
{
    permissionId: number; // Permission ID to assign
}
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Permission assigned to role successfully",
    data: {
        roleId: number,
        permissionId: number,
        permission: {
            id: number,
            name: string,
            description: string
        }
    }
}

// Error (404 Not Found)
{
    success: false,
    message: "Role or permission not found"
}

// Error (409 Conflict)
{
    success: false,
    message: "Permission already assigned to role"
}
```

### Remove Permission from Role

```typescript
// DELETE /api/v1/roles/:id/permissions/:permissionId
roleRoute.delete("/:id/permissions/:permissionId", roleController.removePermissionFromRole.bind(roleController));
```

**Purpose**: Remove specific permission from role
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: ID parameter validation in controller

**Path Parameters**:

- `id`: Role ID (integer)
- `permissionId`: Permission ID (integer)

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Permission removed from role successfully"
}

// Error (404 Not Found)
{
    success: false,
    message: "Role or permission not found"
}

// Error (400 Bad Request)
{
    success: false,
    message: "Role does not have this permission"
}
```

### Set All Role Permissions

```typescript
// PUT /api/v1/roles/:id/permissions
roleRoute.put(
    "/:id/permissions",
    validationMiddleware.validate(setRolePermissionsSchema),
    roleController.setRolePermissions.bind(roleController),
);
```

**Purpose**: Set complete list of permissions for a role (replaces all existing permissions)
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: `setRolePermissionsSchema`

**Path Parameters**:

- `id`: Role ID (integer)

**Request Body**:

```typescript
{
    permissionIds: number[];  // Array of permission IDs to set (replaces all existing)
}
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Role permissions updated successfully",
    data: {
        roleId: number,
        permissions: Permission[],
        totalPermissions: number
    }
}

// Error (404 Not Found)
{
    success: false,
    message: "Role not found"
}

// Error (400 Bad Request)
{
    success: false,
    message: "Some permission IDs are invalid"
}
```

## Validation Schemas

### Create Role Schema

```typescript
export const createRoleSchema = z.object({
    body: insertRoleSchema.pick({
        name: true,
        description: true,
    }),
    params: z.object({}),
    query: z.object({}),
});
```

### Update Role Schema

```typescript
export const updateRoleSchema = z.object({
    body: insertRoleSchema
        .pick({
            name: true,
            description: true,
        })
        .partial(),
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number"),
    }),
    query: z.object({}),
});
```

### Assign Role Permission Schema

```typescript
export const assignRolePermissionSchema = z.object({
    body: z.object({
        permissionId: z.number().int().positive("Permission ID must be a positive integer"),
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number"),
    }),
    query: z.object({}),
});
```

### Set Role Permissions Schema

```typescript
export const setRolePermissionsSchema = z.object({
    body: z.object({
        permissionIds: z.array(z.number().int().positive()).min(0, "Permission IDs array required"),
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number"),
    }),
    query: z.object({}),
});
```

## Authorization Strategy

### Admin-Only Access

All role routes require admin role, applied at the router level:

```typescript
// Apply admin requirement to all role routes
roleRoute.use(authorizationMiddleware.requireRoles(["admin"]));
```

This ensures that only users with the `admin` role can:

- View roles and their permissions
- Create, update, or delete roles
- Manage role-permission associations

### Fine-Grained Permissions (Future Enhancement)

For more granular control, you could implement permission-based authorization:

```typescript
// Future: More granular permissions
roleRoute.get("/", authorizationMiddleware.requirePermissions(["role:read"]));
roleRoute.post("/", authorizationMiddleware.requirePermissions(["role:create"]));
roleRoute.put("/:id", authorizationMiddleware.requirePermissions(["role:update"]));
roleRoute.delete("/:id", authorizationMiddleware.requirePermissions(["role:delete"]));
roleRoute.post("/:id/permissions", authorizationMiddleware.requirePermissions(["role:manage_permissions"]));
```

## Query Parameter Handling

### Including Permissions

```typescript
// Controller logic for including permissions
async getRoleById(req: Request, res: Response): Promise<void> {
    const roleId = parseInt(req.params.id);
    const includePermissions = req.query.include_permissions === "true";

    let role;
    if (includePermissions) {
        role = await this.roleService.getRoleWithPermissions(roleId);
    } else {
        role = await this.roleService.getRoleById(roleId);
    }

    res.json({
        success: true,
        data: role
    });
}
```

### Pagination

```typescript
// Controller logic for pagination
async getAllRoles(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const includePermissions = req.query.include_permissions === "true";

    const { roles, total } = await this.roleService.getRoles({
        page,
        limit,
        includePermissions
    });

    res.json({
        success: true,
        data: roles,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
}
```

## Error Handling

### Common Error Scenarios

```typescript
// Role not found (404)
{
    success: false,
    message: "Role not found"
}

// Permission not found (404)
{
    success: false,
    message: "Permission not found"
}

// Duplicate role name (409)
{
    success: false,
    message: "Role name already exists"
}

// Permission already assigned (409)
{
    success: false,
    message: "Permission already assigned to role"
}

// Cannot delete role with users (400)
{
    success: false,
    message: "Cannot delete role: role is assigned to users"
}

// Invalid role ID (400)
{
    success: false,
    message: "Invalid role ID"
}

// Validation error (400)
{
    success: false,
    message: "Validation failed",
    errors: [
        { field: "name", message: "Role name is required" }
    ]
}
```

## Testing Role Routes

### Test Structure

```typescript
describe("Role Routes", () => {
    let adminToken: string;
    let userToken: string;
    let testRole: Role;
    let testPermission: Permission;

    beforeEach(async () => {
        await clearDatabase();
        await seedDefaultRoles();
        await seedDefaultPermissions();

        // Create admin user and get token
        const admin = await createTestUser({
            email: "admin@example.com",
            roles: ["admin"],
        });
        adminToken = await getTokenForUser(admin.id);

        // Create regular user and get token
        const user = await createTestUser({
            email: "user@example.com",
        });
        userToken = await getTokenForUser(user.id);

        // Create test role and permission
        testRole = await createTestRole({
            name: "editor",
            description: "Editor role",
        });
        testPermission = await createTestPermission({
            name: "article:create",
            description: "Create articles",
        });
    });

    describe("Authentication and Authorization", () => {
        it("should require authentication", async () => {
            const response = await request(app).get("/api/v1/roles");

            expect(response.status).toBe(401);
        });

        it("should require admin role", async () => {
            const response = await request(app).get("/api/v1/roles").set("Authorization", `Bearer ${userToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe("GET /api/v1/roles", () => {
        it("should return all roles for admin", async () => {
            const response = await request(app).get("/api/v1/roles").set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should include permissions when requested", async () => {
            await assignPermissionToRole(testRole.id, testPermission.id);

            const response = await request(app)
                .get("/api/v1/roles?include_permissions=true")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            const role = response.body.data.find((r) => r.id === testRole.id);
            expect(role.permissions).toBeDefined();
            expect(Array.isArray(role.permissions)).toBe(true);
        });
    });

    describe("POST /api/v1/roles", () => {
        it("should create new role with valid data", async () => {
            const roleData = {
                name: "moderator",
                description: "Moderator role",
            };

            const response = await request(app)
                .post("/api/v1/roles")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(roleData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(roleData.name);
        });

        it("should reject duplicate role name", async () => {
            const roleData = {
                name: testRole.name, // Existing name
                description: "Duplicate role",
            };

            const response = await request(app)
                .post("/api/v1/roles")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(roleData);

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });
    });

    describe("GET /api/v1/roles/:id", () => {
        it("should return role by ID", async () => {
            const response = await request(app)
                .get(`/api/v1/roles/${testRole.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(testRole.id);
        });

        it("should return 404 for non-existent role", async () => {
            const response = await request(app).get("/api/v1/roles/99999").set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe("Permission Management", () => {
        it("should assign permission to role", async () => {
            const response = await request(app)
                .post(`/api/v1/roles/${testRole.id}/permissions`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ permissionId: testPermission.id });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should remove permission from role", async () => {
            await assignPermissionToRole(testRole.id, testPermission.id);

            const response = await request(app)
                .delete(`/api/v1/roles/${testRole.id}/permissions/${testPermission.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should set all role permissions", async () => {
            const permission2 = await createTestPermission({
                name: "article:read",
                description: "Read articles",
            });

            const response = await request(app)
                .put(`/api/v1/roles/${testRole.id}/permissions`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    permissionIds: [testPermission.id, permission2.id],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalPermissions).toBe(2);
        });
    });

    describe("DELETE /api/v1/roles/:id", () => {
        it("should delete role", async () => {
            const response = await request(app)
                .delete(`/api/v1/roles/${testRole.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(204);
        });

        it("should prevent deletion of role assigned to users", async () => {
            await assignRoleToUser(testUser.id, testRole.id);

            const response = await request(app)
                .delete(`/api/v1/roles/${testRole.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
```

### Test Helpers

```typescript
export async function createTestRole(roleData: Partial<Role>): Promise<Role> {
    // Create test role with default values
}

export async function createTestPermission(permissionData: Partial<Permission>): Promise<Permission> {
    // Create test permission
}

export async function assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    // Assign permission to role
}

export async function assignRoleToUser(userId: number, roleId: number): Promise<void> {
    // Assign role to user
}

export async function seedDefaultRoles(): Promise<void> {
    // Seed default system roles
}

export async function seedDefaultPermissions(): Promise<void> {
    // Seed default system permissions
}
```

## Security Considerations

### Access Control

1. **Admin-Only Operations**: All role management requires admin role
2. **System Role Protection**: Prevent deletion of critical system roles
3. **Cascading Effects**: Consider impact of role changes on existing users

### Data Integrity

1. **Unique Constraints**: Role names must be unique
2. **Referential Integrity**: Prevent deletion of roles assigned to users
3. **Permission Validation**: Ensure all permission IDs are valid

### Audit Trail

1. **Change Logging**: Log all role and permission changes
2. **User Impact**: Track which users are affected by role changes
3. **System Monitoring**: Monitor role-based access patterns

## Performance Considerations

### Database Optimization

```typescript
// Efficient role with permissions query
const roleWithPermissions = await db
    .select()
    .from(roles)
    .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(roles.id, roleId));
```

### Caching Strategy

```typescript
// Cache role-permission mappings
const rolePermissions = await this.cacheService.remember(
    `role:${roleId}:permissions`,
    () => this.roleService.getRolePermissions(roleId),
    600, // 10 minutes
);
```

### Batch Operations

```typescript
// Efficient batch permission assignment
async setRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    await db.transaction(async (tx) => {
        // Remove all existing permissions
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

        // Add new permissions in batch
        if (permissionIds.length > 0) {
            await tx.insert(rolePermissions).values(
                permissionIds.map(permissionId => ({ roleId, permissionId }))
            );
        }
    });
}
```

## Best Practices

### Role Management

1. **Descriptive Names**: Use clear, descriptive role names
2. **Granular Permissions**: Assign specific permissions rather than broad access
3. **Role Hierarchy**: Consider implementing role inheritance for complex systems
4. **System Roles**: Protect critical system roles from deletion

### API Design

1. **Consistent Responses**: Use consistent response format across all endpoints
2. **Proper HTTP Methods**: Use appropriate HTTP methods for different operations
3. **Resource Nesting**: Use nested routes for role-permission relationships

### Error Handling

1. **User-Friendly Messages**: Provide clear error messages
2. **Constraint Violations**: Handle database constraint violations gracefully
3. **Cascading Deletes**: Prevent deletion of roles with dependencies

## Related Documentation

- [Role Controller Guide](../controllers/role-controller.guide.md)
- [Role Service Guide](../services/role-service.guide.md)
- [Authorization Service Guide](../services/authorization-service.guide.md)
- [RBAC Repositories Guide](../repositories/rbac-repositories.guide.md)
- [RBAC Validation Schemas Guide](../db/rbac-schema.guide.md)
