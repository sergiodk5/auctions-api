# Routes Layer Guide

## Overview

The routes layer in this TypeScript Express API defines HTTP endpoints and orchestrates middleware chains to handle incoming requests. Routes act as the entry point for HTTP requests, coordinating authentication, authorization, validation, and controller invocation in the proper sequence.

## Architecture

### Routes Layer Principles

1. **RESTful Design**: Follow REST conventions for resource-based endpoints
2. **Middleware Orchestration**: Chain middleware in the correct order for security and functionality
3. **Dependency Injection**: Use Inversify container to resolve controllers and middleware
4. **API Versioning**: Use `/api/v1/` prefix for all endpoints
5. **Resource Organization**: Group routes by domain/resource for maintainability
6. **Security by Default**: Apply authentication and authorization at appropriate levels

### Route Types

#### Core Routes

- **Authentication Routes** (`/api/v1/auth`): Login, register, password reset, email verification
- **User Routes** (`/api/v1/users`): User CRUD operations and role management
- **Role Routes** (`/api/v1/roles`): Role management and permission assignments
- **Permission Routes** (`/api/v1/permissions`): Permission CRUD operations
- **Product Routes** (`/api/v1/products`): Product management endpoints
- **Status Routes** (`/api/v1/status`): Health check endpoints

## Route Structure

### Basic Route Pattern

```typescript
import express from "express";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import { IExampleController } from "@/controllers/example.controller";
import IMiddleware from "@/middlewares/IMiddleware";
import { IAuthorizationMiddleware } from "@/middlewares/authorization.middleware";
import { IValidationMiddleware } from "@/middlewares/validation.middleware";
import { exampleCreateSchema, exampleUpdateSchema } from "@/db/example-validation.schema";

// Resolve dependencies from DI container
const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const exampleController = container.get<IExampleController>(TYPES.IExampleController);

const exampleRoute = express.Router();

// Apply global middleware to all routes
exampleRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));

// GET / - List resources
exampleRoute.get(
    "/",
    authorizationMiddleware.requirePermissions(["example:read"]),
    exampleController.getAll.bind(exampleController),
);

// POST / - Create resource
exampleRoute.post(
    "/",
    authorizationMiddleware.requirePermissions(["example:create"]),
    validationMiddleware.validate(exampleCreateSchema),
    exampleController.create.bind(exampleController),
);

// GET /:id - Get specific resource
exampleRoute.get(
    "/:id",
    authorizationMiddleware.requirePermissions(["example:read"]),
    exampleController.getById.bind(exampleController),
);

// PUT /:id - Update resource
exampleRoute.put(
    "/:id",
    authorizationMiddleware.requirePermissions(["example:update"]),
    validationMiddleware.validate(exampleUpdateSchema),
    exampleController.update.bind(exampleController),
);

// DELETE /:id - Delete resource
exampleRoute.delete(
    "/:id",
    authorizationMiddleware.requirePermissions(["example:delete"]),
    exampleController.delete.bind(exampleController),
);

export default exampleRoute;
```

## Middleware Orchestration

### Standard Middleware Order

The middleware chain should follow this order for optimal security and functionality:

1. **Rate Limiting** (for specific endpoints like login/refresh)
2. **Validation** (input sanitization)
3. **Authentication** (token verification)
4. **Authorization** (permission/role checking)
5. **Controller** (business logic execution)

### Global vs Route-Specific Middleware

```typescript
// Global middleware applied to all routes in the router
userRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));

// Route-specific middleware for individual endpoints
userRoute.post(
    "/",
    // Rate limiting for specific endpoint
    rateLimiter.handle.bind(rateLimiter),
    // Validation for this specific request
    validationMiddleware.validate(createUserSchema),
    // Authorization for this specific action
    authorizationMiddleware.requirePermissions(["user:create"]),
    // Controller method
    usersController.createUser.bind(usersController),
);
```

## Dependency Injection Integration

### Container Resolution

```typescript
// Resolve all dependencies from the DI container
const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const usersController = container.get<IUsersController>(TYPES.IUsersController);
```

### Method Binding

```typescript
// Bind controller methods to maintain proper context
usersController.createUser.bind(usersController);

// Bind middleware handlers to maintain proper context
authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware);
```

## REST Conventions

### HTTP Methods and Status Codes

| Method | Purpose                | Success Status | Use Case                      |
| ------ | ---------------------- | -------------- | ----------------------------- |
| GET    | Retrieve resources     | 200 OK         | List or get specific resource |
| POST   | Create new resource    | 201 Created    | Create new resource           |
| PUT    | Update entire resource | 200 OK         | Update existing resource      |
| PATCH  | Partial update         | 200 OK         | Update specific fields        |
| DELETE | Remove resource        | 204 No Content | Delete resource               |

### URL Conventions

```typescript
// Resource collections
GET    /api/v1/users          // List all users
POST   /api/v1/users          // Create new user

// Specific resources
GET    /api/v1/users/:id      // Get user by ID
PUT    /api/v1/users/:id      // Update user
DELETE /api/v1/users/:id      // Delete user

// Nested resources
GET    /api/v1/users/:id/roles     // Get user's roles
POST   /api/v1/users/:id/roles     // Assign roles to user
DELETE /api/v1/users/:id/roles/:roleId  // Remove role from user

// Actions (non-CRUD operations)
POST   /api/v1/auth/login     // User login
POST   /api/v1/auth/logout    // User logout
POST   /api/v1/auth/refresh   // Refresh token
```

## Validation Integration

### Schema-Based Validation

```typescript
import { createUserRouteSchema, updateUserRouteSchema } from "@/db/user-validation.schema";

// Apply validation middleware with appropriate schema
userRoute.post(
    "/",
    validationMiddleware.validate(createUserRouteSchema),
    usersController.createUser.bind(usersController),
);

userRoute.put(
    "/:id",
    validationMiddleware.validate(updateUserRouteSchema),
    usersController.updateUser.bind(usersController),
);
```

### Validation Schema Structure

```typescript
// Example validation schema structure
export const createUserRouteSchema = z.object({
    body: insertUserSchema.pick({
        email: true,
        password: true,
        firstName: true,
        lastName: true,
    }),
    params: z.object({}),
    query: z.object({}),
});
```

## Authorization Patterns

### Permission-Based Authorization

```typescript
// Require specific permissions
authorizationMiddleware.requirePermissions(["user:read"]);
authorizationMiddleware.requirePermissions(["user:create", "user:update"], true); // requireAll = true
```

### Role-Based Authorization

```typescript
// Require specific roles
authorizationMiddleware.requireRoles(["admin"]);
authorizationMiddleware.requireRoles(["admin", "moderator"]); // any role
```

### Action-Based Authorization

```typescript
// High-level action checking
authorizationMiddleware.requireAction("read", "user");
authorizationMiddleware.requireAction("create", "product");
```

### Complex Authorization

```typescript
// Multiple authorization criteria
authorizationMiddleware.createWithOptions({
    permissions: ["admin:read"],
    roles: ["admin"],
    requireAll: false, // any criteria matches
});
```

## Rate Limiting

### Endpoint-Specific Rate Limiting

```typescript
// Apply rate limiting to sensitive endpoints
authenticationRoute.post(
    "/login",
    loginRateLimiter.handle.bind(loginRateLimiter), // 5 attempts per minute
    validationMiddleware.validate(authLoginRouteSchema),
    authController.login.bind(authController),
);

authenticationRoute.post(
    "/refresh",
    refreshRateLimiter.handle.bind(refreshRateLimiter), // 20 attempts per minute
    authController.refresh.bind(authController),
);
```

## Error Handling

### Route-Level Error Handling

Routes rely on:

1. **Middleware Error Handling**: Each middleware handles its own errors
2. **Controller Error Handling**: Controllers handle service errors
3. **Global Error Handler**: Final error handler middleware

```typescript
// Routes don't need explicit error handling - middleware and controllers handle errors
userRoute.get(
    "/:id",
    authorizationMiddleware.requirePermissions(["user:read"]), // Handles auth errors
    usersController.getUserById.bind(usersController), // Handles service errors
);
```

## App Integration

### Route Registration

```typescript
// src/app.ts
import authenticationRoute from "@/routes/authentication.route";
import userRoute from "@/routes/user.route";
import roleRoute from "@/routes/role.route";
import permissionRoute from "@/routes/permission.route";
import productRoute from "@/routes/product.route";
import statusRoute from "@/routes/status.route";

// Register routes with API versioning
app.use("/api/v1/status", statusRoute);
app.use("/api/v1/auth", authenticationRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/roles", roleRoute);
app.use("/api/v1/permissions", permissionRoute);
app.use("/api/v1/products", productRoute);
```

## Testing Routes

### Integration Testing Pattern

```typescript
import app from "@/app";
import request from "supertest";

describe("User Routes", () => {
    beforeEach(async () => {
        // Setup test data
    });

    afterEach(async () => {
        // Cleanup test data
    });

    describe("GET /api/v1/users", () => {
        it("should require authentication", async () => {
            const response = await request(app).get("/api/v1/users");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it("should require proper permissions", async () => {
            const token = await getValidToken(); // Helper function

            const response = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(403); // If user lacks permissions
        });

        it("should return users for authorized request", async () => {
            const token = await getAdminToken(); // Helper function

            const response = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe("POST /api/v1/users", () => {
        it("should validate request body", async () => {
            const token = await getAdminToken();

            const response = await request(app).post("/api/v1/users").set("Authorization", `Bearer ${token}`).send({}); // Empty body

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it("should create user with valid data", async () => {
            const token = await getAdminToken();

            const userData = {
                email: "test@example.com",
                password: "SecurePassword123!",
                firstName: "Test",
                lastName: "User",
            };

            const response = await request(app)
                .post("/api/v1/users")
                .set("Authorization", `Bearer ${token}`)
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe(userData.email);
        });
    });
});
```

### Test Helpers

```typescript
// Common test utilities for routes
export async function getValidToken(): Promise<string> {
    // Create test user and return valid JWT token
}

export async function getAdminToken(): Promise<string> {
    // Create admin user and return valid JWT token
}

export async function createTestUser(data: Partial<User>): Promise<User> {
    // Create test user with default values
}
```

## Security Considerations

### Authentication Requirements

```typescript
// Apply authentication to all protected routes
userRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));

// Public routes (no authentication required)
authenticationRoute.post("/login" /* ... */);
authenticationRoute.post("/register" /* ... */);
statusRoute.get("/" /* ... */);
```

### Authorization Levels

```typescript
// Public endpoints - no authorization
statusRoute.get("/", handler);

// Authenticated endpoints - requires valid token
authenticationRoute.post("/logout", authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware), handler);

// Permission-based endpoints - requires specific permissions
userRoute.get(
    "/",
    authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware),
    authorizationMiddleware.requirePermissions(["user:read"]),
    handler,
);

// Role-based endpoints - requires specific roles
roleRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));
roleRoute.use(authorizationMiddleware.requireRoles(["admin"])); // All role routes require admin
```

### Input Validation

```typescript
// Always validate input for data modification endpoints
userRoute.post(
    "/",
    validationMiddleware.validate(createUserRouteSchema), // Validate before processing
    authorizationMiddleware.requirePermissions(["user:create"]),
    usersController.createUser.bind(usersController),
);
```

## Performance Considerations

### Route Optimization

```typescript
// Group related middleware to avoid repetition
roleRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));
roleRoute.use(authorizationMiddleware.requireRoles(["admin"]));

// Now all role routes automatically have authentication and admin authorization
roleRoute.get("/", roleController.getAllRoles.bind(roleController));
roleRoute.post("/", validationMiddleware.validate(createRoleSchema), roleController.createRole.bind(roleController));
```

### Caching Strategies

```typescript
// Cache static or semi-static data at route level
permissionRoute.get(
    "/",
    cacheMiddleware.cache({ ttl: 300 }), // Cache permissions for 5 minutes
    permissionController.getAllPermissions.bind(permissionController),
);
```

## Best Practices

### Route Organization

1. **One Router Per Resource**: Create separate route files for each domain/resource
2. **Consistent Naming**: Use clear, descriptive route paths
3. **Middleware Grouping**: Apply common middleware at router level
4. **Proper HTTP Methods**: Use appropriate HTTP methods for different operations

### Middleware Application

1. **Security First**: Apply authentication and authorization before business logic
2. **Validate Early**: Validate input before expensive operations
3. **Rate Limit Sensitive Endpoints**: Protect login, registration, and password reset endpoints
4. **Error Handling**: Let middleware handle their specific error scenarios

### Controller Integration

1. **Method Binding**: Always bind controller methods to maintain context
2. **Single Responsibility**: Each route should call a single controller method
3. **RESTful Mapping**: Map HTTP methods to appropriate controller actions

## Route-Specific Guides

- [Authentication Routes Guide](./authentication-routes.guide.md)
- [User Routes Guide](./user-routes.guide.md)
- [Role Routes Guide](./role-routes.guide.md)
- [Permission Routes Guide](./permission-routes.guide.md)
- [Product Routes Guide](./product-routes.guide.md)
- [Status Routes Guide](./status-routes.guide.md)

## Related Documentation

- [Controllers Layer Guide](../controllers/controllers.guide.md)
- [Middleware Guide](../middlewares/middlewares.guide.md)
- [Authentication Middleware Guide](../middlewares/authentication-middleware.guide.md)
- [Authorization Middleware Guide](../middlewares/authorization-middleware.guide.md)
- [Validation Middleware Guide](../middlewares/validation-middleware.guide.md)
- [OpenAPI Documentation](../openapi.md)
