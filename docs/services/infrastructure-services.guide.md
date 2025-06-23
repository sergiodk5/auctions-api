# Infrastructure Services Guide

## Overview

Infrastructure services provide core technical capabilities that support the application's business logic. These services handle database connections, caching, email delivery, and validation - the foundational services that enable other parts of the application to function.

## Core Infrastructure Services

### DatabaseService

The `DatabaseService` manages the PostgreSQL database connection and provides the Drizzle ORM instance.

```typescript
export interface IDatabaseService {
    db: ReturnType<typeof drizzle>;
}

@injectable()
export default class DatabaseService implements IDatabaseService {
    public readonly db: ReturnType<typeof drizzle>;

    constructor() {
        let connectionString: string;

        if (NODE_ENV === "test") {
            connectionString = TEST_DATABASE_URL;
        } else {
            connectionString = DATABASE_URL;
        }

        const pool = new Pool({ connectionString });
        this.db = drizzle(pool);
    }
}
```

**Key Features:**

- Environment-specific database connections
- PostgreSQL connection pooling
- Test database isolation
- Drizzle ORM integration
- Connection error handling

**Usage Pattern:**

```typescript
@injectable()
export default class UserRepository implements IUserRepository {
    constructor(
        @inject(TYPES.IDatabaseService)
        private readonly databaseService: IDatabaseService,
    ) {}

    async findById(id: number): Promise<User | null> {
        const [user] = await this.databaseService.db.select().from(usersTable).where(eq(usersTable.id, id));
        return user || null;
    }
}
```

### CacheService

The `CacheService` manages Redis connections for caching and session storage.

```typescript
export interface ICacheService {
    client: RedisClientType;
}

@injectable()
export default class CacheService implements ICacheService {
    public readonly client: RedisClientType;

    constructor() {
        if (NODE_ENV === "test") {
            // Mock Redis client for tests
            this.client = {
                get: () => Promise.resolve(null),
                set: () => Promise.resolve("OK"),
                setEx: () => Promise.resolve("OK"),
                del: () => Promise.resolve(1),
                // ... other methods
            } as any as RedisClientType;
        } else {
            this.client = createClient({
                socket: {
                    host: REDIS_HOST,
                    port: Number(REDIS_PORT),
                },
                password: REDIS_PASSWORD,
            });
        }
    }
}
```

**Key Features:**

- Redis connection management
- Test environment mocking
- Connection error handling
- Auto-reconnection support

**Usage Patterns:**

```typescript
// Simple caching
await this.cacheService.client.setEx("key", 3600, "value");
const value = await this.cacheService.client.get("key");

// Token blacklisting
await this.cacheService.client.setEx(`revoked:${jti}`, ttl, "true");
const isRevoked = await this.cacheService.client.exists(`revoked:${jti}`);

// Permission caching
const permissions = await this.cacheService.client.get(`user:${userId}:permissions`);
if (!permissions) {
    const userPermissions = await this.fetchPermissions(userId);
    await this.cacheService.client.setEx(`user:${userId}:permissions`, 3600, JSON.stringify(userPermissions));
}
```

### MailerService

The `MailerService` handles email delivery with support for multiple providers.

```typescript
export interface IMailerService {
    sendWelcomeEmail(email: string, verificationLink: string): Promise<void>;
    sendPasswordResetEmail(email: string, resetLink: string): Promise<void>;
    sendVerificationEmail(email: string, verificationLink: string): Promise<void>;
}

@injectable()
export class MailerService implements IMailerService {
    constructor(
        @inject(TYPES.MailerTransporter)
        private readonly transporter: nodemailer.Transporter,
    ) {}

    async sendWelcomeEmail(email: string, verificationLink: string): Promise<void> {
        const mailOptions = {
            from: '"Your App" <noreply@yourapp.com>',
            to: email,
            subject: "Welcome to Your App - Verify Your Email",
            html: this.generateWelcomeEmailHTML(verificationLink),
        };

        await this.transporter.sendMail(mailOptions);
    }
}
```

**Key Features:**

- Multiple provider support (SMTP, SendGrid)
- Template-based email generation
- Environment-specific configuration
- Error handling and retry logic

**Provider Configuration:**

```typescript
// SendGrid (Production)
if (NODE_ENV === "production" && MAILER_PROVIDER === "sendgrid") {
    return nodemailer.createTransporter(
        nodemailerSendgrid({
            apiKey: SENDGRID_API_KEY,
        }),
    );
}

// SMTP (Development with MailHog)
return nodemailer.createTransporter({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE,
    auth: SMTP_USER
        ? {
              user: SMTP_USER,
              pass: SMTP_PASS,
          }
        : undefined,
});
```

### ValidationService

The `ValidationService` provides centralized data validation using Zod schemas.

```typescript
export interface IValidationService {
    validateCreateUser(data: unknown): CreateUserDto;
    validateUpdateUser(data: unknown): UpdateUserDto;
    validateLoginRequest(data: unknown): LoginRequestDto;
}

@injectable()
export default class ValidationService implements IValidationService {
    validateCreateUser(data: unknown): CreateUserDto {
        return createUserSchema.parse(data);
    }

    validateUpdateUser(data: unknown): UpdateUserDto {
        return updateUserSchema.parse(data);
    }

    validateLoginRequest(data: unknown): LoginRequestDto {
        return loginRequestSchema.parse(data);
    }
}
```

**Key Features:**

- Centralized validation logic
- Type-safe schema validation
- Consistent error messaging
- Integration with Drizzle schemas

### LoggerService

The `LoggerService` provides structured logging capabilities throughout the application using the adapter pattern.

```typescript
export interface ILoggerService {
    error(message: string | Error, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    info(message: string, meta?: Record<string, any>): void;
    http(message: string, meta?: Record<string, any>): void;
    verbose(message: string, meta?: Record<string, any>): void;
    debug(message: string, meta?: Record<string, any>): void;
    silly(message: string, meta?: Record<string, any>): void;
    child(defaultMeta: Record<string, any>): ILoggerService;
}

@injectable()
export default class LoggerService implements ILoggerService {
    constructor(
        @inject(TYPES.LoggerTransport)
        private readonly logger: ILoggerTransport,
    ) {}

    public error(message: string | Error, meta?: Record<string, any>): void {
        if (message instanceof Error) {
            this.logger.error(message.message, { ...meta, error: message, stack: message.stack });
        } else {
            this.logger.error(message, meta);
        }
    }

    // ... other log level methods

    public child(defaultMeta: Record<string, any>): ILoggerService {
        const childLogger = this.logger.child(defaultMeta);
        const childService = Object.create(LoggerService.prototype);
        childService.logger = childLogger;
        return childService as ILoggerService;
    }
}
```

**Key Features:**

- Library-independent logging through adapter pattern
- Multiple log levels (error, warn, info, http, verbose, debug, silly)
- Structured logging with metadata support
- Environment-specific configuration (development, production, test)
- Child logger support for contextual logging
- Error object handling with stack traces
- File-based logging in production
- Silent logging in test environment

**Usage Pattern:**

```typescript
@injectable()
export default class UserService implements IUserService {
    constructor(
        @inject(TYPES.ILoggerService)
        private readonly logger: ILoggerService,
        @inject(TYPES.IUserRepository)
        private readonly userRepository: IUserRepository,
    ) {}

    async createUser(userData: CreateUserDto): Promise<User> {
        this.logger.info("Creating new user", { email: userData.email });

        try {
            const user = await this.userRepository.create(userData);
            this.logger.info("User created successfully", { userId: user.id, email: user.email });
            return user;
        } catch (error) {
            this.logger.error("Failed to create user", { error, email: userData.email });
            throw error;
        }
    }
}
```

**Adapter Configuration:**

The LoggerService uses the `WinstonTransportAdapter` to provide Winston-based logging:

```typescript
// Environment-specific configuration
container.bind<ILoggerTransport>(TYPES.LoggerTransport).to(WinstonTransportAdapter).inSingletonScope();
container.bind<ILoggerService>(TYPES.ILoggerService).to(LoggerService).inSingletonScope();
```

## Service Registration

Infrastructure services are registered in the DI container:

```typescript
// Database and Cache
container.bind<IDatabaseService>(TYPES.IDatabaseService).to(DatabaseService);
container.bind<ICacheService>(TYPES.ICacheService).to(CacheService);

// Logger with adapter pattern
container.bind<ILoggerTransport>(TYPES.LoggerTransport).to(WinstonTransportAdapter).inSingletonScope();
container.bind<ILoggerService>(TYPES.ILoggerService).to(LoggerService).inSingletonScope();

// Mailer with dynamic provider selection
container
    .bind<import("nodemailer").Transporter>(TYPES.MailerTransporter)
    .toDynamicValue(() => {
        if (NODE_ENV === "production" && MAILER_PROVIDER === "sendgrid") {
            return nodemailer.createTransporter(
                nodemailerSendgrid({
                    apiKey: SENDGRID_API_KEY,
                }),
            );
        }
        return nodemailer.createTransporter({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: SMTP_SECURE,
            auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
        });
    })
    .inSingletonScope();

container.bind<IMailerService>(TYPES.IMailerService).to(MailerService);
container.bind<IValidationService>(TYPES.IValidationService).to(ValidationService);
```

## Configuration Management

### Environment-Specific Behavior

```typescript
// Database service configuration
constructor() {
    let connectionString: string;

    if (NODE_ENV === "test") {
        connectionString = TEST_DATABASE_URL;  // Isolated test database
    } else {
        connectionString = DATABASE_URL;       // Main database
    }

    // Configure connection pool
    const pool = new Pool({
        connectionString,
        max: NODE_ENV === "production" ? 20 : 5,  // Environment-specific pool size
    });
}
```

### Error Handling

```typescript
// Connection error handling
pool.on("error", (err: unknown) => {
    console.error("PostgreSQL Pool Error", err);
});

pool.on("connect", () => {
    console.log("PostgreSQL Pool Connected");
});

// Redis error handling
this.client.on("error", (err: unknown) => {
    console.error("Redis Client Error", err);
});

this.client.on("connect", () => {
    console.log("Redis Client Connected");
});
```

### Logging Best Practices

For infrastructure services, logging should follow these patterns:

- **Service initialization logs**: Use console.log during service startup/initialization (before logger service is available)
- **Runtime operations**: Use injected LoggerService for all runtime logging
- **Error handling**: Always use LoggerService for error logging during operation

```typescript
@injectable()
export default class ExampleInfrastructureService {
    constructor(@inject(TYPES.ILoggerService) private readonly logger: ILoggerService) {
        // Initialization logs can use console during startup
        console.log("ExampleInfrastructureService initializing...");
    }

    public async performOperation(data: any): Promise<void> {
        // Runtime logs should use logger service
        this.logger.info("Performing operation", { operation: "example", dataSize: data.length });

        try {
            // ... operation logic
            this.logger.debug("Operation completed successfully");
        } catch (error) {
            this.logger.error("Operation failed", { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
}
```

## Testing Infrastructure Services

### Database Service Testing

```typescript
describe("DatabaseService", () => {
    let databaseService: DatabaseService;

    beforeEach(() => {
        databaseService = new DatabaseService();
    });

    it("should provide drizzle database instance", () => {
        expect(databaseService.db).toBeDefined();
        expect(typeof databaseService.db.select).toBe("function");
    });

    it("should use test database in test environment", () => {
        // Database service automatically uses TEST_DATABASE_URL in test env
        expect(process.env.NODE_ENV).toBe("test");
    });
});
```

### Cache Service Testing

```typescript
describe("CacheService", () => {
    let cacheService: CacheService;

    beforeEach(() => {
        cacheService = new CacheService();
    });

    it("should provide mock Redis client in test environment", async () => {
        expect(cacheService.client).toBeDefined();

        // Test mock client functionality
        await expect(cacheService.client.set("test", "value")).resolves.toBe("OK");
        await expect(cacheService.client.get("test")).resolves.toBeNull();
    });
});
```

### Mailer Service Testing

```typescript
describe("MailerService", () => {
    let mailerService: MailerService;
    let mockTransporter: jest.Mocked<nodemailer.Transporter>;

    beforeEach(() => {
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" }),
        } as any;

        mailerService = new MailerService(mockTransporter);
    });

    it("should send welcome email", async () => {
        await mailerService.sendWelcomeEmail("test@example.com", "http://verify-link");

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "test@example.com",
                subject: expect.stringContaining("Welcome"),
            }),
        );
    });
});
```

## Performance Considerations

### Database Connection Pooling

```typescript
// Optimize pool size based on environment
const poolConfig = {
    connectionString,
    max: NODE_ENV === "production" ? 20 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
```

### Redis Connection Management

```typescript
// Use connection multiplexing
const redisConfig = {
    socket: {
        host: REDIS_HOST,
        port: Number(REDIS_PORT),
        keepAlive: true,
    },
    password: REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
};
```

### Email Queue Management

```typescript
// Consider implementing email queuing for high volume
interface EmailQueue {
    enqueue(email: EmailMessage): Promise<void>;
    process(): Promise<void>;
}

// Rate limiting for email sends
const emailRateLimit = {
    windowMs: 60000, // 1 minute
    max: 100, // 100 emails per minute
};
```

## Security Considerations

### Database Security

```typescript
// Use parameterized queries (Drizzle handles this)
const user = await db.select().from(usersTable).where(eq(usersTable.id, userId));

// Connection string security
const connectionString = DATABASE_URL; // From secure environment variables
```

### Cache Security

```typescript
// Secure Redis connection
const redisConfig = {
    password: REDIS_PASSWORD,
    tls: NODE_ENV === "production" ? {} : undefined,
};

// Sanitize cache keys
const sanitizeCacheKey = (key: string): string => {
    return key.replace(/[^a-zA-Z0-9:_-]/g, "_");
};
```

### Email Security

```typescript
// Email input validation
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Prevent email injection
const sanitizeEmailContent = (content: string): string => {
    return content.replace(/[<>]/g, "");
};
```

## Monitoring and Logging

### Database Monitoring

```typescript
// Connection pool monitoring
pool.on("connect", (client) => {
    console.log("Database client connected");
});

pool.on("remove", (client) => {
    console.log("Database client removed");
});

// Query performance monitoring
const queryStart = Date.now();
const result = await db.select().from(table);
const queryTime = Date.now() - queryStart;
if (queryTime > 1000) {
    console.warn(`Slow query detected: ${queryTime}ms`);
}
```

### Cache Monitoring

```typescript
// Redis connection monitoring
client.on("connect", () => console.log("Redis connected"));
client.on("error", (err) => console.error("Redis error:", err));
client.on("reconnecting", () => console.log("Redis reconnecting"));

// Cache hit/miss tracking
const trackCacheAccess = async (key: string): Promise<any> => {
    const start = Date.now();
    const value = await client.get(key);
    const duration = Date.now() - start;

    console.log(`Cache ${value ? "hit" : "miss"} for ${key} (${duration}ms)`);
    return value;
};
```

## Best Practices

### Service Design

1. **Single Responsibility**: Each service handles one infrastructure concern
2. **Interface-Based**: Always define clear interfaces for services
3. **Environment Awareness**: Adapt behavior based on environment
4. **Error Handling**: Implement comprehensive error handling
5. **Resource Management**: Properly manage connections and resources

### Configuration

1. **Environment Variables**: Use environment-specific configuration
2. **Default Values**: Provide sensible defaults for optional settings
3. **Validation**: Validate configuration at startup
4. **Security**: Never expose sensitive configuration in logs

### Testing

1. **Mock External Dependencies**: Mock databases, Redis, and email services
2. **Test Configuration**: Verify environment-specific behavior
3. **Integration Tests**: Test real connections in integration tests
4. **Error Scenarios**: Test connection failures and recovery

## Related Documentation

- [Database Schema Guide](../db/schema.guide.md)
- [Environment Configuration Guide](../config/env.guide.md)
- [Dependency Injection Guide](../di/container.guide.md)
- [Testing Infrastructure Guide](../testing-infrastructure.md)
