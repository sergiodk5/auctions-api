# RBAC Schema Guide

This guide covers the Role-Based Access Control (RBAC) schema (`src/db/rbac.schema.ts`), which implements a flexible permission system for the Auctions API.

## Overview

The RBAC schema provides a comprehensive role and permission management system that allows fine-grained access control throughout the application. It implements a many-to-many relationship between users, roles, and permissions.

## Table Structure

### Core RBAC Tables

#### `rolesTable`

Defines user roles in the system.

```typescript
export const rolesTable = pgTable("roles", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
});
```

| Column       | Type           | Constraints                 | Description                         |
| ------------ | -------------- | --------------------------- | ----------------------------------- |
| `id`         | `integer`      | Primary Key, Auto-increment | Unique role identifier              |
| `name`       | `varchar(100)` | Not Null, Unique            | Role name (e.g., 'admin', 'editor') |
| `created_at` | `timestamp`    | Not Null, Default: now()    | Role creation timestamp             |
| `updated_at` | `timestamp`    | Not Null, Default: now()    | Last update timestamp               |

#### `permissionsTable`

Defines individual permissions that can be assigned to roles.

```typescript
export const permissionsTable = pgTable("permissions", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
});
```

| Column        | Type           | Constraints                 | Description                           |
| ------------- | -------------- | --------------------------- | ------------------------------------- |
| `id`          | `integer`      | Primary Key, Auto-increment | Unique permission identifier          |
| `name`        | `varchar(100)` | Not Null, Unique            | Permission name (e.g., 'user:create') |
| `description` | `varchar(255)` | Nullable                    | Human-readable permission description |
| `created_at`  | `timestamp`    | Not Null, Default: now()    | Permission creation timestamp         |
| `updated_at`  | `timestamp`    | Not Null, Default: now()    | Last update timestamp                 |

### Junction Tables

#### `rolePermissionsTable`

Maps permissions to roles (many-to-many relationship).

```typescript
export const rolePermissionsTable = pgTable("role_permissions", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    role_id: integer("role_id")
        .notNull()
        .references(() => rolesTable.id),
    permission_id: integer("permission_id")
        .notNull()
        .references(() => permissionsTable.id),
});
```

| Column          | Type      | Constraints                 | Description                      |
| --------------- | --------- | --------------------------- | -------------------------------- |
| `id`            | `integer` | Primary Key, Auto-increment | Unique assignment identifier     |
| `role_id`       | `integer` | Not Null, Foreign Key       | References `rolesTable.id`       |
| `permission_id` | `integer` | Not Null, Foreign Key       | References `permissionsTable.id` |

#### `userRolesTable`

Maps users to roles (many-to-many relationship).

```typescript
export const userRolesTable = pgTable("user_roles", {
    user_id: integer("user_id")
        .notNull()
        .references(() => usersTable.id),
    role_id: integer("role_id")
        .notNull()
        .references(() => rolesTable.id),
});
```

| Column    | Type      | Constraints           | Description                |
| --------- | --------- | --------------------- | -------------------------- |
| `user_id` | `integer` | Not Null, Foreign Key | References `usersTable.id` |
| `role_id` | `integer` | Not Null, Foreign Key | References `rolesTable.id` |

## Permission Naming Convention

Permissions follow a standardized naming pattern: `resource:action`

### Standard Permission Patterns

```typescript
// User management permissions
"user:create"; // Create new users
"user:read"; // View user information
"user:update"; // Modify user data
"user:delete"; // Remove users

// Product management permissions
"product:create"; // Create new products
"product:read"; // View product information
"product:update"; // Modify product data
"product:delete"; // Remove products

// System administration permissions
"system:admin"; // Full system access
"system:config"; // System configuration
```

## Default Roles and Permissions

### Predefined Roles

#### Admin Role

- **Name**: `admin`
- **Description**: Full system access
- **Permissions**: All available permissions

#### Editor Role

- **Name**: `editor`
- **Description**: Content management access
- **Permissions**: Create, read, update products and limited user management

#### Client Role

- **Name**: `client`
- **Description**: Basic user access
- **Permissions**: Read access to public resources

## Usage Examples

### 1. Repository Layer

```typescript
import { rolesTable, permissionsTable, rolePermissionsTable, userRolesTable } from "@/db/rbac.schema";
import { eq, and } from "drizzle-orm";

@injectable()
export class RoleRepository {
    async findRoleWithPermissions(roleId: number) {
        return await this.db
            .select({
                role: rolesTable,
                permission: permissionsTable,
            })
            .from(rolesTable)
            .leftJoin(rolePermissionsTable, eq(rolesTable.id, rolePermissionsTable.role_id))
            .leftJoin(permissionsTable, eq(rolePermissionsTable.permission_id, permissionsTable.id))
            .where(eq(rolesTable.id, roleId));
    }

    async getUserRoles(userId: number) {
        return await this.db
            .select({
                role: rolesTable,
            })
            .from(userRolesTable)
            .innerJoin(rolesTable, eq(userRolesTable.role_id, rolesTable.id))
            .where(eq(userRolesTable.user_id, userId));
    }

    async assignRoleToUser(userId: number, roleId: number) {
        await this.db.insert(userRolesTable).values({
            user_id: userId,
            role_id: roleId,
        });
    }
}
```

### 2. Permission Repository

```typescript
@injectable()
export class PermissionRepository {
    async getUserPermissions(userId: number) {
        return await this.db
            .selectDistinct({
                permission: permissionsTable,
            })
            .from(userRolesTable)
            .innerJoin(rolesTable, eq(userRolesTable.role_id, rolesTable.id))
            .innerJoin(rolePermissionsTable, eq(rolesTable.id, rolePermissionsTable.role_id))
            .innerJoin(permissionsTable, eq(rolePermissionsTable.permission_id, permissionsTable.id))
            .where(eq(userRolesTable.user_id, userId));
    }

    async checkUserPermission(userId: number, permissionName: string) {
        const result = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(userRolesTable)
            .innerJoin(rolesTable, eq(userRolesTable.role_id, rolesTable.id))
            .innerJoin(rolePermissionsTable, eq(rolesTable.id, rolePermissionsTable.role_id))
            .innerJoin(permissionsTable, eq(rolePermissionsTable.permission_id, permissionsTable.id))
            .where(and(eq(userRolesTable.user_id, userId), eq(permissionsTable.name, permissionName)));

        return result[0]?.count > 0;
    }
}
```

### 3. Authorization Service

```typescript
@injectable()
export class AuthorizationService {
    async hasPermission(userId: number, permission: string): Promise<boolean> {
        return await this.permissionRepository.checkUserPermission(userId, permission);
    }

    async getUserPermissions(userId: number): Promise<string[]> {
        const permissions = await this.permissionRepository.getUserPermissions(userId);
        return permissions.map((p) => p.permission.name);
    }

    async assignUserRoles(userId: number, roleIds: number[]): Promise<void> {
        // Remove existing roles
        await this.db.delete(userRolesTable).where(eq(userRolesTable.user_id, userId));

        // Assign new roles
        if (roleIds.length > 0) {
            const userRoles = roleIds.map((roleId) => ({ user_id: userId, role_id: roleId }));
            await this.db.insert(userRolesTable).values(userRoles);
        }
    }
}
```

### 4. Authorization Middleware

```typescript
import { AuthorizationService } from "@/services/authorization.service";

export const requirePermission = (permission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const authService = container.get<AuthorizationService>(TYPES.AuthorizationService);
        const hasPermission = await authService.hasPermission(userId, permission);

        if (!hasPermission) {
            return res.status(403).json({ message: "Forbidden" });
        }

        next();
    };
};

// Usage in routes
router.post("/users", requirePermission("user:create"), userController.create);
router.delete("/users/:id", requirePermission("user:delete"), userController.delete);
```

## Complex Queries

### Get All Roles with Their Permissions

```typescript
const rolesWithPermissions = await db
    .select({
        roleId: rolesTable.id,
        roleName: rolesTable.name,
        permissionId: permissionsTable.id,
        permissionName: permissionsTable.name,
        permissionDescription: permissionsTable.description,
    })
    .from(rolesTable)
    .leftJoin(rolePermissionsTable, eq(rolesTable.id, rolePermissionsTable.role_id))
    .leftJoin(permissionsTable, eq(rolePermissionsTable.permission_id, permissionsTable.id))
    .orderBy(rolesTable.name, permissionsTable.name);
```

### Get Users with Specific Permission

```typescript
const usersWithPermission = await db
    .selectDistinct({
        userId: usersTable.id,
        userEmail: usersTable.email,
    })
    .from(usersTable)
    .innerJoin(userRolesTable, eq(usersTable.id, userRolesTable.user_id))
    .innerJoin(rolesTable, eq(userRolesTable.role_id, rolesTable.id))
    .innerJoin(rolePermissionsTable, eq(rolesTable.id, rolePermissionsTable.role_id))
    .innerJoin(permissionsTable, eq(rolePermissionsTable.permission_id, permissionsTable.id))
    .where(eq(permissionsTable.name, "user:delete"));
```

### Check if Role Has Specific Permission

```typescript
const roleHasPermission = async (roleId: number, permissionName: string) => {
    const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(rolePermissionsTable)
        .innerJoin(permissionsTable, eq(rolePermissionsTable.permission_id, permissionsTable.id))
        .where(and(eq(rolePermissionsTable.role_id, roleId), eq(permissionsTable.name, permissionName)));

    return result[0]?.count > 0;
};
```

## Validation Schemas

See [`rbac-validation.schema.ts`](./validation-schemas.guide.md#rbac-validation) for API validation schemas including:

- `createRoleSchema` - Role creation validation
- `updateRoleSchema` - Role update validation
- `createPermissionSchema` - Permission creation validation
- `assignUserRolesSchema` - User role assignment validation
- `setRolePermissionsSchema` - Role permission assignment validation

## Type Definitions

### Inferred Types

```typescript
// Table types
type Role = typeof rolesTable.$inferSelect;
type Permission = typeof permissionsTable.$inferSelect;
type RolePermission = typeof rolePermissionsTable.$inferSelect;
type UserRole = typeof userRolesTable.$inferSelect;

// Insert types
type NewRole = typeof rolesTable.$inferInsert;
type NewPermission = typeof permissionsTable.$inferInsert;
```

### Custom Types

```typescript
// Role with permissions
export type RoleWithPermissions = {
    role: Role;
    permissions: Permission[];
};

// User with roles and permissions
export type UserWithRoles = {
    user: User;
    roles: Role[];
    permissions: Permission[];
};

// Permission check result
export type PermissionCheck = {
    hasPermission: boolean;
    permission: string;
    userId: number;
};
```

## Seeding Data

### Roles Seeder

```typescript
// src/db/seeds/roles.seeder.ts
export async function rolesSeeder() {
    await seed(db, { roles: rolesTable }).refine((f) => ({
        roles: {
            columns: {
                name: f.valuesFromArray({
                    values: ["admin", "editor", "client"],
                }),
            },
            count: 3,
        },
    }));
}
```

### Permissions Seeder

```typescript
// src/db/seeds/permissions.seeder.ts
export async function permissionsSeeder() {
    const permissions = [
        { name: "user:read", description: "Read user information" },
        { name: "user:create", description: "Create new users" },
        { name: "user:update", description: "Update user information" },
        { name: "user:delete", description: "Delete users" },
        { name: "product:read", description: "Read product information" },
        { name: "product:create", description: "Create new products" },
        { name: "product:update", description: "Update product information" },
        { name: "product:delete", description: "Delete products" },
    ];

    await db.insert(permissionsTable).values(permissions).onConflictDoNothing();
}
```

## Security Best Practices

### 1. Principle of Least Privilege

- Assign users only the minimum permissions needed
- Regularly audit user permissions
- Use specific permissions rather than broad access

### 2. Permission Granularity

- Create fine-grained permissions for better control
- Use resource:action naming convention
- Separate read/write permissions when appropriate

### 3. Role Management

- Keep roles simple and purpose-focused
- Document role purposes and permissions
- Avoid role proliferation

### 4. Access Control

- Always check permissions at the endpoint level
- Implement proper middleware for permission checking
- Log permission checks for audit purposes

## Testing Patterns

### Repository Tests

```typescript
describe("RoleRepository", () => {
    it("should assign role to user", async () => {
        const user = await createTestUser();
        const role = await createTestRole("editor");

        await roleRepository.assignRoleToUser(user.id, role.id);

        const userRoles = await roleRepository.getUserRoles(user.id);
        expect(userRoles).toHaveLength(1);
        expect(userRoles[0].role.name).toBe("editor");
    });
});
```

### Permission Tests

```typescript
describe("AuthorizationService", () => {
    it("should check user permission correctly", async () => {
        const user = await createTestUserWithRole("editor");

        const hasPermission = await authService.hasPermission(user.id, "product:create");

        expect(hasPermission).toBe(true);
    });
});
```

## Migration History

See migration files for RBAC system evolution:

- Initial RBAC tables creation
- Permission system enhancements
- Role hierarchy additions

## Related Documentation

- [Authorization Service Guide](../services/authorization-service.guide.md)
- [Role Repository Guide](../repositories/role-repository.guide.md)
- [Permission Repository Guide](../repositories/permission-repository.guide.md)
- [RBAC Validation Schemas Guide](./validation-schemas.guide.md#rbac-validation)
- [Authorization Middleware Guide](../middlewares/authorization-middleware.guide.md)
