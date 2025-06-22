# Token Repository Guide

## Overview

The `TokenRepository` manages JWT token storage, validation, and revocation using a hybrid approach with Redis for performance and PostgreSQL for persistence. It implements sophisticated token family management for enhanced security and supports immediate token revocation through deny lists.

## Interface Definition

```typescript
export interface ITokenRepository {
    storeRefreshToken(jti: string, familyId: string): Promise<void>;
    revokeRefreshToken(jti: string): Promise<void>;
    revokeFamily(familyId: string): Promise<void>;
    isRefreshTokenValid(jti: string): Promise<boolean>;
    addToDenyList(jti: string, ttlSeconds: number): Promise<void>;
    isAccessTokenRevoked(jti: string): Promise<boolean>;
}
```

## Architecture

### Hybrid Storage Strategy

1. **Redis**: Fast lookups and TTL management
2. **PostgreSQL**: Persistent storage and audit trail
3. **Token Families**: Group related tokens for bulk operations

### Security Features

- **Family-based Revocation**: Logout from all devices
- **Immediate Invalidation**: Access token deny list
- **Automatic Expiration**: TTL-based token cleanup
- **Audit Trail**: Database persistence for security monitoring

## Implementation Details

### Dependencies

```typescript
@injectable()
export default class TokenRepository implements ITokenRepository {
    constructor(
        @inject(TYPES.IDatabaseService) private readonly databaseService: IDatabaseService,
        @inject(TYPES.ICacheService) private readonly cacheService: ICacheService,
    ) {}
}
```

### Environment Configuration

```typescript
import { REFRESH_IDLE_TTL, REFRESH_ABSOLUTE_TTL } from "@/config/env";

// Example configuration
REFRESH_IDLE_TTL = 604800; // 7 days in seconds
REFRESH_ABSOLUTE_TTL = 2592000; // 30 days in seconds
```

## Method Documentation

### storeRefreshToken(jti, familyId)

Stores a refresh token in both Redis and PostgreSQL with proper TTL settings.

```typescript
async storeRefreshToken(jti: string, familyId: string): Promise<void>
```

**Parameters**:

- `jti`: JWT ID (unique token identifier)
- `familyId`: Family identifier grouping related tokens

**Storage Strategy**:

1. Redis: Store JTI → FamilyID mapping with idle TTL
2. Redis: Add JTI to family set with absolute TTL
3. PostgreSQL: Store family record and token record

**Example**:

```typescript
const familyId = uuidv4();
const jti = uuidv4();

await tokenRepo.storeRefreshToken(jti, familyId);
// Token is now valid and can be used for refresh operations
```

**Redis Operations**:

```typescript
// Multi-operation for atomicity
await cacheService.client
    .multi()
    .set(`refresh:jti:${jti}`, familyId, { EX: REFRESH_IDLE_TTL }) // 7 days
    .sAdd(`refresh:family:${familyId}`, jti)
    .expire(`refresh:family:${familyId}`, REFRESH_ABSOLUTE_TTL) // 30 days
    .exec();
```

### revokeRefreshToken(jti)

Revokes a specific refresh token while leaving family intact.

```typescript
async revokeRefreshToken(jti: string): Promise<void>
```

**Parameters**:

- `jti`: JWT ID to revoke

**Operations**:

1. Remove from Redis cache
2. Mark as revoked in PostgreSQL with timestamp

**Use Cases**:

- Token refresh (old token becomes invalid)
- Selective token revocation

**Example**:

```typescript
// During token refresh, old token is revoked
await tokenRepo.revokeRefreshToken(oldJti);
// New token is stored
await tokenRepo.storeRefreshToken(newJti, familyId);
```

### revokeFamily(familyId)

Revokes all tokens in a family (logout from all devices).

```typescript
async revokeFamily(familyId: string): Promise<void>
```

**Parameters**:

- `familyId`: Family identifier to revoke

**Operations**:

1. Query all JTIs in family from database
2. Remove all JTIs from Redis cache
3. Remove family set from Redis
4. Mark all tokens as revoked in PostgreSQL

**Use Cases**:

- User logout from all devices
- Password change security
- Compromise detection

**Example**:

```typescript
// User changes password - revoke all sessions
await tokenRepo.revokeFamily(familyId);
// All user's refresh tokens are now invalid
```

### isRefreshTokenValid(jti)

Checks if a refresh token is valid and not revoked.

```typescript
async isRefreshTokenValid(jti: string): Promise<boolean>
```

**Parameters**:

- `jti`: JWT ID to validate

**Returns**: `true` if token exists in Redis cache, `false` otherwise

**Performance**: O(1) Redis lookup for maximum speed

**Example**:

```typescript
const isValid = await tokenRepo.isRefreshTokenValid(jti);
if (!isValid) {
    throw new Error("Invalid refresh token");
}
```

### addToDenyList(jti, ttlSeconds)

Adds an access token to the deny list for immediate revocation.

```typescript
async addToDenyList(jti: string, ttlSeconds: number): Promise<void>
```

**Parameters**:

- `jti`: Access token JTI to deny
- `ttlSeconds`: TTL matching token expiration

**Use Cases**:

- Immediate logout
- Token revocation before natural expiry
- Security incident response

**Example**:

```typescript
// Calculate remaining TTL from JWT
const payload = jwt.decode(accessToken) as any;
const ttl = Math.max(0, Math.ceil((payload.exp * 1000 - Date.now()) / 1000));

await tokenRepo.addToDenyList(payload.jti, ttl);
// Access token is immediately invalid
```

### isAccessTokenRevoked(jti)

Checks if an access token has been revoked.

```typescript
async isAccessTokenRevoked(jti: string): Promise<boolean>
```

**Parameters**:

- `jti`: Access token JTI to check

**Returns**: `true` if token is in deny list, `false` otherwise

**Performance**: O(1) Redis lookup

**Example**:

```typescript
// In authentication middleware
const isRevoked = await tokenRepo.isAccessTokenRevoked(payload.jti);
if (isRevoked) {
    return res.status(401).json({ message: "Token revoked" });
}
```

## Token Lifecycle

### Token Creation Flow

```typescript
// 1. User login
const familyId = uuidv4();
const jti = uuidv4();

// 2. Generate tokens
const accessToken = jwt.sign({ sub: userId, jti }, JWT_SECRET, { expiresIn: ACCESS_LIFETIME });
const refreshToken = jwt.sign({ sub: userId, jti, family_id: familyId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_IDLE_TTL,
});

// 3. Store refresh token
await tokenRepo.storeRefreshToken(jti, familyId);
```

### Token Refresh Flow

```typescript
// 1. Validate current refresh token
const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
const isValid = await tokenRepo.isRefreshTokenValid(payload.jti);
if (!isValid) throw new Error("Invalid refresh token");

// 2. Revoke old token
await tokenRepo.revokeRefreshToken(payload.jti);

// 3. Generate new tokens
const newJti = uuidv4();
const newAccessToken = jwt.sign({ sub: payload.sub, jti: newJti }, JWT_SECRET, {
    expiresIn: ACCESS_LIFETIME,
});
const newRefreshToken = jwt.sign(
    {
        sub: payload.sub,
        jti: newJti,
        family_id: payload.family_id,
    },
    JWT_REFRESH_SECRET,
    {
        expiresIn: REFRESH_IDLE_TTL,
    },
);

// 4. Store new refresh token
await tokenRepo.storeRefreshToken(newJti, payload.family_id);
```

### Token Revocation Flow

```typescript
// Logout from current device
await tokenRepo.revokeRefreshToken(currentJti);

// Logout from all devices
await tokenRepo.revokeFamily(familyId);

// Revoke access token immediately
const ttl = calculateRemainingTTL(accessToken);
await tokenRepo.addToDenyList(accessJti, ttl);
```

## Performance Characteristics

### Redis Operations

| Operation              | Complexity | Performance |
| ---------------------- | ---------- | ----------- |
| `storeRefreshToken`    | O(1)       | ~1ms        |
| `revokeRefreshToken`   | O(1)       | ~1ms        |
| `isRefreshTokenValid`  | O(1)       | ~0.5ms      |
| `addToDenyList`        | O(1)       | ~1ms        |
| `isAccessTokenRevoked` | O(1)       | ~0.5ms      |
| `revokeFamily`         | O(n)       | ~n\*1ms     |

### Database Operations

- **Token Storage**: Single insert with conflict handling
- **Family Management**: Batch updates for efficiency
- **Audit Queries**: Indexed by user_id and timestamps

## Testing Strategies

### Unit Testing

```typescript
describe("TokenRepository", () => {
    let mockDb: any;
    let mockCache: any;
    let tokenRepo: ITokenRepository;

    beforeEach(() => {
        // Mock database operations
        mockDb = {
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            values: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            where: jest.fn().mockResolvedValue([]),
        };

        // Mock Redis operations
        const multiBuilder = {
            set: jest.fn().mockReturnThis(),
            sAdd: jest.fn().mockReturnThis(),
            expire: jest.fn().mockReturnThis(),
            del: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(undefined),
        };

        mockCache = {
            client: {
                multi: jest.fn().mockReturnValue(multiBuilder),
                get: jest.fn(),
                set: jest.fn(),
                del: jest.fn(),
            },
        };

        tokenRepo = new TokenRepository({ db: mockDb } as any, mockCache as any);
    });

    it("should store refresh token in both Redis and database", async () => {
        await tokenRepo.storeRefreshToken("jti123", "family456");

        expect(mockCache.client.multi).toHaveBeenCalled();
        expect(mockDb.insert).toHaveBeenCalledTimes(2); // families + tokens
    });
});
```

### Integration Testing with Mocks

```typescript
import { MockTokenRepository } from "@tests/mocks/repositories/mock-token.repository";

describe("Token Integration Tests", () => {
    let tokenRepo: MockTokenRepository;

    beforeEach(() => {
        tokenRepo = MockTokenRepository.getInstance();
        tokenRepo.clearAll();
    });

    it("should handle complete token lifecycle", async () => {
        const jti = "test-jti";
        const familyId = "test-family";

        // Store token
        await tokenRepo.storeRefreshToken(jti, familyId);
        expect(await tokenRepo.isRefreshTokenValid(jti)).toBe(true);

        // Revoke token
        await tokenRepo.revokeRefreshToken(jti);
        expect(await tokenRepo.isRefreshTokenValid(jti)).toBe(false);

        // Test family operations
        await tokenRepo.storeRefreshToken("jti1", familyId);
        await tokenRepo.storeRefreshToken("jti2", familyId);

        await tokenRepo.revokeFamily(familyId);
        expect(await tokenRepo.isRefreshTokenValid("jti1")).toBe(false);
        expect(await tokenRepo.isRefreshTokenValid("jti2")).toBe(false);
    });

    it("should handle access token deny list", async () => {
        const accessJti = "access-jti";

        expect(await tokenRepo.isAccessTokenRevoked(accessJti)).toBe(false);

        await tokenRepo.addToDenyList(accessJti, 3600);
        expect(await tokenRepo.isAccessTokenRevoked(accessJti)).toBe(true);
    });
});
```

## Security Considerations

### Token Family Security

1. **Family Rotation**: Families can be rotated for additional security
2. **Compromise Detection**: Unusual family activity can indicate compromise
3. **Bulk Revocation**: Instant security response capability

### Redis Security

1. **TTL Management**: Automatic cleanup prevents token accumulation
2. **Memory Efficiency**: Keys expire automatically
3. **Atomic Operations**: Multi-commands ensure consistency

### Database Security

1. **Audit Trail**: All token operations are logged
2. **Foreign Keys**: Referential integrity with users
3. **Timestamps**: Track token lifecycle events

## Common Issues and Solutions

### Issue: Redis Connection Failures

**Problem**: Redis unavailable during token operations

**Solution**: Graceful degradation with database-only mode

```typescript
async isRefreshTokenValid(jti: string): Promise<boolean> {
    try {
        return !!(await this.cacheService.client.get(`refresh:jti:${jti}`));
    } catch (error) {
        console.warn("Redis unavailable, falling back to database");
        // Fallback to database query
        const token = await this.databaseService.db
            .select()
            .from(refreshTokensTable)
            .where(and(
                eq(refreshTokensTable.jti, jti),
                isNull(refreshTokensTable.revokedAt)
            ));
        return token.length > 0;
    }
}
```

### Issue: Clock Synchronization

**Problem**: Server clocks out of sync affecting TTL

**Solution**: Use absolute timestamps and buffer times

```typescript
// Add buffer time for clock skew
const ttlWithBuffer = Math.max(0, ttl - 30); // 30-second buffer
await tokenRepo.addToDenyList(jti, ttlWithBuffer);
```

### Issue: Memory Usage

**Problem**: Redis memory usage from large token families

**Solution**: Monitor and implement family size limits

```typescript
async storeRefreshToken(jti: string, familyId: string): Promise<void> {
    // Check family size
    const familySize = await this.cacheService.client.sCard(`refresh:family:${familyId}`);
    if (familySize > MAX_FAMILY_SIZE) {
        throw new Error("Token family too large");
    }

    // Continue with normal storage
}
```

## Monitoring and Metrics

### Key Metrics

1. **Token Creation Rate**: Monitor authentication volume
2. **Revocation Rate**: Track security incidents
3. **Family Size Distribution**: Monitor user session patterns
4. **Cache Hit Rate**: Redis performance metrics
5. **Database Query Performance**: Token operation latency

### Alerts

1. **High Revocation Rate**: Potential security incident
2. **Large Families**: Possible token farming
3. **Redis Failures**: Infrastructure issues
4. **Slow Queries**: Performance degradation

## Future Enhancements

### Planned Improvements

1. **Token Rotation**: Automatic refresh token rotation
2. **Device Tracking**: Associate tokens with devices
3. **Geographic Tracking**: Location-based security
4. **Rate Limiting**: Token operation rate limits
5. **Metrics Dashboard**: Real-time token analytics

### Performance Optimizations

1. **Connection Pooling**: Optimize Redis connections
2. **Batch Operations**: Bulk token operations
3. **Compression**: Compress token data in Redis
4. **Partitioning**: Distribute tokens across Redis instances

This TokenRepository provides enterprise-grade token management with high performance, security, and reliability for JWT-based authentication systems.
