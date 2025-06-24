# Refresh Token Guard Middleware Guide

## Overview

The `RefreshTokenGuardMiddleware` ensures refresh token cookies are present and valid before allowing access to the `/refresh` endpoint. It verifies the JWT refresh token, checks its status in the token repository, and populates request context for downstream handlers.

## Architecture

### Core Responsibilities

1. **Cookie Extraction**: Read the `refreshToken` cookie from incoming requests.
2. **JWT Validation**: Verify the token signature and payload with `jwt.verify` using `JWT_REFRESH_SECRET`.
3. **Repository Check**: Confirm the token is valid via `ITokenRepository`.
4. **Request Context Setup**: Populate `req.body.refreshToken` and `req.body.user` for the controller.
5. **Error Responses**: Return `401 Unauthorized` when the cookie is missing or invalid.

### Dependencies

- **ITokenRepository**: Determines refresh token validity
- **ILoggerService**: Logs verification errors
- **jsonwebtoken**: Decodes and verifies JWT tokens

## Implementation

### Setup & Configuration

Bind the middleware in the DI container using `TYPES.IRefreshTokenGuardMiddleware`:

```typescript
container.bind<IMiddleware>(TYPES.IRefreshTokenGuardMiddleware).to(RefreshTokenGuardMiddleware);
```

### Workflow

1. Check for the `refreshToken` cookie.
2. Verify and decode the token.
3. Validate the token via the repository.
4. Attach token and user info to `req.body`.
5. Call `next()` to continue.

### Error Handling

- Missing or invalid tokens respond with `401` and a descriptive message.
- Verification and repository errors are logged via `ILoggerService`.

### Integration

Apply this middleware before the rate limiter on the refresh route:

```typescript
authenticationRoute.post(
    "/refresh",
    refreshTokenGuardMiddleware.handle.bind(refreshTokenGuardMiddleware),
    refreshRateLimiter.handle.bind(refreshRateLimiter),
    authController.refresh.bind(authController),
);
```

### Testing

- Unit tests cover cases for missing cookies, invalid tokens, repository failures, and successful validation.

## Related Documentation

- [Authentication Middleware Guide](./authentication-middleware.guide.md)
- [Rate Limiting Middleware Guide](./rate-limiting-middleware.guide.md)
- [Token Repository Guide](../repositories/token-repository.guide.md)
- [Middlewares Layer Guide](./middlewares.guide.md)
- [Authentication Routes Guide](../routes/authentication-routes.guide.md)
