# Authentication Service Guide

## Overview

The `AuthenticationService` handles user authentication, registration, token management, and email verification. It's a core service that manages the entire authentication flow including JWT token generation, refresh token management, and user session control.

## Interface

```typescript
export interface IAuthenticationService {
    register(data: CreateUserDto): Promise<User>;
    login(email: string, password: string): Promise<AuthLoginDto>;
    refresh(refreshToken: string): Promise<AuthTokensDto>;
    revokeAccess(jti: string, ttl: number): Promise<void>;
    logout(accessJti: string, accessExp: number, refreshToken: string): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    resendVerificationEmail(email: string): Promise<void>;
}
```

## Dependencies

The service depends on several repositories and services:

```typescript
@injectable()
export default class AuthenticationService {
    constructor(
        @inject(TYPES.IUserRepository) private readonly userRepo: IUserRepository,
        @inject(TYPES.ITokenRepository) private readonly tokenRepo: ITokenRepository,
        @inject(TYPES.IEmailVerificationRepository)
        private readonly emailVerificationRepo: IEmailVerificationRepository,
        @inject(TYPES.ICacheService) private cacheSvc: ICacheService,
        @inject(TYPES.IMailerService) private mailer: IMailerService,
    ) {}
}
```

## Core Operations

### User Registration

```typescript
public async register(data: CreateUserDto): Promise<User> {
    // 1. Check if user already exists
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new Error("UserExists");

    // 2. Create user account
    const user = await this.userRepo.create(data);

    // 3. Generate and send verification email
    await this.generateAndSendVerificationEmail(user.id, user.email);

    return user;
}
```

**Key Features:**

- Validates email uniqueness
- Creates user with hashed password
- Generates email verification token
- Sends welcome email with verification link

### User Login

```typescript
public async login(email: string, password: string): Promise<AuthLoginDto> {
    // 1. Validate credentials
    const user = await this.userRepo.findByEmail(email);
    if (!user?.password || !(await comparePassword(password, user?.password))) {
        throw new Error("AuthFailed");
    }

    // 2. Generate token family and JWT ID
    const familyId = uuidv4();
    const jti = uuidv4();

    // 3. Create access and refresh tokens
    const accessToken = this.createAccessToken(user, jti);
    const refreshToken = this.createRefreshToken(user, familyId);

    // 4. Store refresh token in database
    await this.tokenRepo.create({
        user_id: user.id,
        family_id: familyId,
        token: refreshToken,
    });

    return {
        user,
        accessToken,
        refreshToken,
    };
}
```

**Key Features:**

- Validates email and password
- Generates UUID-based token family for refresh token rotation
- Creates JWT access token with user claims and JTI
- Stores refresh token in database for validation
- Returns complete authentication payload

### Token Refresh

```typescript
public async refresh(refreshToken: string): Promise<AuthTokensDto> {
    // 1. Verify and decode refresh token
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtRefreshPayload;

    // 2. Validate token exists in database
    const tokenRecord = await this.tokenRepo.findByFamilyId(payload.familyId);
    if (!tokenRecord || tokenRecord.token !== refreshToken) {
        throw new Error("InvalidRefreshToken");
    }

    // 3. Check for token reuse (security)
    if (tokenRecord.revoked_at) {
        await this.tokenRepo.revokeFamily(payload.familyId);
        throw new Error("RefreshTokenReused");
    }

    // 4. Generate new token pair
    const newFamilyId = uuidv4();
    const newJti = uuidv4();
    const newAccessToken = this.createAccessToken(tokenRecord.user, newJti);
    const newRefreshToken = this.createRefreshToken(tokenRecord.user, newFamilyId);

    // 5. Rotate tokens (revoke old, create new)
    await this.tokenRepo.revokeToken(tokenRecord.id);
    await this.tokenRepo.create({
        user_id: tokenRecord.user_id,
        family_id: newFamilyId,
        token: newRefreshToken,
    });

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
}
```

**Key Features:**

- Implements refresh token rotation for security
- Detects and prevents token reuse attacks
- Generates new token family for each refresh
- Maintains user session continuity

### Email Verification

```typescript
public async verifyEmail(token: string): Promise<void> {
    // 1. Find verification record
    const verification = await this.emailVerificationRepo.findByToken(token);
    if (!verification) {
        throw new Error("InvalidVerificationToken");
    }

    // 2. Check token expiration
    const isExpired = verification.expires_at < new Date();
    if (isExpired) {
        await this.emailVerificationRepo.deleteByToken(token);
        throw new Error("VerificationTokenExpired");
    }

    // 3. Mark email as verified
    await this.userRepo.markEmailAsVerified(verification.user_id);

    // 4. Clean up verification token
    await this.emailVerificationRepo.deleteByToken(token);
}
```

### Logout & Token Revocation

```typescript
public async logout(accessJti: string, accessExp: number, refreshToken: string): Promise<void> {
    // 1. Revoke access token (cache for remaining TTL)
    await this.revokeAccess(accessJti, accessExp);

    // 2. Revoke refresh token
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtRefreshPayload;
    await this.tokenRepo.revokeFamily(payload.familyId);
}

public async revokeAccess(jti: string, ttl: number): Promise<void> {
    // Cache revoked JTI for remaining token lifetime
    await this.cacheSvc.client.setEx(`revoked:${jti}`, ttl, "true");
}
```

## Token Management

### Access Token Structure

```typescript
private createAccessToken(user: User, jti: string): string {
    return jwt.sign(
        {
            sub: user.id.toString(),
            email: user.email,
            jti,
            emailVerified: user.emailVerified,
        },
        JWT_SECRET,
        { expiresIn: ACCESS_LIFETIME }
    );
}
```

**Access Token Claims:**

- `sub`: User ID (subject)
- `email`: User email address
- `jti`: JWT ID for revocation tracking
- `emailVerified`: Email verification status
- `exp`: Expiration timestamp (automatic)
- `iat`: Issued at timestamp (automatic)

### Refresh Token Structure

```typescript
private createRefreshToken(user: User, familyId: string): string {
    return jwt.sign(
        {
            sub: user.id.toString(),
            familyId,
            type: "refresh",
        },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_IDLE_TTL }
    );
}
```

**Refresh Token Claims:**

- `sub`: User ID (subject)
- `familyId`: Token family identifier for rotation
- `type`: Token type identifier
- `exp`: Expiration timestamp (automatic)

## Security Features

### Refresh Token Rotation

- Each refresh generates a completely new token pair
- Old refresh tokens are immediately revoked
- Token families prevent token reuse attacks
- Failed rotation attempts revoke entire token family

### Access Token Revocation

- Revoked tokens are cached in Redis
- Authentication middleware checks revocation status
- Tokens remain revoked until natural expiration

### Password Security

```typescript
// Uses bcrypt with proper salt rounds
const hashedPassword = await hashPassword(plainPassword);
const isValid = await comparePassword(plainPassword, hashedPassword);
```

### Email Verification

- Secure random token generation (32 bytes)
- Configurable expiration time
- Automatic cleanup of expired tokens
- Rate limiting on resend requests

## Error Handling

### Authentication Errors

```typescript
// Registration errors
throw new Error("UserExists"); // Email already registered

// Login errors
throw new Error("AuthFailed"); // Invalid credentials

// Token errors
throw new Error("InvalidRefreshToken"); // Invalid or expired refresh token
throw new Error("RefreshTokenReused"); // Token reuse detected

// Email verification errors
throw new Error("InvalidVerificationToken"); // Invalid token
throw new Error("VerificationTokenExpired"); // Expired token
throw new Error("EmailAlreadyVerified"); // Already verified
```

### Error Recovery

- **Failed Login**: Return generic "AuthFailed" to prevent enumeration
- **Token Reuse**: Revoke entire token family for security
- **Expired Verification**: Allow resending new verification email

## Usage Examples

### Controller Integration

```typescript
@injectable()
export default class AuthController implements IAuthController {
    constructor(
        @inject(TYPES.IAuthenticationService)
        private readonly authService: IAuthenticationService,
    ) {}

    async register(req: Request, res: Response): Promise<void> {
        try {
            const user = await this.authService.register(req.body);
            res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: { user },
            });
        } catch (error) {
            if (error.message === "UserExists") {
                res.status(409).json({
                    success: false,
                    message: "Email already registered",
                });
                return;
            }
            throw error; // Let error middleware handle
        }
    }
}
```

### Testing

```typescript
describe("AuthenticationService", () => {
    let authService: AuthenticationService;
    let mockUserRepo: jest.Mocked<IUserRepository>;
    let mockTokenRepo: jest.Mocked<ITokenRepository>;

    beforeEach(() => {
        mockUserRepo = {
            findByEmail: jest.fn(),
            create: jest.fn(),
            markEmailAsVerified: jest.fn(),
        };

        authService = new AuthenticationService(
            mockUserRepo,
            mockTokenRepo,
            mockEmailVerificationRepo,
            mockCacheService,
            mockMailerService,
        );
    });

    it("should register user successfully", async () => {
        mockUserRepo.findByEmail.mockResolvedValue(null);
        mockUserRepo.create.mockResolvedValue(mockUser);

        const result = await authService.register(userData);

        expect(result).toEqual(mockUser);
        expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(userData.email);
    });
});
```

## Configuration

### Environment Variables

```typescript
// JWT configuration
JWT_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
ACCESS_LIFETIME=15m
REFRESH_IDLE_TTL=7d

// Email verification
FRONTEND_URL=http://localhost:3000
RESET_PASSWORD_TTL=1h

// Email service
MAILER_PROVIDER=smtp|sendgrid
SMTP_HOST=localhost
SMTP_PORT=1025
```

### Token Lifetimes

- **Access Token**: 15 minutes (configurable via `ACCESS_LIFETIME`)
- **Refresh Token**: 7 days (configurable via `REFRESH_IDLE_TTL`)
- **Verification Token**: 1 hour (configurable via `RESET_PASSWORD_TTL`)

## Best Practices

### Security

1. **Use Strong Secrets**: Generate cryptographically secure JWT secrets
2. **Implement Token Rotation**: Always rotate refresh tokens
3. **Validate All Tokens**: Check expiration, signature, and revocation status
4. **Rate Limit**: Implement rate limiting on authentication endpoints
5. **Log Security Events**: Track failed login attempts and token anomalies

### Performance

1. **Cache Revoked Tokens**: Use Redis for O(1) revocation checks
2. **Batch Database Operations**: Minimize database calls during token operations
3. **Optimize JWT Size**: Keep token payloads minimal
4. **Use Connection Pooling**: Ensure database connections are properly pooled

### Reliability

1. **Handle Token Edge Cases**: Account for clock skew and network delays
2. **Implement Graceful Degradation**: Handle service unavailability
3. **Use Transactions**: Ensure data consistency during multi-step operations
4. **Monitor Token Metrics**: Track token usage and failure rates

## Related Documentation

- [Authorization Service Guide](./authorization-service.guide.md)
- [User Service Guide](./user-service.guide.md)
- [Token Repository Guide](../repositories/token-repository.guide.md)
- [Email Verification Repository Guide](../repositories/repositories.guide.md#email-verification-repository)
