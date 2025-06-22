# Authorization Middleware Guide

## Overview

The `AuthorizationMiddleware` provides role-based access control (RBAC) and permission-based authorization for protected routes. It works in conjunction with the authentication middleware to ensure users have the necessary permissions to access specific resources and perform actions.

## Architecture

### Core Responsibilities

1. **Permission Checking**: Verify users have required permissions
2. **Role Validation**: Check if users have necessary roles
3. **Action Authorization**: Validate user actions on specific resources
4. **Flexible Authorization**: Support multiple authorization patterns
5. **Security Response**: Return appropriate HTTP status codes for authorization failures

### Authorization Patterns

- **Permission-Based**: Check specific permissions (e.g., "users:read", "posts:delete")
- **Role-Based**: Check user roles (e.g., "admin", "moderator")
- **Action-Based**: High-level action validation (e.g., "read user", "create post")
- **Composite**: Combine multiple authorization criteria

### Dependencies

- **IAuthorizationService**: For checking permissions, roles, and actions
- **Authentication Context**: Requires authenticated user from previous middleware

## Implementation

### Interface Definition

```typescript
export interface AuthorizationOptions {
    permissions?: string[];
    roles?: string[];
    action?: string;
    resource?: string;
    requireAll?: boolean; // true = all permissions/roles required, false = any one required
}

export interface IAuthorizationMiddleware extends IMiddleware {
    requirePermissions(
        permissions: string[],
        requireAll?: boolean,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireRoles(
        roles: string[],
        requireAll?: boolean,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAction(
        action: string,
        resource?: string,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createWithOptions(
        options: AuthorizationOptions,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
```

### Class Structure

```typescript
@injectable()
export default class AuthorizationMiddleware implements IAuthorizationMiddleware {
    constructor(
        @inject(TYPES.IAuthorizationService)
        private readonly authorizationService: IAuthorizationService,
    ) {}

    // Base handle method (should not be used directly)
    public handle(req: Request, res: Response, next: NextFunction): void {
        res.status(403).json({
            success: false,
            data: null,
            message: "Authorization method not specified",
        });
    }

    // Specific authorization methods...
}
```

## Authorization Methods

### Permission-Based Authorization

```typescript
public requirePermissions(
    permissions: string[],
    requireAll = false,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Extract user ID from authentication context
        const userIdRaw = req.body.user?.id ?? req.body.user;
        const userId = typeof userIdRaw === "string" ? parseInt(userIdRaw, 10) : userIdRaw;

        if (!userId || isNaN(userId)) {
            res.status(401).json({
                success: false,
                data: null,
                message: "Authentication required",
            });
            return;
        }

        try {
            const hasPermission = requireAll
                ? await this.authorizationService.hasAllPermissions(userId, permissions)
                : await this.authorizationService.hasAnyPermission(userId, permissions);

            if (!hasPermission) {
                res.status(403).json({
                    success: false,
                    data: null,
                    message: "Insufficient permissions",
                });
                return;
            }

            next();
        } catch (error) {
            console.error("Authorization error:", error);
            res.status(500).json({
                success: false,
                data: null,
                message: "Authorization check failed",
            });
        }
    };
}
```

**Usage Examples:**

```typescript
// Require specific permission
router.get(
    "/users",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requirePermissions(["users:read"]),
    usersController.getAllUsers,
);

// Require any of multiple permissions
router.get(
    "/reports",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requirePermissions(["reports:read", "admin:all"]),
    reportsController.getReports,
);

// Require all permissions
router.delete(
    "/system/config",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requirePermissions(["system:write", "config:delete"], true),
    systemController.deleteConfig,
);
```

### Role-Based Authorization

```typescript
public requireRoles(
    roles: string[],
    requireAll = false,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userIdRaw = req.body.user?.id ?? req.body.user;
        const userId = typeof userIdRaw === "string" ? parseInt(userIdRaw, 10) : userIdRaw;

        if (!userId || isNaN(userId)) {
            res.status(401).json({
                success: false,
                data: null,
                message: "Authentication required",
            });
            return;
        }

        try {
            const hasRole = requireAll
                ? await this.authorizationService.hasAllRoles(userId, roles)
                : await this.authorizationService.hasAnyRole(userId, roles);

            if (!hasRole) {
                res.status(403).json({
                    success: false,
                    data: null,
                    message: "Insufficient role privileges",
                });
                return;
            }

            next();
        } catch (error) {
            console.error("Authorization error:", error);
            res.status(500).json({
                success: false,
                data: null,
                message: "Authorization check failed",
            });
        }
    };
}
```

**Usage Examples:**

```typescript
// Require admin role
router.post(
    "/users",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requireRoles(["admin"]),
    usersController.createUser,
);

// Require any of multiple roles
router.get(
    "/moderation",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requireRoles(["admin", "moderator"]),
    moderationController.getModerationQueue,
);

// Require all roles (rare use case)
router.delete(
    "/system",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requireRoles(["admin", "superuser"], true),
    systemController.deleteSystem,
);
```

### Action-Based Authorization

```typescript
public requireAction(
    action: string,
    resource?: string,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userIdRaw = req.body.user?.id ?? req.body.user;
        const userId = typeof userIdRaw === "string" ? parseInt(userIdRaw, 10) : userIdRaw;

        if (!userId || isNaN(userId)) {
            res.status(401).json({
                success: false,
                data: null,
                message: "Authentication required",
            });
            return;
        }

        try {
            const canPerformAction = await this.authorizationService.can(userId, action, resource);

            if (!canPerformAction) {
                res.status(403).json({
                    success: false,
                    data: null,
                    message: `Not authorized to ${action}${resource ? ` ${resource}` : ""}`,
                });
                return;
            }

            next();
        } catch (error) {
            console.error("Authorization error:", error);
            res.status(500).json({
                success: false,
                data: null,
                message: "Authorization check failed",
            });
        }
    };
}
```

**Usage Examples:**

```typescript
// Action without resource
router.get(
    "/analytics",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requireAction("view_analytics"),
    analyticsController.getAnalytics,
);

// Action with resource
router.put(
    "/users/:id",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requireAction("update", "user"),
    usersController.updateUser,
);

// RESTful action mapping
router.post(
    "/posts",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requireAction("create", "post"),
    postsController.createPost,
);
```

### Complex Authorization with Options

```typescript
public createWithOptions(
    options: AuthorizationOptions,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userIdRaw = req.body.user?.id ?? req.body.user;
        const userId = typeof userIdRaw === "string" ? parseInt(userIdRaw, 10) : userIdRaw;

        if (!userId || isNaN(userId)) {
            res.status(401).json({
                success: false,
                data: null,
                message: "Authentication required",
            });
            return;
        }

        try {
            let authorized = false;

            // Check action-based authorization first (highest priority)
            if (options.action) {
                authorized = await this.authorizationService.can(userId, options.action, options.resource);
            }
            // Check permissions
            else if (options.permissions && options.permissions.length > 0) {
                authorized = options.requireAll
                    ? await this.authorizationService.hasAllPermissions(userId, options.permissions)
                    : await this.authorizationService.hasAnyPermission(userId, options.permissions);
            }
            // Check roles
            else if (options.roles && options.roles.length > 0) {
                authorized = options.requireAll
                    ? await this.authorizationService.hasAllRoles(userId, options.roles)
                    : await this.authorizationService.hasAnyRole(userId, options.roles);
            }
            // No authorization criteria specified - deny by default
            else {
                authorized = false;
            }

            if (!authorized) {
                res.status(403).json({
                    success: false,
                    data: null,
                    message: "Access denied",
                });
                return;
            }

            next();
        } catch (error) {
            console.error("Authorization error:", error);
            res.status(500).json({
                success: false,
                data: null,
                message: "Authorization check failed",
            });
        }
    };
}
```

**Usage Examples:**

```typescript
// Complex authorization with multiple criteria
const complexAuth = authzMiddleware.createWithOptions({
    permissions: ["advanced:access"],
    roles: ["premium"],
    requireAll: false, // User needs either permission OR role
});

router.get("/premium-features", authGuard.handle.bind(authGuard), complexAuth, featuresController.getPremiumFeatures);

// Action-based with fallback to permissions
const editAuth = authzMiddleware.createWithOptions({
    action: "edit",
    resource: "profile",
});

router.put("/profile", authGuard.handle.bind(authGuard), editAuth, profileController.updateProfile);
```

## Usage Patterns

### Route-Level Authorization

```typescript
// Apply authorization to all routes in router
const adminRouter = Router();

// All routes require authentication
adminRouter.use(authGuard.handle.bind(authGuard));

// All routes require admin role
adminRouter.use(authzMiddleware.requireRoles(["admin"]));

// Define admin routes
adminRouter.get("/users", usersController.getAllUsers);
adminRouter.post("/users", usersController.createUser);
adminRouter.delete("/users/:id", usersController.deleteUser);
```

### Endpoint-Specific Authorization

```typescript
// Different authorization for different endpoints
router.get(
    "/posts",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requirePermissions(["posts:read"]),
    postsController.getAllPosts,
);

router.post(
    "/posts",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requirePermissions(["posts:create"]),
    postsController.createPost,
);

router.delete(
    "/posts/:id",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requireRoles(["admin", "moderator"]),
    postsController.deletePost,
);
```

### Hierarchical Authorization

```typescript
// Basic access for all authenticated users
router.get("/posts", authGuard.handle.bind(authGuard), postsController.getAllPosts);

// Additional permissions for modification
router.put(
    "/posts/:id",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requirePermissions(["posts:edit"]),
    postsController.updatePost,
);

// Admin-only access for deletion
router.delete(
    "/posts/:id",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requireRoles(["admin"]),
    postsController.deletePost,
);
```

## Error Handling

### HTTP Status Codes

- **401 Unauthorized**: Missing authentication (user not authenticated)
- **403 Forbidden**: Insufficient permissions (user authenticated but not authorized)
- **500 Internal Server Error**: Authorization system errors

### Error Response Format

```typescript
// Insufficient permissions
{
    success: false,
    data: null,
    message: "Insufficient permissions"
}

// Missing authentication
{
    success: false,
    data: null,
    message: "Authentication required"
}

// System error
{
    success: false,
    data: null,
    message: "Authorization check failed"
}
```

### Error Scenarios

1. **Missing Authentication**:

    ```json
    {
        "success": false,
        "data": null,
        "message": "Authentication required"
    }
    ```

2. **Insufficient Permissions**:

    ```json
    {
        "success": false,
        "data": null,
        "message": "Insufficient permissions"
    }
    ```

3. **Insufficient Role Privileges**:

    ```json
    {
        "success": false,
        "data": null,
        "message": "Insufficient role privileges"
    }
    ```

4. **Action Not Authorized**:
    ```json
    {
        "success": false,
        "data": null,
        "message": "Not authorized to delete user"
    }
    ```

## Testing

### Unit Test Structure

```typescript
describe("AuthorizationMiddleware", () => {
    let authzService: jest.Mocked<IAuthorizationService>;
    let middleware: AuthorizationMiddleware;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        authzService = {
            hasAnyPermission: jest.fn(),
            hasAllPermissions: jest.fn(),
            hasAnyRole: jest.fn(),
            hasAllRoles: jest.fn(),
            can: jest.fn(),
        } as jest.Mocked<IAuthorizationService>;

        middleware = new AuthorizationMiddleware(authzService);

        req = {
            body: {
                user: { id: 123 },
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    // Test cases...
});
```

### Test Cases

#### Permission Authorization

```typescript
describe("requirePermissions", () => {
    it("should allow access with required permission", async () => {
        authzService.hasAnyPermission.mockResolvedValue(true);
        const middleware = authzMiddleware.requirePermissions(["users:read"]);

        await middleware(req as Request, res as Response, next);

        expect(authzService.hasAnyPermission).toHaveBeenCalledWith(123, ["users:read"]);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should deny access without required permission", async () => {
        authzService.hasAnyPermission.mockResolvedValue(false);
        const middleware = authzMiddleware.requirePermissions(["users:read"]);

        await middleware(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: null,
            message: "Insufficient permissions",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should require all permissions when requireAll is true", async () => {
        authzService.hasAllPermissions.mockResolvedValue(true);
        const middleware = authzMiddleware.requirePermissions(["users:read", "users:write"], true);

        await middleware(req as Request, res as Response, next);

        expect(authzService.hasAllPermissions).toHaveBeenCalledWith(123, ["users:read", "users:write"]);
        expect(next).toHaveBeenCalled();
    });
});
```

#### Role Authorization

```typescript
describe("requireRoles", () => {
    it("should allow access with required role", async () => {
        authzService.hasAnyRole.mockResolvedValue(true);
        const middleware = authzMiddleware.requireRoles(["admin"]);

        await middleware(req as Request, res as Response, next);

        expect(authzService.hasAnyRole).toHaveBeenCalledWith(123, ["admin"]);
        expect(next).toHaveBeenCalled();
    });

    it("should deny access without required role", async () => {
        authzService.hasAnyRole.mockResolvedValue(false);
        const middleware = authzMiddleware.requireRoles(["admin"]);

        await middleware(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: null,
            message: "Insufficient role privileges",
        });
        expect(next).not.toHaveBeenCalled();
    });
});
```

#### Action Authorization

```typescript
describe("requireAction", () => {
    it("should allow access for authorized action", async () => {
        authzService.can.mockResolvedValue(true);
        const middleware = authzMiddleware.requireAction("read", "user");

        await middleware(req as Request, res as Response, next);

        expect(authzService.can).toHaveBeenCalledWith(123, "read", "user");
        expect(next).toHaveBeenCalled();
    });

    it("should deny access for unauthorized action", async () => {
        authzService.can.mockResolvedValue(false);
        const middleware = authzMiddleware.requireAction("delete", "user");

        await middleware(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: null,
            message: "Not authorized to delete user",
        });
        expect(next).not.toHaveBeenCalled();
    });
});
```

#### Missing Authentication

```typescript
it("should return 401 when user is not authenticated", async () => {
    req.body = {}; // No user context
    const middleware = authzMiddleware.requirePermissions(["users:read"]);

    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: "Authentication required",
    });
    expect(next).not.toHaveBeenCalled();
});
```

### Integration Testing

```typescript
describe("Authorization Integration", () => {
    let app: Express;

    beforeEach(() => {
        app = createTestApp();
    });

    it("should allow admin access to admin endpoints", async () => {
        const adminToken = createTokenForUser({ id: 1, roles: ["admin"] });

        const response = await request(app)
            .get("/admin/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
    });

    it("should deny non-admin access to admin endpoints", async () => {
        const userToken = createTokenForUser({ id: 2, roles: ["user"] });

        const response = await request(app).get("/admin/users").set("Authorization", `Bearer ${userToken}`).expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("Insufficient");
    });
});
```

## Security Considerations

### Authorization Logic

1. **Fail Secure**: Deny access by default
2. **Least Privilege**: Grant minimum necessary permissions
3. **Defense in Depth**: Use multiple authorization layers
4. **Consistent Enforcement**: Apply authorization consistently across all endpoints

### User Context Validation

```typescript
// Always validate user context exists
const userIdRaw = req.body.user?.id ?? req.body.user;
const userId = typeof userIdRaw === "string" ? parseInt(userIdRaw, 10) : userIdRaw;

if (!userId || isNaN(userId)) {
    res.status(401).json({
        success: false,
        message: "Authentication required",
    });
    return;
}
```

### Error Handling

1. **Generic Messages**: Don't expose sensitive information in error messages
2. **Consistent Responses**: Use consistent error response format
3. **Security Logging**: Log authorization failures for security monitoring
4. **Graceful Degradation**: Handle service failures appropriately

## Performance Optimization

### Caching Authorization Results

```typescript
class AuthorizationMiddleware {
    private authCache = new Map<
        string,
        {
            result: boolean;
            timestamp: number;
        }
    >();

    private isCacheValid(timestamp: number): boolean {
        return Date.now() - timestamp < 30000; // 30 second cache
    }

    public requirePermissions(permissions: string[], requireAll = false) {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            const userId = req.body.user?.id;
            const cacheKey = `${userId}:permissions:${permissions.join(",")}:${requireAll}`;

            // Check cache first
            const cached = this.authCache.get(cacheKey);
            if (cached && this.isCacheValid(cached.timestamp)) {
                if (!cached.result) {
                    return res.status(403).json({
                        success: false,
                        message: "Insufficient permissions",
                    });
                }
                return next();
            }

            // Check authorization and cache result
            const hasPermission = requireAll
                ? await this.authorizationService.hasAllPermissions(userId, permissions)
                : await this.authorizationService.hasAnyPermission(userId, permissions);

            this.authCache.set(cacheKey, {
                result: hasPermission,
                timestamp: Date.now(),
            });

            if (!hasPermission) {
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

### Batch Authorization Checks

```typescript
// Check multiple permissions at once
const complexAuth = authzMiddleware.createWithOptions({
    permissions: ["users:read", "reports:access"],
    requireAll: false,
});

// This is more efficient than:
// authzMiddleware.requirePermissions(["users:read"])
// authzMiddleware.requirePermissions(["reports:access"])
```

## Best Practices

### Implementation

1. **Clear Authorization Logic**: Use descriptive permission and role names
2. **Granular Permissions**: Define fine-grained permissions for flexibility
3. **Role Hierarchies**: Implement role hierarchies where appropriate
4. **Resource-Specific**: Use resource-specific permissions when needed

### Integration

1. **Middleware Order**: Always place authorization after authentication
2. **Route Organization**: Group routes by authorization requirements
3. **Consistent Patterns**: Use consistent authorization patterns across the application
4. **Documentation**: Document authorization requirements for each endpoint

### Testing

1. **Comprehensive Coverage**: Test all authorization scenarios
2. **Edge Cases**: Test boundary conditions and error cases
3. **Integration Tests**: Test authorization in complete request flows
4. **Security Tests**: Test for authorization bypass attempts

## Related Documentation

- [Authentication Middleware Guide](./authentication-middleware.guide.md)
- [Authorization Service Guide](../services/authorization-service.guide.md)
- [RBAC Repositories Guide](../repositories/rbac-repositories.guide.md)
- [Middlewares Layer Guide](./middlewares.guide.md)
