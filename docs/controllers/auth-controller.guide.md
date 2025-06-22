# Authentication Controller Guide

## Overview

The `AuthController` handles all authentication-related HTTP endpoints including user registration, login, token refresh, logout, password reset, and email verification. It serves as the HTTP interface to the authentication service layer.

## Interface

```typescript
export interface IAuthController {
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    refresh(req: Request, res: Response): Promise<void>;
    revoke(req: Request, res: Response): Promise<void>;
    logout(req: Request, res: Response): Promise<void>;
    forgotPassword(req: Request, res: Response): Promise<void>;
    resetPassword(req: Request, res: Response): Promise<void>;
    verifyEmail(req: Request, res: Response): Promise<void>;
    resendVerificationEmail(req: Request, res: Response): Promise<void>;
}
```

## Dependencies

The controller depends on the authentication service:

```typescript
@injectable()
export default class AuthController implements IAuthController {
    constructor(
        @inject(TYPES.IAuthenticationService)
        private readonly authenticationService: IAuthenticationService,
    ) {}
}
```

## Core Endpoints

### User Registration

```typescript
public async register(req: Request, res: Response): Promise<void> {
    try {
        const user = await this.authenticationService.register(req.body.cleanBody.body);
        res.status(201).json({
            success: true,
            data: user
        });
    } catch (e) {
        res.status(409).json({
            success: false,
            message: "Email already in use"
        });
    }
}
```

**HTTP Details:**

- **Method**: POST
- **Path**: `/api/v1/auth/register`
- **Body**: `{ email: string, password: string }`
- **Success**: 201 Created with user data
- **Error**: 409 Conflict if email exists

**Request Example:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword"}'
```

**Response Example:**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "email": "user@example.com",
        "emailVerified": false
    }
}
```

### User Login

```typescript
public async login(req: Request, res: Response): Promise<void> {
    try {
        const { user, accessToken, refreshToken } = await this.authenticationService.login(
            req.body.cleanBody.body.email,
            req.body.cleanBody.body.password,
        );
        res.json({
            success: true,
            data: { user, accessToken, refreshToken }
        });
    } catch {
        res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }
}
```

**HTTP Details:**

- **Method**: POST
- **Path**: `/api/v1/auth/login`
- **Body**: `{ email: string, password: string }`
- **Success**: 200 OK with tokens and user data
- **Error**: 401 Unauthorized for invalid credentials

**Response Example:**

```json
{
    "success": true,
    "data": {
        "user": {
            "id": 1,
            "email": "user@example.com",
            "emailVerified": true
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

### Token Refresh

```typescript
public async refresh(req: Request, res: Response): Promise<void> {
    try {
        const { accessToken, refreshToken } = await this.authenticationService.refresh(
            req.body.refreshToken
        );
        res.json({
            success: true,
            data: { accessToken, refreshToken }
        });
    } catch {
        res.status(403).json({
            success: false,
            message: "Access denied"
        });
    }
}
```

**HTTP Details:**

- **Method**: POST
- **Path**: `/api/v1/auth/refresh`
- **Body**: `{ refreshToken: string }`
- **Success**: 200 OK with new token pair
- **Error**: 403 Forbidden for invalid/expired refresh token

### Token Revocation

```typescript
public async revoke(req: Request, res: Response): Promise<void> {
    const { jti } = (req as any).user;
    await this.authenticationService.revokeAccess(jti, 15 * 60);
    res.sendStatus(204);
}
```

**HTTP Details:**

- **Method**: POST
- **Path**: `/api/v1/auth/revoke`
- **Headers**: `Authorization: Bearer <access_token>`
- **Success**: 204 No Content
- **Authentication**: Required (Bearer token)

### User Logout

```typescript
public async logout(req: Request, res: Response): Promise<void> {
    const auth = req.headers.authorization;
    if (!auth) {
        res.status(403).json({
            success: false,
            message: "No authorization header"
        });
        return;
    }

    const [scheme, token] = auth.split(" ");
    if (scheme !== "Bearer") {
        res.status(403).json({
            success: false,
            message: "Invalid authorization scheme"
        });
        return;
    }

    const { jti, exp } = jwt.decode(token) as any;
    await this.authenticationService.logout(jti, exp, req.body.refreshToken);
    res.sendStatus(204);
}
```

**HTTP Details:**

- **Method**: POST
- **Path**: `/api/v1/auth/logout`
- **Headers**: `Authorization: Bearer <access_token>`
- **Body**: `{ refreshToken: string }`
- **Success**: 204 No Content
- **Authentication**: Required (Bearer token)

### Password Reset Request

```typescript
public async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
        await this.authenticationService.requestPasswordReset(req.body.email);
        res.sendStatus(204);
    } catch (e) {
        // Avoid email enumeration: always respond 204
        res.sendStatus(204);
    }
}
```

**HTTP Details:**

- **Method**: POST
- **Path**: `/api/v1/auth/forgot-password`
- **Body**: `{ email: string }`
- **Success**: 204 No Content (always, to prevent email enumeration)

**Security Note**: Always returns 204 regardless of whether the email exists to prevent email enumeration attacks.

### Password Reset

```typescript
public async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;
    try {
        await this.authenticationService.resetPassword(token, password);
        res.sendStatus(204);
    } catch {
        res.status(400).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}
```

**HTTP Details:**

- **Method**: POST
- **Path**: `/api/v1/auth/reset-password`
- **Body**: `{ token: string, password: string }`
- **Success**: 204 No Content
- **Error**: 400 Bad Request for invalid/expired token

### Email Verification

```typescript
public async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.body.cleanBody.body;
        await this.authenticationService.verifyEmail(token);
        res.json({
            success: true,
            message: "Email verified successfully"
        });
    } catch (error) {
        let message = "Email verification failed";

        if (error instanceof Error) {
            if (error.message === "InvalidOrExpiredToken") {
                message = "Invalid or expired verification token";
            } else if (error.message === "EmailAlreadyVerified") {
                message = "Email is already verified";
            }
        }

        res.status(400).json({ success: false, message });
    }
}
```

**HTTP Details:**

- **Method**: POST
- **Path**: `/api/v1/auth/verify-email`
- **Body**: `{ token: string }`
- **Success**: 200 OK with success message
- **Error**: 400 Bad Request with specific error message

### Resend Verification Email

```typescript
public async resendVerificationEmail(req: Request, res: Response): Promise<void> {
    try {
        const { email } = req.body.cleanBody.body;
        await this.authenticationService.resendVerificationEmail(email);
        res.json({
            success: true,
            message: "Verification email sent successfully"
        });
    } catch (error) {
        let message = "Failed to send verification email";
        let status = 400;

        if (error instanceof Error) {
            if (error.message === "UserNotFound") {
                message = "User not found";
                status = 404;
            } else if (error.message === "EmailAlreadyVerified") {
                message = "Email is already verified";
                status = 400;
            }
        }

        res.status(status).json({ success: false, message });
    }
}
```

**HTTP Details:**

- **Method**: POST
- **Path**: `/api/v1/auth/resend-verification`
- **Body**: `{ email: string }`
- **Success**: 200 OK with success message
- **Error**: 400/404 with specific error message

## Error Handling

### Standard Error Responses

```typescript
// Authentication failure
{
  "success": false,
  "message": "Invalid credentials"
}

// Authorization failure
{
  "success": false,
  "message": "Access denied"
}

// Validation failure
{
  "success": false,
  "message": "Invalid input data"
}

// Conflict (duplicate email)
{
  "success": false,
  "message": "Email already in use"
}
```

### Security-First Error Handling

```typescript
// Generic error handling to prevent information disclosure
catch (error) {
    console.error("Authentication error:", error); // Log for debugging

    // Return generic message to prevent enumeration
    res.status(401).json({
        success: false,
        message: "Invalid credentials"
    });
}
```

## Request/Response Validation

### Input Validation

```typescript
// Controllers rely on validation middleware
async register(req: Request, res: Response): Promise<void> {
    try {
        // Validation middleware populates req.body.cleanBody.body
        const userData = req.body.cleanBody.body as CreateUserDto;
        const user = await this.authenticationService.register(userData);

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        this.handleAuthError(error, res);
    }
}
```

### Expected Input Schemas

```typescript
// Registration schema
interface RegisterDto {
    email: string; // Valid email format
    password: string; // Minimum 8 characters
}

// Login schema
interface LoginDto {
    email: string; // Valid email format
    password: string; // User's password
}

// Refresh schema
interface RefreshDto {
    refreshToken: string; // Valid JWT refresh token
}

// Email verification schema
interface VerifyEmailDto {
    token: string; // Verification token from email
}
```

## Security Features

### Token Handling

```typescript
// Extract and validate JWT tokens
public async logout(req: Request, res: Response): Promise<void> {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
        res.status(403).json({
            success: false,
            message: "Invalid authorization header"
        });
        return;
    }

    const token = auth.split(" ")[1];
    const { jti, exp } = jwt.decode(token) as any;

    await this.authenticationService.logout(jti, exp, req.body.refreshToken);
    res.sendStatus(204);
}
```

### Rate Limiting Integration

```typescript
// Controllers work with rate limiting middleware
// Example middleware application in routes:
router.post(
    "/login",
    loginRateLimit, // Rate limiting middleware
    validationMiddleware, // Input validation
    authController.login, // Controller method
);
```

### CORS and Security Headers

```typescript
// Security headers are handled by middleware
// Controllers focus on authentication logic
public async login(req: Request, res: Response): Promise<void> {
    // Authentication logic only
    // Security headers added by middleware
}
```

## Testing

### Unit Testing Pattern

```typescript
describe("AuthController", () => {
    let mockAuthService: jest.Mocked<IAuthenticationService>;
    let authController: AuthController;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        mockAuthService = {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            verifyEmail: jest.fn(),
            resendVerificationEmail: jest.fn(),
        };

        authController = new AuthController(mockAuthService);

        req = {
            body: { cleanBody: { body: {} } },
            headers: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            sendStatus: jest.fn(),
        };
    });

    describe("register", () => {
        it("should register user successfully", async () => {
            const userData = { email: "test@example.com", password: "password123" };
            const mockUser = { id: 1, email: "test@example.com", emailVerified: false };

            req.body.cleanBody.body = userData;
            mockAuthService.register.mockResolvedValue(mockUser);

            await authController.register(req as Request, res as Response);

            expect(mockAuthService.register).toHaveBeenCalledWith(userData);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockUser,
            });
        });

        it("should handle duplicate email error", async () => {
            req.body.cleanBody.body = { email: "existing@example.com", password: "password123" };
            mockAuthService.register.mockRejectedValue(new Error("UserExists"));

            await authController.register(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Email already in use",
            });
        });
    });
});
```

### Integration Testing

```typescript
describe("AuthController Integration", () => {
    let app: Express;
    let authService: IAuthenticationService;

    beforeEach(async () => {
        app = createTestApp();
        authService = container.get<IAuthenticationService>(TYPES.IAuthenticationService);
        await cleanDatabase();
    });

    it("should handle complete registration flow", async () => {
        const userData = {
            email: "integration@test.com",
            password: "testpassword123",
        };

        const response = await request(app).post("/api/v1/auth/register").send(userData).expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe(userData.email);
        expect(response.body.data.emailVerified).toBe(false);
    });
});
```

## Route Integration

### Route Definition

```typescript
// In routes/authentication.route.ts
import { Router } from "express";
import { container } from "@/di/container";
import { TYPES } from "@/di/types";

const router = Router();
const authController = container.get<IAuthController>(TYPES.IAuthController);

// Public routes
router.post("/register", validationMiddleware(createUserSchema), authController.register.bind(authController));

router.post("/login", loginRateLimit, validationMiddleware(loginSchema), authController.login.bind(authController));

// Protected routes
router.post("/logout", authenticationGuard, authController.logout.bind(authController));

export default router;
```

### Middleware Integration

- **Validation Middleware**: Validates and sanitizes input data
- **Rate Limiting**: Prevents brute force attacks on login endpoints
- **Authentication Guard**: Validates JWT tokens for protected endpoints
- **CORS**: Handles cross-origin requests

## Best Practices

### Security

1. **Input Validation**: Always validate input through middleware
2. **Error Handling**: Use generic error messages to prevent information disclosure
3. **Token Security**: Properly handle JWT tokens and validate authorization headers
4. **Rate Limiting**: Implement rate limiting for authentication endpoints
5. **Logging**: Log authentication events for security monitoring

### Performance

1. **Efficient Token Handling**: Minimize JWT decode operations
2. **Response Optimization**: Return only necessary data in responses
3. **Error Caching**: Cache error responses to reduce processing overhead
4. **Connection Reuse**: Let services handle connection pooling

### Reliability

1. **Graceful Error Handling**: Handle service failures gracefully
2. **Consistent Responses**: Use standardized response format
3. **Status Code Accuracy**: Use appropriate HTTP status codes
4. **Resource Cleanup**: Ensure proper cleanup in logout operations

## Related Documentation

- [Authentication Service Guide](../services/authentication-service.guide.md)
- [Users Controller Guide](./users-controller.guide.md)
- [Authentication Middleware Guide](../middlewares/authentication-middleware.guide.md)
- [Validation Middleware Guide](../middlewares/validation-middleware.guide.md)
