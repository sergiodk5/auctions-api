# Authentication Routes Guide

## Overview

Authentication routes handle user authentication, registration, password management, and email verification. These routes are public or require minimal authentication, serving as the entry point for users into the protected areas of the API.

## Route Structure

### Authentication Router Setup

```typescript
// src/routes/authentication.route.ts
import { IAuthController } from "@/controllers/auth.controller";
import {
    authLoginRouteSchema,
    emailVerificationRouteSchema,
    forgotPasswordRouteSchema,
    registerRouteSchema,
    resetPasswordRouteSchema,
} from "@/db/user-validation.schema";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";

const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const refreshRateLimiter = container.get<IMiddleware>(TYPES.IRefreshRateLimiter);
const loginRateLimiter = container.get<IMiddleware>(TYPES.ILoginRateLimiter);
const authController = container.get<IAuthController>(TYPES.IAuthController);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);

const authenticationRoute = Router();
```

## Authentication Endpoints

### User Registration

```typescript
// POST /api/v1/auth/register
authenticationRoute.post(
    "/register",
    validationMiddleware.validate(registerRouteSchema),
    authController.register.bind(authController),
);
```

**Purpose**: Create new user account
**Authentication**: None required (public endpoint)
**Validation**: `registerRouteSchema`
**Rate Limiting**: None (consider adding for production)

**Request Body**:

```typescript
{
    email: string; // Valid email address
    password: string; // Strong password
    firstName: string; // User's first name
    lastName: string; // User's last name
}
```

**Response**:

```typescript
// Success (201 Created)
{
    success: true,
    message: "User registered successfully",
    data: {
        id: number,
        email: string,
        firstName: string,
        lastName: string,
        emailVerified: false
    }
}

// Error (400 Bad Request)
{
    success: false,
    message: "Email already exists"
}
```

### User Login

```typescript
// POST /api/v1/auth/login
authenticationRoute.post(
    "/login",
    loginRateLimiter.handle.bind(loginRateLimiter),
    validationMiddleware.validate(authLoginRouteSchema),
    authController.login.bind(authController),
);
```

**Purpose**: Authenticate user and issue tokens
**Authentication**: None required (public endpoint)
**Validation**: `authLoginRouteSchema`
**Rate Limiting**: `loginRateLimiter` (5 attempts per minute per IP)

**Request Body**:

```typescript
{
    email: string; // User's email
    password: string; // User's password
}
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Login successful",
    data: {
        user: {
            id: number,
            email: string,
            firstName: string,
            lastName: string,
            emailVerified: boolean
        },
        accessToken: string,   // JWT access token
        refreshToken: string   // JWT refresh token
    }
}

// Error (401 Unauthorized)
{
    success: false,
    message: "Invalid credentials"
}
```

### Token Refresh

```typescript
// POST /api/v1/auth/refresh
authenticationRoute.post(
    "/refresh",
    refreshRateLimiter.handle.bind(refreshRateLimiter),
    authController.refresh.bind(authController),
);
```

**Purpose**: Refresh access token using refresh token
**Authentication**: Refresh token in request body
**Validation**: None (handled by controller)
**Rate Limiting**: `refreshRateLimiter` (20 attempts per minute per user/IP)

**Request Body**:

```typescript
{
    refreshToken: string; // Valid refresh token
}
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Token refreshed successfully",
    data: {
        accessToken: string,   // New JWT access token
        refreshToken: string   // New JWT refresh token
    }
}

// Error (401 Unauthorized)
{
    success: false,
    message: "Invalid refresh token"
}
```

### Token Revocation

```typescript
// POST /api/v1/auth/revoke
authenticationRoute.post(
    "/revoke",
    authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware),
    authController.revoke.bind(authController),
);
```

**Purpose**: Revoke specific access token
**Authentication**: Valid access token required
**Validation**: None
**Rate Limiting**: None

**Request**: No body required (token from Authorization header)

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Token revoked successfully"
}
```

### User Logout

```typescript
// POST /api/v1/auth/logout
authenticationRoute.post(
    "/logout",
    authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware),
    authController.logout.bind(authController),
);
```

**Purpose**: Logout user and revoke all tokens
**Authentication**: Valid access token required
**Validation**: None
**Rate Limiting**: None

**Request**: No body required (token from Authorization header)

**Response**:

```typescript
// Success (204 No Content)
// No response body
```

### Password Reset Request

```typescript
// POST /api/v1/auth/forgot-password
authenticationRoute.post(
    "/forgot-password",
    validationMiddleware.validate(forgotPasswordRouteSchema),
    authController.forgotPassword.bind(authController),
);
```

**Purpose**: Request password reset email
**Authentication**: None required (public endpoint)
**Validation**: `forgotPasswordRouteSchema`
**Rate Limiting**: None (consider adding for production)

**Request Body**:

```typescript
{
    email: string; // User's email address
}
```

**Response**:

```typescript
// Success (200 OK) - Always returns success for security
{
    success: true,
    message: "If email exists, password reset instructions have been sent"
}
```

### Password Reset

```typescript
// POST /api/v1/auth/reset-password
authenticationRoute.post(
    "/reset-password",
    validationMiddleware.validate(resetPasswordRouteSchema),
    authController.resetPassword.bind(authController),
);
```

**Purpose**: Reset password using reset token
**Authentication**: None required (uses reset token)
**Validation**: `resetPasswordRouteSchema`
**Rate Limiting**: None

**Request Body**:

```typescript
{
    token: string; // Password reset token from email
    newPassword: string; // New password
}
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Password reset successfully"
}

// Error (400 Bad Request)
{
    success: false,
    message: "Invalid or expired reset token"
}
```

### Email Verification

```typescript
// POST /api/v1/auth/verify-email
authenticationRoute.post(
    "/verify-email",
    validationMiddleware.validate(emailVerificationRouteSchema),
    authController.verifyEmail.bind(authController),
);
```

**Purpose**: Verify user's email address
**Authentication**: None required (uses verification token)
**Validation**: `emailVerificationRouteSchema`
**Rate Limiting**: None

**Request Body**:

```typescript
{
    token: string; // Email verification token from email
}
```

**Response**:

```typescript
// Success (200 OK)
{
    success: true,
    message: "Email verified successfully"
}

// Error (400 Bad Request)
{
    success: false,
    message: "Invalid or expired verification token"
}
```

### Resend Email Verification

```typescript
// POST /api/v1/auth/resend-verification
authenticationRoute.post(
    "/resend-verification",
    validationMiddleware.validate(forgotPasswordRouteSchema),
    authController.resendVerificationEmail.bind(authController),
);
```

**Purpose**: Resend email verification link
**Authentication**: None required (public endpoint)
**Validation**: `forgotPasswordRouteSchema` (reused for email validation)
**Rate Limiting**: None (consider adding for production)

**Request Body**:

```typescript
{
    email: string; // User's email address
}
```

**Response**:

```typescript
// Success (200 OK) - Always returns success for security
{
    success: true,
    message: "If email exists and is unverified, verification email has been sent"
}
```

## Validation Schemas

### Registration Schema

```typescript
export const registerRouteSchema = z.object({
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

### Login Schema

```typescript
export const authLoginRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
    }),
    params: z.object({}),
    query: z.object({}),
});
```

### Password Reset Schemas

```typescript
export const forgotPasswordRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
    }),
    params: z.object({}),
    query: z.object({}),
});

export const resetPasswordRouteSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Reset token is required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }),
    params: z.object({}),
    query: z.object({}),
});
```

### Email Verification Schema

```typescript
export const emailVerificationRouteSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Verification token is required"),
    }),
    params: z.object({}),
    query: z.object({}),
});
```

## Rate Limiting Strategy

### Login Rate Limiting

```typescript
// 5 attempts per minute per IP
const loginRateLimiter = new LoginRateLimiter({
    storeClient: cacheService.client,
    keyPrefix: "rl_login",
    points: 5,
    duration: 60,
    blockDuration: 300, // 5 minutes block
});
```

### Refresh Rate Limiting

```typescript
// 20 attempts per minute per user/IP
const refreshRateLimiter = new RefreshRateLimiter({
    storeClient: cacheService.client,
    keyPrefix: "rl_refresh",
    points: 20,
    duration: 60,
});
```

## Security Considerations

### Authentication Flow Security

1. **Password Hashing**: All passwords are hashed using bcrypt before storage
2. **JWT Security**: Access tokens have short expiration (15 minutes), refresh tokens longer (7 days)
3. **Token Revocation**: Tokens can be revoked and are checked against revocation list
4. **Rate Limiting**: Login attempts are limited to prevent brute force attacks

### Data Protection

1. **Input Validation**: All inputs are validated using Zod schemas
2. **SQL Injection Prevention**: Using Drizzle ORM prevents SQL injection
3. **Information Disclosure**: Error messages don't reveal sensitive information
4. **HTTPS Only**: Production should enforce HTTPS for all authentication routes

### Email Security

1. **Email Verification**: Users must verify email addresses before full access
2. **Password Reset**: Reset tokens are time-limited and single-use
3. **Rate Limiting**: Consider adding rate limiting to email-sending endpoints

## Error Handling

### Common Error Responses

```typescript
// Validation Error (400)
{
    success: false,
    message: "Validation failed",
    errors: [
        { field: "email", message: "Invalid email format" }
    ]
}

// Authentication Error (401)
{
    success: false,
    message: "Invalid credentials"
}

// Rate Limit Error (429)
{
    success: false,
    message: "Too many login requests, please wait."
}

// Server Error (500)
{
    success: false,
    message: "Internal server error"
}
```

## Testing Authentication Routes

### Test Structure

```typescript
describe("Authentication Routes", () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    describe("POST /api/v1/auth/register", () => {
        it("should register new user with valid data", async () => {
            const userData = {
                email: "test@example.com",
                password: "SecurePassword123!",
                firstName: "Test",
                lastName: "User",
            };

            const response = await request(app).post("/api/v1/auth/register").send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe(userData.email);
            expect(response.body.data).not.toHaveProperty("password");
        });

        it("should reject registration with existing email", async () => {
            // Create user first
            await createTestUser({ email: "test@example.com" });

            const userData = {
                email: "test@example.com",
                password: "SecurePassword123!",
                firstName: "Test",
                lastName: "User",
            };

            const response = await request(app).post("/api/v1/auth/register").send(userData);

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/v1/auth/login", () => {
        it("should login with valid credentials", async () => {
            const password = "SecurePassword123!";
            const user = await createTestUser({
                email: "test@example.com",
                password: await hashPassword(password),
            });

            const response = await request(app).post("/api/v1/auth/login").send({
                email: user.email,
                password: password,
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        it("should reject invalid credentials", async () => {
            const response = await request(app).post("/api/v1/auth/login").send({
                email: "nonexistent@example.com",
                password: "wrongpassword",
            });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
});
```

### Test Helpers

```typescript
// Helper functions for authentication testing
export async function createTestUser(userData: Partial<User>): Promise<User> {
    // Create test user with default values
}

export async function loginTestUser(
    email: string,
    password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
    // Login user and return tokens
}

export async function getAuthHeaders(token: string): Promise<{ Authorization: string }> {
    return { Authorization: `Bearer ${token}` };
}
```

## Best Practices

### Route Design

1. **Clear Endpoints**: Use descriptive endpoint names that indicate their purpose
2. **Consistent Responses**: Maintain consistent response structure across all endpoints
3. **Appropriate HTTP Methods**: Use POST for all authentication operations (even logout)
4. **Rate Limiting**: Apply rate limiting to prevent abuse

### Security

1. **Validate All Input**: Use validation middleware for all request bodies
2. **Limit Sensitive Information**: Don't expose internal error details
3. **Secure Token Handling**: Implement proper token expiration and revocation
4. **Email Verification**: Require email verification for enhanced security

### User Experience

1. **Clear Error Messages**: Provide helpful error messages without exposing security details
2. **Consistent Behavior**: Password reset and resend verification should always return success
3. **Token Management**: Provide clear token refresh mechanisms

## Related Documentation

- [Authentication Controller Guide](../controllers/auth-controller.guide.md)
- [Authentication Service Guide](../services/authentication-service.guide.md)
- [Authentication Middleware Guide](../middlewares/authentication-middleware.guide.md)
- [User Validation Schemas Guide](../db/users-schema.guide.md)
- [Rate Limiting Guide](../middlewares/rate-limiting-middleware.guide.md)
