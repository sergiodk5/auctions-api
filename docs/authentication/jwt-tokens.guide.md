# JWT Tokens Guide

## Overview

The Auctions API uses JSON Web Tokens (JWT) for authentication and authorization. This guide covers token structure, usage patterns, security features, and implementation details.

## Token Types

### Access Tokens

**Purpose**: Short-lived tokens for API authentication
**Lifetime**: 15 minutes
**Usage**: Sent in `Authorization: Bearer <token>` header

**Payload Structure**:

```json
{
    "sub": "123", // User ID (string)
    "jti": "uuid-v4", // Token ID for revocation
    "iat": 1640995200, // Issued at timestamp
    "exp": 1640996100 // Expiration timestamp
}
```

**Environment Variables**:

- `JWT_SECRET`: Secret key for signing access tokens
- `ACCESS_TOKEN_LIFETIME`: Token expiration time (default: "15m")

### Refresh Tokens

**Purpose**: Long-lived tokens for obtaining new access tokens
**Lifetime**: 7 days
**Usage**: Sent in request body or secure HTTP-only cookie

**Payload Structure**:

```json
{
    "sub": "123", // User ID (string)
    "jti": "uuid-v4", // Token ID
    "family_id": "uuid-v4", // Token family for rotation security
    "iat": 1640995200, // Issued at timestamp
    "exp": 1641600000 // Expiration timestamp
}
```

**Environment Variables**:

- `JWT_REFRESH_SECRET`: Secret key for signing refresh tokens
- `REFRESH_TOKEN_LIFETIME`: Token expiration time (default: "7d")

### Reset Tokens

**Purpose**: Tokens for password reset functionality
**Lifetime**: 30 minutes
**Usage**: Sent in password reset request body

**Environment Variables**:

- `JWT_RESET_SECRET`: Secret key for signing reset tokens
- `RESET_TOKEN_LIFETIME`: Token expiration time (default: "30m")

## Authentication Flow

### 1. User Login

```bash
curl -X POST http://localhost:8090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

**Response**:

```json
{
    "success": true,
    "data": {
        "user": {
            "id": 123,
            "email": "user@example.com",
            "emailVerified": true
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

### 2. Using Access Tokens

```bash
curl -X GET http://localhost:8090/api/v1/users/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Token Refresh

```bash
curl -X POST http://localhost:8090/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response**:

```json
{
    "success": true,
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

## Security Features

### Token Rotation

- **Refresh Token Rotation**: Each refresh operation generates a new token pair
- **Family ID Tracking**: All tokens in a rotation family share the same `family_id`
- **Reuse Detection**: If an old refresh token is reused, the entire family is revoked

### Token Revocation

- **Access Token Blacklisting**: Revoked tokens are stored in Redis cache
- **Immediate Invalidation**: Revoked tokens are rejected on next API call
- **TTL Management**: Revoked tokens expire from cache when original token would expire

### Logout Process

1. Extract JTI and expiration from access token
2. Add access token to revocation blacklist
3. Revoke refresh token family in database
4. Return success response

## Error Responses

### Authentication Errors

**401 Unauthorized - Missing Token**:

```json
{
    "success": false,
    "data": null,
    "message": "Unauthorized - Token required"
}
```

**401 Unauthorized - Invalid Token**:

```json
{
    "success": false,
    "data": null,
    "message": "Unauthorized - Invalid token"
}
```

**401 Unauthorized - Expired Token**:

```json
{
    "success": false,
    "data": null,
    "message": "Unauthorized - Token expired"
}
```

**401 Unauthorized - Revoked Token**:

```json
{
    "success": false,
    "data": null,
    "message": "Unauthorized - Token revoked"
}
```

### Refresh Token Errors

**403 Forbidden - Invalid Refresh Token**:

```json
{
    "success": false,
    "data": null,
    "message": "Access denied"
}
```

**403 Forbidden - Refresh Token Reuse**:

```json
{
    "success": false,
    "data": null,
    "message": "Access denied"
}
```

## Implementation Details

### Token Generation

```typescript
// Access Token
const accessToken = jwt.sign({ sub: user.id.toString(), jti }, JWT_SECRET, { expiresIn: ACCESS_LIFETIME });

// Refresh Token
const refreshToken = jwt.sign({ sub: user.id.toString(), jti, family_id: familyId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_LIFETIME,
});
```

### Token Verification

```typescript
// Verify Access Token
const payload = jwt.verify(token, JWT_SECRET) as JwtAccessPayload;

// Check Revocation
const isRevoked = await tokenRepository.isAccessTokenRevoked(payload.jti);
if (isRevoked) {
    throw new Error("Token revoked");
}
```

### Middleware Integration

```typescript
// Authentication Guard
const token = req.headers.authorization?.split(" ")[1];
if (!token) {
    return res.status(401).json({
        success: false,
        message: "Unauthorized - Token required",
    });
}

// Add user context to request
req.body.user = {
    id: payload.sub,
    jti: payload.jti,
};
```

## Best Practices

### Client Implementation

1. **Store Tokens Securely**: Use secure storage (HttpOnly cookies, encrypted localStorage)
2. **Handle Expiration**: Implement automatic token refresh
3. **Clear on Logout**: Remove all tokens when user logs out
4. **Error Handling**: Gracefully handle authentication errors

### Server Configuration

1. **Strong Secrets**: Use cryptographically strong JWT secrets
2. **Short Access Tokens**: Keep access token lifetime short (15 minutes)
3. **Proper Revocation**: Implement comprehensive token revocation
4. **Rate Limiting**: Apply rate limits to auth endpoints

### Security Considerations

1. **HTTPS Only**: Never send tokens over HTTP in production
2. **Secure Headers**: Use appropriate security headers
3. **Token Validation**: Always validate tokens server-side
4. **Audit Logging**: Log authentication events for security monitoring

## Testing

### Unit Tests

```typescript
describe("JWT Token Service", () => {
    test("should generate valid access token", () => {
        const token = generateAccessToken(userId, jti);
        const payload = jwt.verify(token, JWT_SECRET);
        expect(payload.sub).toBe(userId);
    });

    test("should detect revoked tokens", async () => {
        await revokeToken(jti);
        const isRevoked = await isTokenRevoked(jti);
        expect(isRevoked).toBe(true);
    });
});
```

### Integration Tests

```typescript
describe("Authentication Flow", () => {
    test("should complete login flow", async () => {
        const response = await request(app).post("/api/v1/auth/login").send({ email, password });

        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();
    });
});
```

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_RESET_SECRET=your-super-secret-reset-key

# Token Lifetimes
ACCESS_TOKEN_LIFETIME=15m
REFRESH_TOKEN_LIFETIME=7d
RESET_TOKEN_LIFETIME=30m

# Security
BCRYPT_ROUNDS=12
```

### Production Recommendations

1. **Rotate Secrets**: Regularly rotate JWT secrets
2. **Monitor Usage**: Track token usage patterns
3. **Implement Logging**: Log all authentication events
4. **Use Redis**: Use Redis for token revocation cache
5. **Health Checks**: Monitor authentication service health
