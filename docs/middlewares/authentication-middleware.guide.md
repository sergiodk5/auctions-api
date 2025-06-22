# Authentication Middleware Guide

## Overview

The `AuthenticationGuardMiddleware` is responsible for validating JWT tokens and establishing user authentication context for protected routes. It verifies token authenticity, checks for revocation, and adds user information to the request for downstream middleware and controllers.

## Architecture

### Core Responsibilities

1. **JWT Token Extraction**: Extract Bearer tokens from Authorization headers
2. **Token Validation**: Verify JWT signature and payload structure
3. **Revocation Checking**: Check if tokens have been revoked or blacklisted
4. **User Context Setup**: Add authenticated user data to request object
5. **Security Response**: Return appropriate HTTP status codes for authentication failures

### Dependencies

- **ITokenRepository**: For checking token revocation status
- **jsonwebtoken**: For JWT verification and payload extraction
- **Environment Configuration**: For JWT_SECRET access

## Implementation

### Class Structure

```typescript
@injectable()
export default class AuthenticationGuardMiddleware implements IMiddleware {
    constructor(
        @inject(TYPES.ITokenRepository)
        private readonly tokenRepo: ITokenRepository,
    ) {}

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        // Token extraction and validation logic
    }
}
```

### Token Extraction

```typescript
public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        res.status(401).json({
            success: false,
            data: null,
            message: "Unauthorized - Token required",
        });
        return;
    }

    // Continue with token validation...
}
```

**Key Features:**

- Expects `Authorization: Bearer <token>` header format
- Returns 401 status for missing tokens
- Provides clear error messages for debugging

### JWT Verification

```typescript
let payload: JwtAccessPayload;
try {
    payload = jwt.verify(token, JWT_SECRET) as JwtAccessPayload;

    if (typeof payload !== "object" || !payload?.sub) {
        res.status(401).json({
            success: false,
            data: null,
            message: "Unauthorized - Invalid token",
        });
        return;
    }
} catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({
        success: false,
        data: null,
        message: "Unauthorized - Invalid token",
    });
    return;
}
```

**Security Features:**

- Verifies JWT signature using secret key
- Validates payload structure and required fields
- Handles expired tokens and malformed JWTs
- Logs verification errors for monitoring

### Token Revocation Check

```typescript
try {
    if (await this.tokenRepo.isAccessTokenRevoked(payload.jti)) {
        console.error("Token revoked");
        res.status(401).json({
            success: false,
            data: null,
            message: "Unauthorized - Token revoked",
        });
        return;
    }
} catch (error) {
    // In test environment or if cache service is not available, skip revocation check
    console.warn("Could not check token revocation status:", error instanceof Error ? error.message : "Unknown error");
}
```

**Revocation Features:**

- Checks token blacklist/revocation status
- Gracefully handles cache service unavailability
- Distinguishes between revoked tokens and system errors
- Continues processing if revocation check fails (for resilience)

### User Context Setup

```typescript
req.body ??= {};

req.body.user = {
    id: payload.sub,
    jti: payload.jti,
};

next();
```

**Context Features:**

- Adds user ID and token JTI to request
- Ensures req.body exists before assignment
- Provides user context for downstream middleware and controllers
- Calls next() to continue request processing

## Usage Patterns

### Route-Level Protection

```typescript
import { Router } from "express";
import { container } from "@/di/container";
import { TYPES } from "@/di/types";

const router = Router();
const authGuard = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);

// Protect all routes in this router
router.use(authGuard.handle.bind(authGuard));

// All routes below will require authentication
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.delete("/account", userController.deleteAccount);
```

### Endpoint-Specific Protection

```typescript
// Protect specific endpoints
router.get("/public", publicController.getPublicData); // No auth required

router.get(
    "/private",
    authGuard.handle.bind(authGuard), // Auth required
    privateController.getPrivateData,
);
```

### Mixed Authentication Patterns

```typescript
// Some routes require auth, others don't
const publicRoutes = Router();
const protectedRoutes = Router();

// Public routes (no authentication)
publicRoutes.get("/status", statusController.getStatus);
publicRoutes.post("/register", authController.register);
publicRoutes.post("/login", authController.login);

// Protected routes (authentication required)
protectedRoutes.use(authGuard.handle.bind(authGuard));
protectedRoutes.get("/users", usersController.getAllUsers);
protectedRoutes.get("/users/:id", usersController.getUserById);

// Combine routers
router.use("/public", publicRoutes);
router.use("/protected", protectedRoutes);
```

## Integration with Authorization

```typescript
// Authentication → Authorization → Controller chain
router.delete(
    "/users/:id",
    // 1. Verify user is authenticated
    authGuard.handle.bind(authGuard),

    // 2. Check if user has required permissions
    authzMiddleware.requirePermissions(["users:delete"]),

    // 3. Process request
    usersController.deleteUser,
);
```

## Error Handling

### HTTP Status Codes

- **401 Unauthorized**: Missing, invalid, expired, or revoked tokens
- **500 Internal Server Error**: System errors during token processing

### Error Response Format

```typescript
// Standard error response structure
{
    success: false,
    data: null,
    message: "Descriptive error message"
}
```

### Error Scenarios

1. **Missing Token**:

    ```json
    {
        "success": false,
        "data": null,
        "message": "Unauthorized - Token required"
    }
    ```

2. **Invalid Token**:

    ```json
    {
        "success": false,
        "data": null,
        "message": "Unauthorized - Invalid token"
    }
    ```

3. **Revoked Token**:
    ```json
    {
        "success": false,
        "data": null,
        "message": "Unauthorized - Token revoked"
    }
    ```

## Testing

### Unit Test Structure

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
        } as jest.Mocked<ITokenRepository>;

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

    // Test cases...
});
```

### Test Cases

#### Missing Token

```typescript
it("should return 401 when no authorization header is provided", async () => {
    await middleware.handle(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: "Unauthorized - Token required",
    });
    expect(next).not.toHaveBeenCalled();
});
```

#### Invalid Token Format

```typescript
it("should return 401 when authorization header has invalid format", async () => {
    req.headers = { authorization: "InvalidFormat token" };

    await middleware.handle(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
});
```

#### Valid Token

```typescript
it("should set user context and call next for valid token", async () => {
    const mockPayload = {
        sub: "123",
        jti: "token_id_123",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
    };

    req.headers = { authorization: "Bearer valid_token" };
    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
    tokenRepo.isAccessTokenRevoked.mockResolvedValue(false);

    await middleware.handle(req as Request, res as Response, next);

    expect(req.body.user).toEqual({
        id: "123",
        jti: "token_id_123",
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
});
```

#### Revoked Token

```typescript
it("should return 401 for revoked token", async () => {
    const mockPayload = {
        sub: "123",
        jti: "revoked_token_id",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
    };

    req.headers = { authorization: "Bearer revoked_token" };
    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
    tokenRepo.isAccessTokenRevoked.mockResolvedValue(true);

    await middleware.handle(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: "Unauthorized - Token revoked",
    });
    expect(next).not.toHaveBeenCalled();
});
```

#### Revocation Check Failure

```typescript
it("should continue processing when revocation check fails", async () => {
    const mockPayload = {
        sub: "123",
        jti: "token_id",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
    };

    req.headers = { authorization: "Bearer valid_token" };
    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
    tokenRepo.isAccessTokenRevoked.mockRejectedValue(new Error("Cache unavailable"));

    await middleware.handle(req as Request, res as Response, next);

    expect(req.body.user).toEqual({
        id: "123",
        jti: "token_id",
    });
    expect(next).toHaveBeenCalled();
});
```

### Integration Testing

```typescript
describe("Authentication Integration", () => {
    let app: Express;

    beforeEach(() => {
        app = createTestApp();
    });

    it("should allow access with valid token", async () => {
        const token = jwt.sign({ sub: "123", jti: "test_token" }, JWT_SECRET, { expiresIn: "1h" });

        const response = await request(app)
            .get("/protected/profile")
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

        expect(response.body.success).toBe(true);
    });

    it("should deny access without token", async () => {
        const response = await request(app).get("/protected/profile").expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("Token required");
    });
});
```

## Security Considerations

### Token Security

1. **Secret Management**: Ensure JWT_SECRET is properly configured and secured
2. **Token Expiration**: Verify tokens have appropriate expiration times
3. **Signature Verification**: Always verify JWT signatures
4. **Payload Validation**: Validate required payload fields

### Revocation Handling

1. **Graceful Degradation**: Continue processing if revocation check fails
2. **Cache Performance**: Optimize revocation checks for performance
3. **Monitoring**: Log revocation check failures for monitoring
4. **Blacklist Management**: Maintain efficient token blacklists

### Error Information

1. **Generic Messages**: Don't expose sensitive information in error messages
2. **Consistent Responses**: Use consistent error response format
3. **Security Logging**: Log authentication failures for security monitoring
4. **Rate Limiting**: Combine with rate limiting for brute force protection

## Performance Optimization

### Caching Strategies

```typescript
// Cache token validation results temporarily
class AuthenticationGuardMiddleware {
    private tokenCache = new Map<
        string,
        {
            payload: JwtAccessPayload;
            timestamp: number;
        }
    >();

    private isCacheValid(timestamp: number): boolean {
        return Date.now() - timestamp < 30000; // 30 second cache
    }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        const token = req.headers.authorization?.split(" ")[1];

        // Check cache first
        const cached = this.tokenCache.get(token);
        if (cached && this.isCacheValid(cached.timestamp)) {
            req.body.user = {
                id: cached.payload.sub,
                jti: cached.payload.jti,
            };
            return next();
        }

        // Verify token and cache result
        const payload = jwt.verify(token, JWT_SECRET) as JwtAccessPayload;
        this.tokenCache.set(token, {
            payload,
            timestamp: Date.now(),
        });

        // Continue with normal processing...
    }
}
```

### Database Optimization

```typescript
// Optimize revocation checks
if (await this.tokenRepo.isAccessTokenRevoked(payload.jti)) {
    // Token is revoked, deny access
    return res.status(401).json({
        success: false,
        message: "Token revoked",
    });
}
```

## Best Practices

### Implementation

1. **Fail Fast**: Return early on authentication failures
2. **Clear Errors**: Provide clear, actionable error messages
3. **Graceful Degradation**: Handle service unavailability gracefully
4. **Security Logging**: Log security events for monitoring

### Integration

1. **Middleware Order**: Place authentication before authorization
2. **Route Organization**: Group authenticated routes logically
3. **Context Consistency**: Use consistent user context format
4. **Error Handling**: Handle errors at appropriate middleware level

### Testing

1. **Comprehensive Coverage**: Test all authentication scenarios
2. **Mock Dependencies**: Mock external services for unit tests
3. **Integration Tests**: Test with real JWT tokens
4. **Edge Cases**: Test malformed tokens and error conditions

## Related Documentation

- [Authorization Middleware Guide](./authorization-middleware.guide.md)
- [Authentication Service Guide](../services/authentication-service.guide.md)
- [Token Repository Guide](../repositories/token-repository.guide.md)
- [Middlewares Layer Guide](./middlewares.guide.md)
