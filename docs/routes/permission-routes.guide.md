# Permission Routes Guide

## Overview

Permission routes handle permission management operations in the RBAC system. These routes allow administrators to create, update, delete permissions that can be assigned to roles. All permission routes require admin-level access and are used to define granular access controls throughout the system.

## Route Structure

### Permission Router Setup

```typescript
// src/routes/permission.route.ts
import { IPermissionController } from "@/controllers/permission.controller";
import { createPermissionSchema, updatePermissionSchema } from "@/db/rbac-validation.schema";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IAuthorizationMiddleware } from "@/middlewares/authorization.middleware";
import { IValidationMiddleware } from "@/middlewares/validation.middleware";
import express from "express";

const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const permissionController = container.get<IPermissionController>(TYPES.IPermissionController);

const permissionRoute = express.Router();

// Apply authentication to all permission routes
permissionRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));

// Apply admin role requirement to all permission routes
permissionRoute.use(authorizationMiddleware.requireRoles(["admin"]));
```

## Permission CRUD Operations

### List All Permissions

```typescript
// GET /api/v1/permissions
permissionRoute.get("/", permissionController.getAllPermissions.bind(permissionController));
```

**Purpose**: Retrieve all permissions in the system
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: None

**Query Parameters** (optional):

```typescript
?page=1&limit=10          // Pagination parameters
?category=user            // Filter by permission category
?search=create           // Search in permission names/descriptions
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Permissions retrieved successfully",
    data: [
        {
            id: number,
            name: string,           // e.g., "user:create", "product:read"
            description: string,    // Human-readable description
            category?: string,      // Optional category grouping
            createdAt: string,
            updatedAt: string
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

### Create New Permission

```typescript
// POST /api/v1/permissions
permissionRoute.post(
    "/",
    validationMiddleware.validate(createPermissionSchema),
    permissionController.createPermission.bind(permissionController),
);
```

**Purpose**: Create a new permission
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: `createPermissionSchema`

**Request Body**:

```typescript
{
    name: string;        // Unique permission name (e.g., "user:create")
    description: string; // Human-readable description
    category?: string;   // Optional category for grouping
}
```

**Response**:

```typescript
// Success (201 Created)
{
    success: true,
    message: "Permission created successfully",
    data: {
        id: number,
        name: string,
        description: string,
        category?: string,
        createdAt: string,
        updatedAt: string
    }
}

// Error (409 Conflict)
{
    success: false,
    message: "Permission name already exists"
}
```

### Get Permission by ID

```typescript
// GET /api/v1/permissions/:id
permissionRoute.get("/:id", permissionController.getPermissionById.bind(permissionController));
```

**Purpose**: Retrieve specific permission by ID
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: ID parameter validation in controller

**Path Parameters**:

- `id`: Permission ID (integer)

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Permission retrieved successfully",
    data: {
        id: number,
        name: string,
        description: string,
        category?: string,
        createdAt: string,
        updatedAt: string,
        roles?: Role[] // Roles that have this permission (if requested)
    }
}

// Error (404 Not Found)
{
    success: false,
    message: "Permission not found"
}
```

### Update Permission

```typescript
// PUT /api/v1/permissions/:id
permissionRoute.put(
    "/:id",
    validationMiddleware.validate(updatePermissionSchema),
    permissionController.updatePermission.bind(permissionController),
);
```

**Purpose**: Update existing permission
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: `updatePermissionSchema`

**Path Parameters**:

- `id`: Permission ID (integer)

**Request Body**:

```typescript
{
    name?: string;        // Updated permission name (must be unique)
    description?: string; // Updated description
    category?: string;    // Updated category
}
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Permission updated successfully",
    data: {
        id: number,
        name: string,
        description: string,
        category?: string,
        createdAt: string,
        updatedAt: string
    }
}

// Error (404 Not Found)
{
    success: false,
    message: "Permission not found"
}

// Error (409 Conflict)
{
    success: false,
    message: "Permission name already exists"
}
```

### Delete Permission

```typescript
// DELETE /api/v1/permissions/:id
permissionRoute.delete("/:id", permissionController.deletePermission.bind(permissionController));
```

**Purpose**: Delete permission from system
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: ID parameter validation in controller

**Path Parameters**:

- `id`: Permission ID (integer)

**Response**:

```typescript
// Success (204 No Content)
// No response body

// Error (404 Not Found)
{
    success: false,
    message: "Permission not found"
}

// Error (400 Bad Request)
{
    success: false,
    message: "Cannot delete permission: permission is assigned to roles"
}
```

## Validation Schemas

### Create Permission Schema

```typescript
export const createPermissionSchema = z.object({
    body: insertPermissionSchema.pick({
        name: true,
        description: true,
        category: true,
    }),
    params: z.object({}),
    query: z.object({}),
});
```

### Update Permission Schema

```typescript
export const updatePermissionSchema = z.object({
    body: insertPermissionSchema
        .pick({
            name: true,
            description: true,
            category: true,
        })
        .partial(),
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number"),
    }),
    query: z.object({}),
});
```

## Permission Naming Conventions

### Standard Permission Format

Permissions follow the format: `resource:action`

```typescript
// User permissions
"user:create"; // Create users
"user:read"; // Read/view users
"user:update"; // Update user information
"user:delete"; // Delete users

// Product permissions
"product:create"; // Create products
"product:read"; // View products
"product:update"; // Update products
"product:delete"; // Delete products

// System permissions
"system:admin"; // Full system administration
"system:backup"; // System backup operations
"system:config"; // System configuration
```

### Advanced Permission Patterns

```typescript
// Granular permissions
"user:read:own"; // Read own user data
"user:read:all"; // Read all user data
"user:update:own"; // Update own user data
"user:update:all"; // Update any user data

// Feature-specific permissions
"user:role:assign"; // Assign roles to users
"user:role:remove"; // Remove roles from users
"role:permission:manage"; // Manage role permissions

// Resource-specific permissions
"product:category:manage"; // Manage product categories
"product:inventory:view"; // View inventory levels
"product:price:update"; // Update product prices
```

## Authorization Strategy

### Admin-Only Access

All permission routes require admin role:

```typescript
// Apply admin requirement to all permission routes
permissionRoute.use(authorizationMiddleware.requireRoles(["admin"]));
```

### Future Granular Permissions

For more sophisticated systems, you could implement permission-based authorization:

```typescript
// Future: More granular permission management permissions
permissionRoute.get("/", authorizationMiddleware.requirePermissions(["permission:read"]));
permissionRoute.post("/", authorizationMiddleware.requirePermissions(["permission:create"]));
permissionRoute.put("/:id", authorizationMiddleware.requirePermissions(["permission:update"]));
permissionRoute.delete("/:id", authorizationMiddleware.requirePermissions(["permission:delete"]));
```

## Query Parameter Handling

### Filtering and Search

```typescript
// Controller logic for filtering permissions
async getAllPermissions(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const category = req.query.category as string;
    const search = req.query.search as string;

    const { permissions, total } = await this.permissionService.getPermissions({
        page,
        limit,
        category,
        search
    });

    res.json({
        success: true,
        data: permissions,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
}
```

### Permission Categories

```typescript
// Group permissions by category for better organization
const permissionsByCategory = {
    user: [
        { name: "user:create", description: "Create users" },
        { name: "user:read", description: "Read users" },
        { name: "user:update", description: "Update users" },
        { name: "user:delete", description: "Delete users" },
    ],
    product: [
        { name: "product:create", description: "Create products" },
        { name: "product:read", description: "Read products" },
        { name: "product:update", description: "Update products" },
        { name: "product:delete", description: "Delete products" },
    ],
    system: [
        { name: "system:admin", description: "System administration" },
        { name: "system:backup", description: "System backup" },
    ],
};
```

## Error Handling

### Common Error Scenarios

```typescript
// Permission not found (404)
{
    success: false,
    message: "Permission not found"
}

// Duplicate permission name (409)
{
    success: false,
    message: "Permission name already exists"
}

// Cannot delete permission in use (400)
{
    success: false,
    message: "Cannot delete permission: permission is assigned to roles"
}

// Invalid permission ID (400)
{
    success: false,
    message: "Invalid permission ID"
}

// Validation error (400)
{
    success: false,
    message: "Validation failed",
    errors: [
        { field: "name", message: "Permission name is required" },
        { field: "name", message: "Permission name must follow format 'resource:action'" }
    ]
}
```

## Testing Permission Routes

### Test Structure

```typescript
describe("Permission Routes", () => {
    let adminToken: string;
    let userToken: string;
    let testPermission: Permission;

    beforeEach(async () => {
        await clearDatabase();
        await seedDefaultRoles();

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

        // Create test permission
        testPermission = await createTestPermission({
            name: "article:create",
            description: "Create articles",
            category: "content",
        });
    });

    describe("Authentication and Authorization", () => {
        it("should require authentication", async () => {
            const response = await request(app).get("/api/v1/permissions");

            expect(response.status).toBe(401);
        });

        it("should require admin role", async () => {
            const response = await request(app).get("/api/v1/permissions").set("Authorization", `Bearer ${userToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe("GET /api/v1/permissions", () => {
        it("should return all permissions for admin", async () => {
            const response = await request(app).get("/api/v1/permissions").set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should support pagination", async () => {
            // Create multiple permissions
            await createTestPermission({ name: "test:read", description: "Test read" });
            await createTestPermission({ name: "test:write", description: "Test write" });

            const response = await request(app)
                .get("/api/v1/permissions?page=1&limit=2")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.limit).toBe(2);
        });

        it("should support category filtering", async () => {
            await createTestPermission({
                name: "user:read",
                description: "Read users",
                category: "user",
            });

            const response = await request(app)
                .get("/api/v1/permissions?category=content")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            const permissions = response.body.data;
            expect(permissions.every((p) => p.category === "content")).toBe(true);
        });
    });

    describe("POST /api/v1/permissions", () => {
        it("should create new permission with valid data", async () => {
            const permissionData = {
                name: "video:upload",
                description: "Upload videos",
                category: "media",
            };

            const response = await request(app)
                .post("/api/v1/permissions")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(permissionData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(permissionData.name);
        });

        it("should reject duplicate permission name", async () => {
            const permissionData = {
                name: testPermission.name, // Existing name
                description: "Duplicate permission",
            };

            const response = await request(app)
                .post("/api/v1/permissions")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(permissionData);

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });

        it("should validate permission name format", async () => {
            const permissionData = {
                name: "invalid-format", // Should be "resource:action"
                description: "Invalid format permission",
            };

            const response = await request(app)
                .post("/api/v1/permissions")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(permissionData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe("GET /api/v1/permissions/:id", () => {
        it("should return permission by ID", async () => {
            const response = await request(app)
                .get(`/api/v1/permissions/${testPermission.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(testPermission.id);
        });

        it("should return 404 for non-existent permission", async () => {
            const response = await request(app)
                .get("/api/v1/permissions/99999")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe("PUT /api/v1/permissions/:id", () => {
        it("should update permission with valid data", async () => {
            const updateData = {
                description: "Updated description",
                category: "updated-category",
            };

            const response = await request(app)
                .put(`/api/v1/permissions/${testPermission.id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.description).toBe(updateData.description);
        });

        it("should reject duplicate name on update", async () => {
            const permission2 = await createTestPermission({
                name: "article:read",
                description: "Read articles",
            });

            const response = await request(app)
                .put(`/api/v1/permissions/${permission2.id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ name: testPermission.name });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });
    });

    describe("DELETE /api/v1/permissions/:id", () => {
        it("should delete permission", async () => {
            const response = await request(app)
                .delete(`/api/v1/permissions/${testPermission.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(204);
        });

        it("should prevent deletion of permission assigned to roles", async () => {
            const role = await createTestRole({ name: "editor" });
            await assignPermissionToRole(role.id, testPermission.id);

            const response = await request(app)
                .delete(`/api/v1/permissions/${testPermission.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
```

### Test Helpers

```typescript
export async function createTestPermission(permissionData: Partial<Permission>): Promise<Permission> {
    return await db
        .insert(permissions)
        .values({
            name: permissionData.name || "test:permission",
            description: permissionData.description || "Test permission",
            category: permissionData.category,
            ...permissionData,
        })
        .returning()
        .then((rows) => rows[0]);
}

export async function assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    await db.insert(rolePermissions).values({ roleId, permissionId });
}

export async function seedDefaultPermissions(): Promise<Permission[]> {
    const defaultPermissions = [
        { name: "user:create", description: "Create users", category: "user" },
        { name: "user:read", description: "Read users", category: "user" },
        { name: "user:update", description: "Update users", category: "user" },
        { name: "user:delete", description: "Delete users", category: "user" },
        { name: "product:create", description: "Create products", category: "product" },
        { name: "product:read", description: "Read products", category: "product" },
        { name: "product:update", description: "Update products", category: "product" },
        { name: "product:delete", description: "Delete products", category: "product" },
    ];

    return await db.insert(permissions).values(defaultPermissions).returning();
}
```

## Security Considerations

### Permission Design

1. **Principle of Least Privilege**: Create specific, granular permissions
2. **Clear Naming**: Use consistent, descriptive permission names
3. **Category Organization**: Group related permissions for better management
4. **System Permissions**: Protect critical system permissions from deletion

### Access Control

1. **Admin-Only Management**: Only admins can manage permissions
2. **Cascade Protection**: Prevent deletion of permissions assigned to roles
3. **Audit Trail**: Log all permission changes for security auditing

### Data Integrity

1. **Unique Constraints**: Permission names must be unique
2. **Format Validation**: Enforce consistent permission naming format
3. **Referential Integrity**: Maintain consistency across role-permission relationships

## Performance Considerations

### Database Optimization

```typescript
// Efficient permission queries with proper indexing
const permissions = await db
    .select()
    .from(permissions)
    .where(ilike(permissions.name, `%${search}%`))
    .orderBy(permissions.category, permissions.name)
    .limit(limit)
    .offset(offset);
```

### Caching Strategy

```typescript
// Cache permission list for authorization checks
const allPermissions = await this.cacheService.remember(
    "permissions:all",
    () => this.permissionService.getAllPermissions(),
    3600, // 1 hour
);
```

### Permission Lookup Optimization

```typescript
// Optimize permission checking with indexed lookups
class PermissionService {
    private permissionMap = new Map<string, Permission>();

    async initializePermissionMap(): Promise<void> {
        const permissions = await this.getAllPermissions();
        permissions.forEach((permission) => {
            this.permissionMap.set(permission.name, permission);
        });
    }

    getPermissionByName(name: string): Permission | undefined {
        return this.permissionMap.get(name);
    }
}
```

## Best Practices

### Permission Design

1. **Granular Permissions**: Create specific permissions for different actions
2. **Consistent Naming**: Follow the `resource:action` naming convention
3. **Logical Grouping**: Use categories to organize related permissions
4. **Future-Proof**: Design permissions to accommodate future features

### API Design

1. **RESTful Patterns**: Use standard REST conventions for CRUD operations
2. **Filtering Support**: Provide search and filtering capabilities
3. **Pagination**: Implement pagination for large permission lists
4. **Consistent Responses**: Use standardized response formats

### System Integration

1. **Permission Seeding**: Provide scripts to seed initial permissions
2. **Migration Support**: Handle permission changes during system updates
3. **Documentation**: Maintain clear documentation of available permissions
4. **Version Control**: Track permission changes in version control

## Common Permission Sets

### User Management Permissions

```typescript
const userPermissions = [
    { name: "user:create", description: "Create new users", category: "user" },
    { name: "user:read", description: "View user information", category: "user" },
    { name: "user:update", description: "Update user information", category: "user" },
    { name: "user:delete", description: "Delete users", category: "user" },
    { name: "user:role:assign", description: "Assign roles to users", category: "user" },
    { name: "user:role:remove", description: "Remove roles from users", category: "user" },
];
```

### Content Management Permissions

```typescript
const contentPermissions = [
    { name: "article:create", description: "Create articles", category: "content" },
    { name: "article:read", description: "Read articles", category: "content" },
    { name: "article:update", description: "Update articles", category: "content" },
    { name: "article:delete", description: "Delete articles", category: "content" },
    { name: "article:publish", description: "Publish articles", category: "content" },
    { name: "article:moderate", description: "Moderate article content", category: "content" },
];
```

### System Administration Permissions

```typescript
const systemPermissions = [
    { name: "system:admin", description: "Full system administration", category: "system" },
    { name: "system:config", description: "Modify system configuration", category: "system" },
    { name: "system:backup", description: "Perform system backups", category: "system" },
    { name: "system:logs", description: "View system logs", category: "system" },
    { name: "system:monitor", description: "Monitor system health", category: "system" },
];
```

## Related Documentation

- [Permission Controller Guide](../controllers/permission-controller.guide.md)
- [Permission Service Guide](../services/permission-service.guide.md)
- [Authorization Service Guide](../services/authorization-service.guide.md)
- [RBAC Repositories Guide](../repositories/rbac-repositories.guide.md)
- [RBAC Validation Schemas Guide](../db/rbac-schema.guide.md)
- [Role Routes Guide](./role-routes.guide.md)
