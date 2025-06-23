# Middlewares Layer Guide

## Overview

The middlewares layer in this TypeScript Express API provides cross-cutting concerns that execute between the HTTP request and controller response. Middlewares handle authentication, authorization, validation, rate limiting, error handling, and other request processing tasks.

## Architecture

### Middleware Layer Principles

1. **Cross-Cutting Concerns**: Handle functionality that spans multiple routes and controllers
2. **Request Pipeline**: Execute in a defined order as part of the request processing pipeline
3. **Dependency Injection**: Use Inversify for service injection where needed
4. **Interface-Based Design**: Implement standard middleware interfaces for consistency
5. **Early Return**: Stop request processing when conditions aren't met
6. **Request Enhancement**: Add data to requests for downstream use

### Middleware Types

#### Core Middlewares

- **AuthenticationGuard**: JWT token validation and user context setup
- **AuthorizationMiddleware**: Permission and role-based access control
- **ValidationMiddleware**: Request data validation using Zod schemas
- **LoginRateLimiter**: Rate limiting for authentication endpoints
- **RefreshTokenGuardMiddleware**: Validates refresh token cookie on the refresh route
- **RefreshRateLimiter**: Rate limiting for token refresh endpoints
- **JsonErrorHandler**: Global error handling and response formatting

## Middleware Structure

### Base Middleware Interface

```typescript
import { Request, Response, NextFunction } from "express";

export default interface IMiddleware {
    handle(req: Request, res: Response, next: NextFunction): Promise<void> | void;
}
```

### Basic Middleware Pattern

```typescript
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "inversify";

@injectable()
export default class ExampleMiddleware implements IMiddleware {
    constructor(
        @inject(TYPES.IExampleService)
        private readonly exampleService: IExampleService,
    ) {}

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate request
            if (!this.isValidRequest(req)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid request",
                });
                return;
            }

            // Process request
            await this.processRequest(req);

            // Continue to next middleware/controller
            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Middleware processing failed",
            });
        }
    }

    private isValidRequest(req: Request): boolean {
        // Validation logic
        return true;
    }

    private async processRequest(req: Request): Promise<void> {
        // Processing logic
    }
}
```

### Functional Middleware Pattern

```typescript
// For simpler middlewares that don't need dependency injection
export const exampleMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Simple processing logic
    if (!req.headers.authorization) {
        res.status(401).json({
            success: false,
            message: "Authorization header required",
        });
        return;
    }

    next();
};
```

## Core Middlewares

### AuthenticationGuard

Validates JWT tokens and sets up user context:

```typescript
@injectable()
export default class AuthenticationGuardMiddleware implements IMiddleware {
    constructor(
        @inject(TYPES.ITokenRepository)
        private readonly tokenRepo: ITokenRepository,
    ) {}

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({
                success: false,
                data: null,
                message: "Unauthorized - Token required",
            });
            return;
        }

        let payload: JwtAccessPayload;
        try {
            payload = jwt.verify(token, JWT_SECRET) as JwtAccessPayload;
        } catch (error) {
            res.status(401).json({
                success: false,
                data: null,
                message: "Unauthorized - Invalid token",
            });
            return;
        }

        // Check token revocation
        if (await this.tokenRepo.isAccessTokenRevoked(payload.jti)) {
            res.status(401).json({
                success: false,
                data: null,
                message: "Unauthorized - Token revoked",
            });
            return;
        }

        // Set user context
        req.body.user = {
            id: payload.sub,
            jti: payload.jti,
        };

        next();
    }
}
```

**Key Features:**

- JWT token validation
- Token revocation checking
- User context setup
- Error handling with appropriate HTTP status codes

### AuthorizationMiddleware

Provides role and permission-based access control:

```typescript
@injectable()
export default class AuthorizationMiddleware implements IAuthorizationMiddleware {
    constructor(
        @inject(TYPES.IAuthorizationService)
        private readonly authorizationService: IAuthorizationService,
    ) {}

    public requirePermissions(
        permissions: string[],
        requireAll = false,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void> {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            const userId = req.body.user?.id;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }

            const hasPermission = requireAll
                ? await this.authorizationService.hasAllPermissions(userId, permissions)
                : await this.authorizationService.hasAnyPermission(userId, permissions);

            if (!hasPermission) {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions",
                });
                return;
            }

            next();
        };
    }

    public requireRoles(
        roles: string[],
        requireAll = false,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void> {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            const userId = req.body.user?.id;

            const hasRole = requireAll
                ? await this.authorizationService.hasAllRoles(userId, roles)
                : await this.authorizationService.hasAnyRole(userId, roles);

            if (!hasRole) {
                res.status(403).json({
                    success: false,
                    message: "Insufficient role permissions",
                });
                return;
            }

            next();
        };
    }
}
```

### ValidationMiddleware

Validates request data using Zod schemas:

```typescript
@injectable()
export class ValidationMiddleware {
    constructor(
        @inject(TYPES.IValidationService)
        private validator: IValidationService,
    ) {}

    public validate(schema: ValidatableSchema) {
        return (req: Request, res: Response, next: NextFunction) => {
            try {
                const clean = schema.parse({
                    body: req.body,
                    params: req.params,
                    query: req.query,
                });

                req.body.cleanBody = clean;
                next();
            } catch (err) {
                this.validator.handleError(res, err);
                return;
            }
        };
    }
}
```

**Key Features:**

- Zod schema validation
- Request data sanitization
- Structured error responses
- Type-safe validated data access

### Rate Limiting Middlewares

#### LoginRateLimiter

```typescript
@injectable()
export default class LoginRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;

    constructor(
        @inject(TYPES.ICacheService)
        private readonly cacheService: ICacheService,
    ) {
        this.limiter = new RateLimiterRedis({
            storeClient: this.cacheService.client,
            keyPrefix: "rl_login",
            points: 5, // 5 attempts
            duration: 60, // per 60 seconds
            blockDuration: 300, // block for 5 minutes
        });
    }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await this.limiter.consume(req.ip);
            next();
        } catch (_err) {
            res.status(429).json({
                success: false,
                message: "Too many login requests, please wait.",
            });
        }
    }
}
```

## Middleware Registration

### Dependency Injection Registration

```typescript
// In src/di/container.ts
container.bind<IMiddleware>(TYPES.AuthenticationGuard).to(AuthenticationGuardMiddleware);
container.bind<IAuthorizationMiddleware>(TYPES.AuthorizationMiddleware).to(AuthorizationMiddleware);
container.bind<IValidationMiddleware>(TYPES.ValidationMiddleware).to(ValidationMiddleware);
container.bind<IMiddleware>(TYPES.LoginRateLimiter).to(LoginRateLimiter);
```

### Route-Level Application

```typescript
// In route files
import { Router } from "express";
import { container } from "@/di/container";
import { TYPES } from "@/di/types";

const router = Router();
const authGuard = container.get<IMiddleware>(TYPES.AuthenticationGuard);
const authzMiddleware = container.get<IAuthorizationMiddleware>(TYPES.AuthorizationMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.ValidationMiddleware);

// Public route
router.post("/register", validationMiddleware.validate(registerSchema), authController.register);

// Protected route
router.get(
    "/users",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requirePermissions(["users:read"]),
    usersController.getAllUsers,
);

// Admin route
router.delete(
    "/users/:id",
    authGuard.handle.bind(authGuard),
    authzMiddleware.requirePermissions(["users:delete"]),
    usersController.deleteUser,
);
```

## Middleware Chaining

### Sequential Processing

```typescript
// Middleware execution order matters
router.post(
    "/protected-endpoint",
    // 1. Rate limiting (first line of defense)
    loginRateLimit.handle.bind(loginRateLimit),

    // 2. Input validation
    validationMiddleware.validate(schema),

    // 3. Authentication (verify user identity)
    authGuard.handle.bind(authGuard),

    // 4. Authorization (verify permissions)
    authzMiddleware.requirePermissions(["resource:action"]),

    // 5. Controller (business logic)
    controller.handleRequest,
);
```

### Conditional Middleware

```typescript
// Apply middleware conditionally
const conditionalAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/public")) {
        next(); // Skip authentication for public routes
    } else {
        authGuard.handle(req, res, next);
    }
};
```

## Error Handling

### Middleware Error Patterns

```typescript
public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // Middleware logic
        await this.processRequest(req);
        next();
    } catch (error) {
        // Log error for debugging
        console.error("Middleware error:", error);

        // Return standardized error response
        res.status(500).json({
            success: false,
            message: "Request processing failed"
        });
        // Don't call next() - stop the request pipeline
    }
}
```

### Global Error Handler

```typescript
const jsonErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    console.error(`Error on ${req.method} ${req.path}:`, err);

    // Determine appropriate status code
    const statusCode = err.status || err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack,
        }),
    });
};
```

## Request Enhancement

### Adding User Context

```typescript
// Authentication middleware adds user data
req.body.user = {
    id: payload.sub,
    jti: payload.jti,
    email: payload.email,
    emailVerified: payload.emailVerified,
};
```

### Adding Validated Data

```typescript
// Validation middleware adds clean data
req.body.cleanBody = {
    body: validatedBody,
    params: validatedParams,
    query: validatedQuery,
};
```

### Type-Safe Request Extensions

```typescript
// Extend Request interface for type safety
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                jti: string;
                email: string;
                emailVerified: boolean;
            };
            cleanBody?: {
                body: any;
                params: any;
                query: any;
            };
        }
    }
}
```

## Testing Middlewares

### Unit Testing Pattern

```typescript
describe("AuthenticationGuardMiddleware", () => {
    let tokenRepo: jest.Mocked<ITokenRepository>;
    let middleware: AuthenticationGuardMiddleware;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        tokenRepo = {
            isAccessTokenRevoked: jest.fn(),
        };

        middleware = new AuthenticationGuardMiddleware(tokenRepo);

        req = {
            headers: {},
            body: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it("should deny request without token", async () => {
        await middleware.handle(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: null,
            message: "Unauthorized - Token required",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should allow valid token", async () => {
        req.headers = { authorization: "Bearer valid_token" };
        (jwt.verify as jest.Mock).mockReturnValue({
            sub: "123",
            jti: "token_id",
        });
        tokenRepo.isAccessTokenRevoked.mockResolvedValue(false);

        await middleware.handle(req as Request, res as Response, next);

        expect(req.body.user).toEqual({
            id: "123",
            jti: "token_id",
        });
        expect(next).toHaveBeenCalled();
    });
});
```

### Integration Testing

```typescript
describe("Middleware Integration", () => {
    let app: Express;

    beforeEach(() => {
        app = createTestApp();
    });

    it("should process middleware chain correctly", async () => {
        const response = await request(app)
            .get("/protected-endpoint")
            .set("Authorization", "Bearer valid_token")
            .expect(200);

        expect(response.body.success).toBe(true);
    });

    it("should stop at authentication failure", async () => {
        const response = await request(app).get("/protected-endpoint").expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("Token required");
    });
});
```

## Performance Considerations

### Middleware Optimization

```typescript
// Cache expensive operations
class AuthorizationMiddleware {
    private permissionCache = new Map<string, boolean>();

    public requirePermissions(permissions: string[]) {
        return async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.body.user?.id;
            const cacheKey = `${userId}:${permissions.join(",")}`;

            // Check cache first
            if (this.permissionCache.has(cacheKey)) {
                const hasPermission = this.permissionCache.get(cacheKey);
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: "Insufficient permissions",
                    });
                }
                return next();
            }

            // Fetch from service
            const hasPermission = await this.authorizationService.hasAnyPermission(userId, permissions);

            // Cache result
            this.permissionCache.set(cacheKey, hasPermission);

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

### Rate Limiting Optimization

```typescript
// Efficient rate limiting with Redis
class LoginRateLimiter {
    constructor(cacheService: ICacheService) {
        this.limiter = new RateLimiterRedis({
            storeClient: cacheService.client,
            keyPrefix: "rl_login",
            points: 5,
            duration: 60,
            blockDuration: 300,
            execEvenly: true, // Spread requests evenly across duration
        });
    }
}
```

## Security Considerations

### Token Security

```typescript
// Secure token handling
public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    // Validate authorization header format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Invalid authorization header format"
        });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Validate token format
    if (!token || token.length === 0) {
        return res.status(401).json({
            success: false,
            message: "Token required"
        });
    }

    // Verify and validate JWT
    try {
        const payload = jwt.verify(token, JWT_SECRET) as JwtAccessPayload;

        // Additional payload validation
        if (!payload.sub || !payload.jti) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload"
            });
        }

        // Check revocation
        if (await this.tokenRepo.isAccessTokenRevoked(payload.jti)) {
            return res.status(401).json({
                success: false,
                message: "Token has been revoked"
            });
        }

        req.body.user = {
            id: parseInt(payload.sub),
            jti: payload.jti
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}
```

### Input Sanitization

```typescript
// Sanitize request data
public validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Parse and sanitize data
            const cleanData = schema.parse({
                body: req.body,
                params: req.params,
                query: req.query,
            });

            // Store sanitized data
            req.body.cleanBody = cleanData;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: error.errors.map(err => ({
                        field: err.path.join("."),
                        message: err.message
                    }))
                });
            }

            return res.status(400).json({
                success: false,
                message: "Invalid request data"
            });
        }
    };
}
```

## Best Practices

### Middleware Design

1. **Single Responsibility**: Each middleware should handle one specific concern
2. **Early Return**: Stop processing as soon as conditions aren't met
3. **Error Handling**: Always handle errors gracefully and return appropriate responses
4. **Request Enhancement**: Add useful data to requests for downstream use
5. **Performance**: Cache expensive operations and optimize database queries

### Security

1. **Validate All Inputs**: Use validation middleware for all user inputs
2. **Check Token Revocation**: Always verify token validity against blacklists
3. **Rate Limiting**: Implement appropriate rate limiting for all endpoints
4. **Error Information**: Don't expose sensitive information in error messages
5. **Authentication First**: Always authenticate before authorization

### Testing

1. **Unit Test Each Middleware**: Test middleware logic in isolation
2. **Mock Dependencies**: Mock all external dependencies and services
3. **Test Error Scenarios**: Verify error handling and edge cases
4. **Integration Testing**: Test middleware chains and interactions

## Middleware-Specific Guides

- [Authentication Middleware Guide](./authentication-middleware.guide.md)
- [Authorization Middleware Guide](./authorization-middleware.guide.md)
- [Validation Middleware Guide](./validation-middleware.guide.md)
- [Rate Limiting Middleware Guide](./rate-limiting-middleware.guide.md)

## Related Documentation

- [Controllers Layer Guide](../controllers/controllers.guide.md)
- [Services Layer Guide](../services/services.guide.md)
- [Authentication Service Guide](../services/authentication-service.guide.md)
- [Authorization Service Guide](../services/authorization-service.guide.md)
- [Validation Service Guide](../services/validation-service.guide.md)
- [Cache Service Guide](../services/cache-service.guide.md)
