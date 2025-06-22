# User Routes Guide

## Overview

User routes handle user management operations including CRUD operations, role assignments, and user-specific data access. All user routes require authentication, and most require specific permissions based on RBAC (Role-Based Access Control).

## Route Structure

### User Router Setup

```typescript
// src/routes/user.route.ts
import { IUsersController } from "@/controllers/users.controller";
import { assignUserRolesSchema } from "@/db/rbac-validation.schema";
import { createUserRouteSchema, updateUserRouteSchema } from "@/db/user-validation.schema";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IAuthorizationMiddleware } from "@/middlewares/authorization.middleware";
import { IValidationMiddleware } from "@/middlewares/validation.middleware";
import express from "express";

const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const usersController = container.get<IUsersController>(TYPES.IUsersController);

const userRoute = express.Router();

// Apply authentication to all user routes
userRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));
```

## User CRUD Operations

### List All Users

```typescript
// GET /api/v1/users
userRoute.get(
    "/",
    authorizationMiddleware.requirePermissions(["user:read"]),
    usersController.getAllUsers.bind(usersController),
);
```

**Purpose**: Retrieve all users in the system
**Authentication**: Required
**Authorization**: `user:read` permission
**Validation**: None

**Query Parameters** (optional):

```typescript
?page=1&limit=10&include_roles=true
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Users retrieved successfully",
    data: [
        {
            id: number,
            email: string,
            firstName: string,
            lastName: string,
            emailVerified: boolean,
            createdAt: string,
            updatedAt: string,
            roles?: Role[] // if include_roles=true
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

### Create New User

```typescript
// POST /api/v1/users
userRoute.post(
    "/",
    authorizationMiddleware.requirePermissions(["user:create"]),
    validationMiddleware.validate(createUserRouteSchema),
    usersController.createUser.bind(usersController),
);
```

**Purpose**: Create a new user account
**Authentication**: Required
**Authorization**: `user:create` permission
**Validation**: `createUserRouteSchema`

**Request Body**:

```typescript
{
    email: string;           // Valid email address
    password: string;        // Strong password
    firstName: string;       // User's first name
    lastName: string;        // User's last name
    emailVerified?: boolean; // Admin can set verification status
}
```

**Response**:

```typescript
// Success (201 Created)
{
    success: true,
    message: "User created successfully",
    data: {
        id: number,
        email: string,
        firstName: string,
        lastName: string,
        emailVerified: boolean,
        createdAt: string,
        updatedAt: string
    }
}

// Error (409 Conflict)
{
    success: false,
    message: "Email already exists"
}
```

### Get User by ID

```typescript
// GET /api/v1/users/:id
userRoute.get(
    "/:id",
    authorizationMiddleware.requirePermissions(["user:read"]),
    usersController.getUserById.bind(usersController),
);
```

**Purpose**: Retrieve specific user by ID
**Authentication**: Required
**Authorization**: `user:read` permission
**Validation**: ID parameter validation in controller

**Path Parameters**:

- `id`: User ID (integer)

**Query Parameters** (optional):

```typescript
?include_roles=true  // Include user's roles in response
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "User retrieved successfully",
    data: {
        id: number,
        email: string,
        firstName: string,
        lastName: string,
        emailVerified: boolean,
        createdAt: string,
        updatedAt: string,
        roles?: Role[] // if include_roles=true
    }
}

// Error (404 Not Found)
{
    success: false,
    message: "User not found"
}
```

### Update User

```typescript
// PUT /api/v1/users/:id
userRoute.put(
    "/:id",
    authorizationMiddleware.requirePermissions(["user:update"]),
    validationMiddleware.validate(updateUserRouteSchema),
    usersController.updateUser.bind(usersController),
);
```

**Purpose**: Update existing user
**Authentication**: Required
**Authorization**: `user:update` permission
**Validation**: `updateUserRouteSchema`

**Path Parameters**:

- `id`: User ID (integer)

**Request Body**:

```typescript
{
    email?: string;          // Valid email address
    firstName?: string;      // User's first name
    lastName?: string;       // User's last name
    emailVerified?: boolean; // Admin can update verification status
}
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "User updated successfully",
    data: {
        id: number,
        email: string,
        firstName: string,
        lastName: string,
        emailVerified: boolean,
        createdAt: string,
        updatedAt: string
    }
}

// Error (404 Not Found)
{
    success: false,
    message: "User not found"
}
```

### Delete User

```typescript
// DELETE /api/v1/users/:id
userRoute.delete(
    "/:id",
    authorizationMiddleware.requirePermissions(["user:delete"]),
    usersController.deleteUser.bind(usersController),
);
```

**Purpose**: Delete user from system
**Authentication**: Required
**Authorization**: `user:delete` permission
**Validation**: ID parameter validation in controller

**Path Parameters**:

- `id`: User ID (integer)

**Response**:

```typescript
// Success (204 No Content)
// No response body

// Error (404 Not Found)
{
    success: false,
    message: "User not found"
}
```

## User Role Management

### Get User's Roles

```typescript
// GET /api/v1/users/:id/roles
userRoute.get(
    "/:id/roles",
    authorizationMiddleware.requireRoles(["admin"]),
    usersController.getUserRoles.bind(usersController),
);
```

**Purpose**: Retrieve all roles assigned to a user
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: ID parameter validation in controller

**Path Parameters**:

- `id`: User ID (integer)

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "User roles retrieved successfully",
    data: [
        {
            id: number,
            name: string,
            description: string,
            createdAt: string,
            updatedAt: string
        }
    ]
}
```

### Assign Roles to User

```typescript
// POST /api/v1/users/:id/roles
userRoute.post(
    "/:id/roles",
    authorizationMiddleware.requireRoles(["admin"]),
    validationMiddleware.validate(assignUserRolesSchema),
    usersController.assignUserRoles.bind(usersController),
);
```

**Purpose**: Assign one or more roles to a user
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: `assignUserRolesSchema`

**Path Parameters**:

- `id`: User ID (integer)

**Request Body**:

```typescript
{
    roleIds: number[];  // Array of role IDs to assign
}
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Roles assigned successfully",
    data: {
        userId: number,
        assignedRoles: Role[],
        totalRoles: number
    }
}

// Error (404 Not Found)
{
    success: false,
    message: "User not found"
}

// Error (400 Bad Request)
{
    success: false,
    message: "Some role IDs are invalid"
}
```

### Remove Role from User

```typescript
// DELETE /api/v1/users/:id/roles/:roleId
userRoute.delete(
    "/:id/roles/:roleId",
    authorizationMiddleware.requireRoles(["admin"]),
    usersController.removeUserRole.bind(usersController),
);
```

**Purpose**: Remove specific role from user
**Authentication**: Required
**Authorization**: `admin` role required
**Validation**: ID parameter validation in controller

**Path Parameters**:

- `id`: User ID (integer)
- `roleId`: Role ID (integer)

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Role removed successfully"
}

// Error (404 Not Found)
{
    success: false,
    message: "User or role not found"
}

// Error (400 Bad Request)
{
    success: false,
    message: "User does not have this role"
}
```

## Validation Schemas

### Create User Schema

```typescript
export const createUserRouteSchema = z.object({
    body: insertUserSchema
        .pick({
            email: true,
            password: true,
            firstName: true,
            lastName: true,
        })
        .extend({
            emailVerified: z.boolean().optional(),
        }),
    params: z.object({}),
    query: z.object({}),
});
```

### Update User Schema

```typescript
export const updateUserRouteSchema = z.object({
    body: insertUserSchema
        .pick({
            email: true,
            firstName: true,
            lastName: true,
        })
        .extend({
            emailVerified: z.boolean().optional(),
        })
        .partial(),
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number"),
    }),
    query: z.object({}),
});
```

### Assign User Roles Schema

```typescript
export const assignUserRolesSchema = z.object({
    body: z.object({
        roleIds: z.array(z.number().int().positive()).min(1, "At least one role ID required"),
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number"),
    }),
    query: z.object({}),
});
```

## Authorization Patterns

### Permission-Based Access

```typescript
// Different permission levels for different operations
userRoute.get("/", authorizationMiddleware.requirePermissions(["user:read"]));
userRoute.post("/", authorizationMiddleware.requirePermissions(["user:create"]));
userRoute.put("/:id", authorizationMiddleware.requirePermissions(["user:update"]));
userRoute.delete("/:id", authorizationMiddleware.requirePermissions(["user:delete"]));
```

### Role-Based Access

```typescript
// Admin-only operations for user role management
userRoute.get("/:id/roles", authorizationMiddleware.requireRoles(["admin"]));
userRoute.post("/:id/roles", authorizationMiddleware.requireRoles(["admin"]));
userRoute.delete("/:id/roles/:roleId", authorizationMiddleware.requireRoles(["admin"]));
```

### Self-Access Patterns

For operations where users should be able to access their own data:

```typescript
// Controller logic can check if user is accessing their own data
// or has appropriate permissions for other users
async getUserById(req: Request, res: Response): Promise<void> {
    const requestedUserId = parseInt(req.params.id);
    const currentUserId = req.body.user.id;

    // Users can access their own data, or admins can access any data
    const canAccess = requestedUserId === currentUserId ||
                     await this.authorizationService.hasPermission(currentUserId, "user:read");

    if (!canAccess) {
        res.status(403).json({
            success: false,
            message: "Access denied"
        });
        return;
    }

    // Proceed with getting user data
}
```

## Query Parameter Handling

### Pagination

```typescript
// Support pagination in list endpoints
async getAllUsers(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    const { users, total } = await this.userService.getUsers({ page, limit });

    res.json({
        success: true,
        data: users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
}
```

### Data Inclusion

```typescript
// Support including related data
async getUserById(req: Request, res: Response): Promise<void> {
    const includeRoles = req.query.include_roles === "true";

    let user;
    if (includeRoles) {
        user = await this.userService.getUserWithRoles(userId);
    } else {
        user = await this.userService.getUserById(userId);
    }

    res.json({
        success: true,
        data: user
    });
}
```

## Error Handling

### Common Error Scenarios

```typescript
// User not found (404)
{
    success: false,
    message: "User not found"
}

// Insufficient permissions (403)
{
    success: false,
    message: "Insufficient permissions"
}

// Invalid user ID (400)
{
    success: false,
    message: "Invalid user ID"
}

// Email already exists (409)
{
    success: false,
    message: "Email already exists"
}

// Validation error (400)
{
    success: false,
    message: "Validation failed",
    errors: [
        { field: "email", message: "Invalid email format" }
    ]
}
```

## Testing User Routes

### Test Structure

```typescript
describe("User Routes", () => {
    let adminToken: string;
    let userToken: string;
    let testUser: User;

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
        testUser = await createTestUser({
            email: "user@example.com",
        });
        userToken = await getTokenForUser(testUser.id);
    });

    describe("GET /api/v1/users", () => {
        it("should require authentication", async () => {
            const response = await request(app).get("/api/v1/users");

            expect(response.status).toBe(401);
        });

        it("should require user:read permission", async () => {
            const response = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${userToken}`);

            expect(response.status).toBe(403);
        });

        it("should return users for authorized request", async () => {
            const response = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe("POST /api/v1/users", () => {
        it("should create user with valid data", async () => {
            const userData = {
                email: "newuser@example.com",
                password: "SecurePassword123!",
                firstName: "New",
                lastName: "User",
            };

            const response = await request(app)
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe(userData.email);
        });

        it("should reject duplicate email", async () => {
            const userData = {
                email: testUser.email, // Existing email
                password: "SecurePassword123!",
                firstName: "Test",
                lastName: "User",
            };

            const response = await request(app)
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(userData);

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });
    });

    describe("GET /api/v1/users/:id", () => {
        it("should return user by ID", async () => {
            const response = await request(app)
                .get(`/api/v1/users/${testUser.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(testUser.id);
        });

        it("should return 404 for non-existent user", async () => {
            const response = await request(app).get("/api/v1/users/99999").set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe("User Role Management", () => {
        it("should assign roles to user", async () => {
            const role = await createTestRole({ name: "editor" });

            const response = await request(app)
                .post(`/api/v1/users/${testUser.id}/roles`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ roleIds: [role.id] });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should remove role from user", async () => {
            const role = await createTestRole({ name: "editor" });
            await assignRoleToUser(testUser.id, role.id);

            const response = await request(app)
                .delete(`/api/v1/users/${testUser.id}/roles/${role.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
```

### Test Helpers

```typescript
export async function createTestUser(userData: Partial<User> & { roles?: string[] }): Promise<User> {
    // Create test user with optional roles
}

export async function getTokenForUser(userId: number): Promise<string> {
    // Generate valid JWT token for user
}

export async function createTestRole(roleData: Partial<Role>): Promise<Role> {
    // Create test role
}

export async function assignRoleToUser(userId: number, roleId: number): Promise<void> {
    // Assign role to user
}
```

## Security Considerations

### Input Validation

1. **Parameter Validation**: All route parameters are validated in controllers
2. **Body Validation**: Request bodies are validated using Zod schemas
3. **SQL Injection Prevention**: Using Drizzle ORM prevents SQL injection
4. **XSS Prevention**: Input sanitization prevents XSS attacks

### Authorization Security

1. **Permission Checks**: All operations require appropriate permissions
2. **Role-Based Access**: Admin operations require admin role
3. **Self-Access Patterns**: Users can access their own data with lower permissions
4. **Privilege Escalation Prevention**: Users cannot modify their own roles

### Data Protection

1. **Password Exclusion**: Passwords are never returned in responses
2. **Sensitive Data**: Email verification and other sensitive operations are protected
3. **Audit Trail**: User modifications should be logged for security auditing

## Performance Considerations

### Pagination

```typescript
// Implement efficient pagination
const { users, total } = await this.userService.getUsers({
    page: 1,
    limit: 10,
    offset: (page - 1) * limit,
});
```

### Query Optimization

```typescript
// Include related data efficiently
if (includeRoles) {
    user = await this.userService.getUserWithRoles(userId); // Single query with join
} else {
    user = await this.userService.getUserById(userId); // Simple query
}
```

### Caching

```typescript
// Cache user role information for authorization
const userRoles = await this.cacheService.remember(
    `user:${userId}:roles`,
    () => this.userService.getUserRoles(userId),
    300, // 5 minutes
);
```

## Best Practices

### Route Organization

1. **Logical Grouping**: Group related operations (CRUD vs role management)
2. **Consistent Patterns**: Use consistent URL patterns across all resources
3. **RESTful Design**: Follow REST conventions for predictability

### Authorization

1. **Least Privilege**: Apply minimum required permissions for each operation
2. **Role Hierarchy**: Use role-based access for administrative operations
3. **Self-Access**: Allow users to access their own data with appropriate permissions

### Error Handling

1. **Consistent Responses**: Use consistent error response format
2. **Appropriate Status Codes**: Return correct HTTP status codes
3. **Security-Aware**: Don't expose sensitive information in error messages

## Related Documentation

- [Users Controller Guide](../controllers/users-controller.guide.md)
- [User Service Guide](../services/user-service.guide.md)
- [Authorization Middleware Guide](../middlewares/authorization-middleware.guide.md)
- [User Validation Schemas Guide](../db/users-schema.guide.md)
- [RBAC Repositories Guide](../repositories/rbac-repositories.guide.md)
