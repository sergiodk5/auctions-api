# Rate Limiting Middleware Guide

## Overview

The rate limiting middlewares provide protection against abuse, brute force attacks, and resource exhaustion by limiting the number of requests from specific sources within defined time windows. The project implements specialized rate limiters for different endpoints and use cases.

## Architecture

### Core Responsibilities

1. **Request Throttling**: Control request frequency from clients
2. **Abuse Prevention**: Prevent brute force and DoS attacks
3. **Resource Protection**: Protect server resources from overuse
4. **User Experience**: Provide appropriate feedback for rate limit violations
5. **Configurable Limits**: Support different limits for different endpoints

### Rate Limiting Types

- **LoginRateLimiter**: Protects authentication endpoints from brute force attacks
- **RefreshRateLimiter**: Limits token refresh requests to prevent abuse
- **Global Rate Limiter**: (Can be implemented) General request limiting
- **User-Specific Limiting**: Different limits based on user roles/tiers

### Dependencies

- **ICacheService**: Redis-based storage for rate limiting data
- **rate-limiter-flexible**: Library for implementing rate limiting logic
- **Express Request**: For extracting client identifiers (IP, user ID)

## Implementation

### Base Rate Limiter Pattern

```typescript
@injectable()
export default class BaseRateLimiter implements IMiddleware {
    protected limiter: RateLimiterRedis;

    constructor(
        @inject(TYPES.ICacheService)
        protected readonly cacheService: ICacheService,
    ) {}

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        const key = this.getKey(req);

        try {
            await this.limiter.consume(key);
            next();
        } catch (rejRes) {
            this.handleRateLimit(rejRes, res);
        }
    }

    protected getKey(req: Request): string {
        // Override in subclasses
        return req.ip || "unknown";
    }

    protected handleRateLimit(rejRes: any, res: Response): void {
        const remainingTime = Math.round(rejRes.msBeforeNext / 1000);

        res.status(429).json({
            success: false,
            data: null,
            message: "Rate limit exceeded",
            retryAfter: remainingTime,
        });
    }
}
```

## Core Rate Limiters

### LoginRateLimiter

Protects login endpoints from brute force attacks:

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
            keyPrefix: "rl_login", // Rate limit prefix
            points: 5, // 5 attempts
            duration: 60, // per 60 seconds
            blockDuration: 300, // block for 5 minutes after exhaustion
        });
    }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        if (!req.ip) {
            res.status(500).json({
                success: false,
                data: null,
                message: "IP address not found",
            });
            return;
        }

        try {
            await this.limiter.consume(req.ip);
            next();
        } catch (_err) {
            console.error("Rate limit exceeded for login");
            res.status(429).json({
                success: false,
                data: null,
                message: "Too many login requests, please wait.",
            });
        }
    }
}
```

**Configuration:**

- **Points**: 5 login attempts
- **Duration**: 60 seconds window
- **Block Duration**: 300 seconds (5 minutes) penalty
- **Key**: Client IP address

### RefreshRateLimiter

Limits token refresh requests:

```typescript
@injectable()
export default class RefreshRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;

    constructor(
        @inject(TYPES.ICacheService)
        private readonly cacheService: ICacheService,
    ) {
        this.limiter = new RateLimiterRedis({
            storeClient: this.cacheService.client,
            keyPrefix: "rl_refresh", // Rate limit prefix
            points: 20, // 20 refresh requests
            duration: 60, // per 60 seconds
            // No blockDuration - use default behavior
        });
    }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        // Use user ID if available, fallback to IP
        const key = (req as any).user?.id ?? req.ip;

        try {
            await this.limiter.consume(key);
            next();
        } catch (_err) {
            console.error("Rate limit exceeded for refresh token");
            res.status(429).json({
                success: false,
                data: null,
                message: "Too many refresh requests, slow down.",
            });
        }
    }
}
```

**Configuration:**

- **Points**: 20 refresh attempts
- **Duration**: 60 seconds window
- **Key**: User ID (authenticated) or IP address (fallback)
- **Block Duration**: Default behavior (continue blocking until window resets)

## Usage Patterns

### Authentication Route Protection

```typescript
import { Router } from "express";
import { container } from "@/di/container";
import { TYPES } from "@/di/types";

const router = Router();
const loginRateLimit = container.get<IMiddleware>(TYPES.LoginRateLimiter);
const authGuard = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const refreshRateLimit = container.get<IMiddleware>(TYPES.RefreshRateLimiter);

// Apply login rate limiting to authentication endpoints
router.post(
    "/login",
    loginRateLimit.handle.bind(loginRateLimit),
    validationMiddleware.validate(loginSchema),
    authController.login,
);

router.post(
    "/register",
    loginRateLimit.handle.bind(loginRateLimit),
    validationMiddleware.validate(registerSchema),
    authController.register,
);

// Apply refresh rate limiting to token refresh
router.post(
    "/refresh",
    authGuard.handle.bind(authGuard),
    refreshRateLimit.handle.bind(refreshRateLimit),
    authController.refreshToken,
);
```

### API Route Protection

```typescript
// Apply general rate limiting to API routes
const apiRateLimit = new RateLimiterRedis({
    storeClient: cacheService.client,
    keyPrefix: "rl_api",
    points: 100, // 100 requests
    duration: 60, // per minute
});

const generalRateLimit: RequestHandler = async (req, res, next) => {
    try {
        await apiRateLimit.consume(req.ip || "unknown");
        next();
    } catch (rejRes) {
        res.status(429).json({
            success: false,
            message: "API rate limit exceeded",
        });
    }
};

// Apply to all API routes
router.use("/api", generalRateLimit);
```

### User-Specific Rate Limiting

```typescript
// Different limits based on user tier
class TieredRateLimiter implements IMiddleware {
    private limiters: Map<string, RateLimiterRedis>;

    constructor(cacheService: ICacheService) {
        this.limiters = new Map([
            [
                "free",
                new RateLimiterRedis({
                    storeClient: cacheService.client,
                    keyPrefix: "rl_free",
                    points: 100,
                    duration: 3600, // 1 hour
                }),
            ],
            [
                "premium",
                new RateLimiterRedis({
                    storeClient: cacheService.client,
                    keyPrefix: "rl_premium",
                    points: 1000,
                    duration: 3600, // 1 hour
                }),
            ],
            [
                "admin",
                new RateLimiterRedis({
                    storeClient: cacheService.client,
                    keyPrefix: "rl_admin",
                    points: 10000,
                    duration: 3600, // 1 hour
                }),
            ],
        ]);
    }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        const user = (req as any).user;
        const userTier = user?.tier || "free";
        const limiter = this.limiters.get(userTier) || this.limiters.get("free");

        try {
            await limiter.consume(user?.id || req.ip);
            next();
        } catch (rejRes) {
            res.status(429).json({
                success: false,
                message: `Rate limit exceeded for ${userTier} tier`,
            });
        }
    }
}
```

## Advanced Rate Limiting Patterns

### Progressive Rate Limiting

```typescript
// Increase penalties for repeated violations
class ProgressiveRateLimiter implements IMiddleware {
    private baseLimiter: RateLimiterRedis;
    private penaltyLimiter: RateLimiterRedis;

    constructor(cacheService: ICacheService) {
        this.baseLimiter = new RateLimiterRedis({
            storeClient: cacheService.client,
            keyPrefix: "rl_base",
            points: 10,
            duration: 60,
            blockDuration: 60,
        });

        this.penaltyLimiter = new RateLimiterRedis({
            storeClient: cacheService.client,
            keyPrefix: "rl_penalty",
            points: 3,
            duration: 3600, // 1 hour
            blockDuration: 3600 * 24, // 24 hours
        });
    }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        const key = req.ip || "unknown";

        try {
            await this.baseLimiter.consume(key);
            next();
        } catch (rejRes) {
            // First violation - apply penalty limiter
            try {
                await this.penaltyLimiter.consume(key);
                res.status(429).json({
                    success: false,
                    message: "Rate limit exceeded. Temporary restriction applied.",
                });
            } catch (penaltyRejRes) {
                res.status(429).json({
                    success: false,
                    message: "Multiple violations detected. Extended restriction applied.",
                });
            }
        }
    }
}
```

### Distributed Rate Limiting

```typescript
// Rate limiting across multiple server instances
class DistributedRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;

    constructor(cacheService: ICacheService) {
        this.limiter = new RateLimiterRedis({
            storeClient: cacheService.client,
            keyPrefix: "rl_distributed",
            points: 1000,
            duration: 3600,
            execEvenly: true, // Spread requests evenly across duration
        });
    }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        // Use consistent key across all instances
        const key = this.getDistributedKey(req);

        try {
            const resRateLimiter = await this.limiter.consume(key);

            // Add rate limit headers
            res.set({
                "X-RateLimit-Limit": "1000",
                "X-RateLimit-Remaining": String(resRateLimiter.remainingPoints),
                "X-RateLimit-Reset": String(new Date(Date.now() + resRateLimiter.msBeforeNext)),
            });

            next();
        } catch (rejRes) {
            res.set({
                "X-RateLimit-Limit": "1000",
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(new Date(Date.now() + rejRes.msBeforeNext)),
                "Retry-After": String(Math.round(rejRes.msBeforeNext / 1000)),
            });

            res.status(429).json({
                success: false,
                message: "Rate limit exceeded",
            });
        }
    }

    private getDistributedKey(req: Request): string {
        // Combine multiple identifiers for more accurate limiting
        const user = (req as any).user;
        if (user) {
            return `user:${user.id}`;
        }

        // Fallback to IP-based limiting
        return `ip:${req.ip}`;
    }
}
```

## Error Handling

### Rate Limit Response Format

```typescript
// Standard rate limit error response
{
    success: false,
    data: null,
    message: "Rate limit exceeded",
    retryAfter: 300  // seconds to wait
}
```

### HTTP Status Codes

- **429 Too Many Requests**: Standard rate limit exceeded response
- **500 Internal Server Error**: Rate limiting system errors

### Response Headers

```typescript
// Add informative headers to responses
res.set({
    "X-RateLimit-Limit": "100", // Total limit
    "X-RateLimit-Remaining": "25", // Remaining requests
    "X-RateLimit-Reset": "1640995200", // Reset timestamp
    "Retry-After": "60", // Seconds to wait
});
```

### Error Scenarios

1. **Limit Exceeded**:

    ```json
    {
        "success": false,
        "data": null,
        "message": "Too many login requests, please wait."
    }
    ```

2. **System Error**:

    ```json
    {
        "success": false,
        "data": null,
        "message": "IP address not found"
    }
    ```

3. **Cache Unavailable**:
    ```json
    {
        "success": false,
        "data": null,
        "message": "Rate limiting service unavailable"
    }
    ```

## Testing

### Unit Test Structure

```typescript
describe("LoginRateLimiter", () => {
    let cacheService: jest.Mocked<ICacheService>;
    let rateLimiter: LoginRateLimiter;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        cacheService = {
            client: mockRedisClient,
        } as jest.Mocked<ICacheService>;

        rateLimiter = new LoginRateLimiter(cacheService);

        req = { ip: "192.168.1.1" };
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

#### Within Rate Limit

```typescript
it("should allow request within rate limit", async () => {
    // Mock rate limiter to succeed
    const mockConsume = jest.fn().mockResolvedValue({ remainingPoints: 4 });
    jest.spyOn(rateLimiter["limiter"], "consume").mockImplementation(mockConsume);

    await rateLimiter.handle(req as Request, res as Response, next);

    expect(mockConsume).toHaveBeenCalledWith("192.168.1.1");
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
});
```

#### Rate Limit Exceeded

```typescript
it("should block request when rate limit exceeded", async () => {
    const mockConsume = jest.fn().mockRejectedValue({
        msBeforeNext: 30000,
        remainingPoints: 0,
    });
    jest.spyOn(rateLimiter["limiter"], "consume").mockImplementation(mockConsume);

    await rateLimiter.handle(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: "Too many login requests, please wait.",
    });
    expect(next).not.toHaveBeenCalled();
});
```

#### Missing IP Address

```typescript
it("should handle missing IP address", async () => {
    req.ip = undefined;

    await rateLimiter.handle(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: "IP address not found",
    });
    expect(next).not.toHaveBeenCalled();
});
```

#### User-Based Rate Limiting (RefreshRateLimiter)

```typescript
it("should use user ID when available", async () => {
    (req as any).user = { id: 123 };

    const mockConsume = jest.fn().mockResolvedValue({ remainingPoints: 19 });
    jest.spyOn(refreshRateLimiter["limiter"], "consume").mockImplementation(mockConsume);

    await refreshRateLimiter.handle(req as Request, res as Response, next);

    expect(mockConsume).toHaveBeenCalledWith(123);
    expect(next).toHaveBeenCalled();
});

it("should fallback to IP when user not available", async () => {
    req.ip = "192.168.1.1";

    const mockConsume = jest.fn().mockResolvedValue({ remainingPoints: 19 });
    jest.spyOn(refreshRateLimiter["limiter"], "consume").mockImplementation(mockConsume);

    await refreshRateLimiter.handle(req as Request, res as Response, next);

    expect(mockConsume).toHaveBeenCalledWith("192.168.1.1");
    expect(next).toHaveBeenCalled();
});
```

### Integration Testing

```typescript
describe("Rate Limiting Integration", () => {
    let app: Express;

    beforeEach(() => {
        app = createTestApp();
    });

    it("should allow login attempts within limit", async () => {
        for (let i = 0; i < 5; i++) {
            const response = await request(app)
                .post("/auth/login")
                .send({ email: "test@example.com", password: "wrongpassword" })
                .expect(401); // Wrong password, but not rate limited

            expect(response.body.success).toBe(false);
        }
    });

    it("should block login attempts after limit exceeded", async () => {
        // Exhaust rate limit
        for (let i = 0; i < 5; i++) {
            await request(app).post("/auth/login").send({ email: "test@example.com", password: "wrongpassword" });
        }

        // Next request should be rate limited
        const response = await request(app)
            .post("/auth/login")
            .send({ email: "test@example.com", password: "wrongpassword" })
            .expect(429);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("Too many login requests");
    });
});
```

## Performance Considerations

### Redis Optimization

```typescript
// Optimize Redis operations for rate limiting
class OptimizedRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;

    constructor(cacheService: ICacheService) {
        this.limiter = new RateLimiterRedis({
            storeClient: cacheService.client,
            keyPrefix: "rl_opt",
            points: 100,
            duration: 60,
            blockDuration: 300,
            execEvenly: true, // Spread requests evenly
            skipFailedRequests: true, // Don't count failed requests
            skipSuccessfulRequests: false,
        });
    }
}
```

### Memory Management

```typescript
// Prevent memory leaks in rate limiting
class MemoryEfficientRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;
    private lastCleanup: number = Date.now();

    constructor(cacheService: ICacheService) {
        this.limiter = new RateLimiterRedis({
            storeClient: cacheService.client,
            keyPrefix: "rl_memory",
            points: 100,
            duration: 60,
            // Automatically expire keys
            execEvenly: true,
        });
    }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        // Periodic cleanup
        if (Date.now() - this.lastCleanup > 3600000) {
            // 1 hour
            this.cleanup();
            this.lastCleanup = Date.now();
        }

        // Standard rate limiting logic
        try {
            await this.limiter.consume(this.getKey(req));
            next();
        } catch (rejRes) {
            this.handleRateLimit(rejRes, res);
        }
    }

    private cleanup(): void {
        // Cleanup expired keys if needed
        // This is usually handled by Redis TTL
    }
}
```

## Security Considerations

### IP Spoofing Protection

```typescript
// Protect against IP spoofing
class SecureRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;

    constructor(cacheService: ICacheService) {
        this.limiter = new RateLimiterRedis({
            storeClient: cacheService.client,
            keyPrefix: "rl_secure",
            points: 100,
            duration: 60,
        });
    }

    private getSecureKey(req: Request): string {
        // Use multiple identifiers for more secure key generation
        const identifiers = [req.ip, req.get("X-Forwarded-For"), req.get("User-Agent"), req.get("X-Real-IP")].filter(
            Boolean,
        );

        // Create composite key
        return crypto.createHash("sha256").update(identifiers.join("|")).digest("hex").substring(0, 16);
    }
}
```

### Bypass Protection

```typescript
// Prevent rate limit bypasses
class BypassProtectedRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;
    private globalLimiter: RateLimiterRedis;

    constructor(cacheService: ICacheService) {
        // Per-IP limiter
        this.limiter = new RateLimiterRedis({
            storeClient: cacheService.client,
            keyPrefix: "rl_ip",
            points: 100,
            duration: 60,
        });

        // Global limiter (all requests)
        this.globalLimiter = new RateLimiterRedis({
            storeClient: cacheService.client,
            keyPrefix: "rl_global",
            points: 10000,
            duration: 60,
        });
    }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Check global limit first
            await this.globalLimiter.consume("global");

            // Then check per-IP limit
            await this.limiter.consume(req.ip || "unknown");

            next();
        } catch (rejRes) {
            res.status(429).json({
                success: false,
                message: "Rate limit exceeded",
            });
        }
    }
}
```

## Configuration Best Practices

### Environment-Based Configuration

```typescript
// Configure rate limits based on environment
class ConfigurableRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;

    constructor(cacheService: ICacheService) {
        const isDevelopment = process.env.NODE_ENV === "development";
        const isProduction = process.env.NODE_ENV === "production";

        this.limiter = new RateLimiterRedis({
            storeClient: cacheService.client,
            keyPrefix: "rl_config",
            points: isDevelopment ? 1000 : isProduction ? 100 : 500,
            duration: 60,
            blockDuration: isDevelopment ? 10 : 300,
        });
    }
}
```

### Dynamic Configuration

```typescript
// Support runtime configuration changes
class DynamicRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;
    private config: RateLimitConfig;

    constructor(cacheService: ICacheService, initialConfig: RateLimitConfig) {
        this.config = initialConfig;
        this.updateLimiter(cacheService);
    }

    public updateConfig(newConfig: RateLimitConfig): void {
        this.config = newConfig;
        // Recreate limiter with new configuration
        this.updateLimiter(this.cacheService);
    }

    private updateLimiter(cacheService: ICacheService): void {
        this.limiter = new RateLimiterRedis({
            storeClient: cacheService.client,
            keyPrefix: this.config.keyPrefix,
            points: this.config.points,
            duration: this.config.duration,
            blockDuration: this.config.blockDuration,
        });
    }
}
```

## Best Practices

### Implementation

1. **Appropriate Limits**: Set reasonable limits for different endpoints
2. **User Feedback**: Provide clear messages about rate limits
3. **Graceful Degradation**: Handle cache service failures gracefully
4. **Monitoring**: Log rate limit violations for monitoring
5. **Configuration**: Make limits configurable based on environment

### Security

1. **Multiple Identifiers**: Use multiple request identifiers for key generation
2. **Progressive Penalties**: Increase penalties for repeated violations
3. **Global Limits**: Implement global limits to prevent system abuse
4. **Bypass Protection**: Protect against common bypass techniques

### Performance

1. **Redis Optimization**: Optimize Redis operations and connections
2. **Memory Management**: Prevent memory leaks in long-running processes
3. **Efficient Keys**: Use efficient key generation strategies
4. **Cleanup**: Implement cleanup mechanisms for expired data

### Monitoring

1. **Rate Limit Metrics**: Track rate limit violations and patterns
2. **Performance Metrics**: Monitor Redis performance and latency
3. **Alert Thresholds**: Set up alerts for unusual rate limit activity
4. **Capacity Planning**: Plan Redis capacity based on usage patterns

## Related Documentation

- [Authentication Middleware Guide](./authentication-middleware.guide.md)
- [Cache Service Guide](../services/cache-service.guide.md)
- [Middlewares Layer Guide](./middlewares.guide.md)
- [Security Best Practices](../security/security.guide.md)
