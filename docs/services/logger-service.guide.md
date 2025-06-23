# Logger Service Guide

## Overview

The `LoggerService` is a core infrastructure service that provides structured logging capabilities throughout the application. It follows clean architecture principles by abstracting the logging implementation through the adapter pattern, making it library-independent and easily testable.

## Architecture

The logger service uses a two-layer architecture:

1. **LoggerService** - Business logic layer that provides the logging interface
2. **LoggerTransport** - Adapter layer that abstracts the underlying logging library (Winston)

This separation ensures that business logic is not coupled to any specific logging library and allows for easy testing and library replacement.

## Interface Definition

```typescript
export interface ILoggerService {
    /**
     * Log error messages - for application errors and exceptions
     */
    error(message: string | Error, meta?: Record<string, any>): void;

    /**
     * Log warning messages - for potentially harmful situations
     */
    warn(message: string, meta?: Record<string, any>): void;

    /**
     * Log info messages - for general application flow information
     */
    info(message: string, meta?: Record<string, any>): void;

    /**
     * Log HTTP requests and responses
     */
    http(message: string, meta?: Record<string, any>): void;

    /**
     * Log verbose messages - for detailed information
     */
    verbose(message: string, meta?: Record<string, any>): void;

    /**
     * Log debug messages - for debugging information
     */
    debug(message: string, meta?: Record<string, any>): void;

    /**
     * Log silly messages - for very detailed debugging
     */
    silly(message: string, meta?: Record<string, any>): void;

    /**
     * Create a child logger with default metadata
     */
    child(defaultMeta: Record<string, any>): ILoggerService;
}
```

## Service Implementation

```typescript
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

    // ... other methods
}
```

## Log Levels

The logger supports multiple log levels following the standard logging hierarchy:

- **error** - Application errors, exceptions, and critical issues
- **warn** - Potentially harmful situations and recoverable errors
- **info** - General application flow and important events
- **http** - HTTP requests, responses, and API interactions
- **verbose** - Detailed application information
- **debug** - Debugging information for development
- **silly** - Very detailed debugging and trace information

## Usage Patterns

### Basic Logging

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

### Error Logging

```typescript
// Log string errors
this.logger.error("Database connection failed", { connectionString, retryCount });

// Log Error objects (automatically extracts message and stack)
try {
    await someDatabaseOperation();
} catch (error) {
    this.logger.error(error, { operation: "user_creation", userId });
}

// Log with structured metadata
this.logger.error("Authentication failed", {
    error: new Error("Invalid credentials"),
    email: user.email,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
});
```

### Structured Logging

```typescript
// Log HTTP requests
this.logger.http("Incoming request", {
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
});

// Log business events
this.logger.info("User login successful", {
    userId: user.id,
    email: user.email,
    loginTime: new Date(),
    sessionId: session.id,
});

// Log performance metrics
this.logger.verbose("Database query completed", {
    query: "findUserByEmail",
    duration: Date.now() - startTime,
    resultCount: results.length,
});
```

### Child Loggers

Use child loggers to add consistent metadata across related operations:

```typescript
export default class AuthenticationService implements IAuthenticationService {
    constructor(
        @inject(TYPES.ILoggerService)
        private readonly logger: ILoggerService,
    ) {}

    async authenticateUser(email: string, password: string): Promise<AuthResult> {
        // Create child logger with request metadata
        const requestLogger = this.logger.child({
            operation: "user_authentication",
            email,
            timestamp: new Date(),
        });

        requestLogger.info("Authentication attempt started");

        try {
            const user = await this.findUserByEmail(email);
            if (!user) {
                requestLogger.warn("User not found");
                throw new Error("Invalid credentials");
            }

            const isValid = await this.validatePassword(password, user.passwordHash);
            if (!isValid) {
                requestLogger.warn("Invalid password");
                throw new Error("Invalid credentials");
            }

            requestLogger.info("Authentication successful", { userId: user.id });
            return { user, token: await this.generateToken(user) };
        } catch (error) {
            requestLogger.error("Authentication failed", { error });
            throw error;
        }
    }
}
```

## Dependency Injection Setup

### Container Configuration

```typescript
// In src/di/container.ts
import { WinstonTransportAdapter } from "@/adapters/winston-transport.adapter";
import LoggerService, { ILoggerService } from "@/services/logger.service";

container.bind<ILoggerTransport>(TYPES.LoggerTransport).to(WinstonTransportAdapter).inSingletonScope();
container.bind<ILoggerService>(TYPES.ILoggerService).to(LoggerService).inSingletonScope();
```

### Type Definitions

```typescript
// In src/di/types.ts
export const TYPES = {
    // Infrastructure Services
    LoggerTransport: Symbol.for("LoggerTransport"),
    ILoggerService: Symbol.for("ILoggerService"),
    // ... other types
} as const;
```

## Testing Patterns

### Mock Logger Service

```typescript
// tests/mocks/services/mock-logger.service.ts
export const createMockLoggerService = (): ILoggerService => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
    child: jest.fn().mockReturnValue({
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        http: jest.fn(),
        verbose: jest.fn(),
        debug: jest.fn(),
        silly: jest.fn(),
        child: jest.fn(),
    }),
});
```

### Unit Testing with Mock Logger

```typescript
describe("UserService", () => {
    let userService: UserService;
    let mockLogger: ILoggerService;
    let mockUserRepository: IUserRepository;

    beforeEach(() => {
        // Reset container
        container.unbindAll();

        // Create mocks
        mockLogger = createMockLoggerService();
        mockUserRepository = createMockUserRepository();

        // Bind mocks
        container.bind<ILoggerService>(TYPES.ILoggerService).toConstantValue(mockLogger);
        container.bind<IUserRepository>(TYPES.IUserRepository).toConstantValue(mockUserRepository);

        // Get service instance
        userService = container.get<UserService>(TYPES.UserService);
    });

    describe("createUser", () => {
        it("should log user creation start and success", async () => {
            const userData = { email: "test@example.com", password: "password123" };
            const createdUser = { id: 1, email: "test@example.com" };

            mockUserRepository.create = jest.fn().mockResolvedValue(createdUser);

            await userService.createUser(userData);

            expect(mockLogger.info).toHaveBeenCalledWith("Creating new user", { email: userData.email });
            expect(mockLogger.info).toHaveBeenCalledWith("User created successfully", {
                userId: createdUser.id,
                email: createdUser.email,
            });
        });

        it("should log errors when user creation fails", async () => {
            const userData = { email: "test@example.com", password: "password123" };
            const error = new Error("Database error");

            mockUserRepository.create = jest.fn().mockRejectedValue(error);

            await expect(userService.createUser(userData)).rejects.toThrow("Database error");

            expect(mockLogger.error).toHaveBeenCalledWith("Failed to create user", {
                error,
                email: userData.email,
            });
        });
    });
});
```

### Integration Testing

```typescript
describe("UserService Integration", () => {
    let userService: UserService;
    let logger: ILoggerService;

    beforeEach(async () => {
        // Use real logger service in integration tests
        logger = container.get<ILoggerService>(TYPES.ILoggerService);
        userService = container.get<UserService>(TYPES.UserService);
    });

    it("should handle user creation with real logging", async () => {
        const userData = { email: "integration@example.com", password: "password123" };

        // This will produce real log output in test environment
        const user = await userService.createUser(userData);

        expect(user).toBeDefined();
        expect(user.email).toBe(userData.email);
    });
});
```

## Environment Configuration

The logger adapts its behavior based on the environment:

### Test Environment

- Silent console output to reduce test noise
- Simplified log format
- No file logging
- Mock-friendly structure

### Development Environment

- Colorized console output
- Human-readable format with timestamps
- Detailed metadata display
- Console-only logging

### Production Environment

- Structured JSON format
- File-based logging (error.log, combined.log)
- Exception and rejection handling
- Optimized performance

## Best Practices

### Do's

- **Always inject logger via DI** - Never create logger instances directly
- **Use appropriate log levels** - Error for failures, info for flow, debug for development
- **Include structured metadata** - Provide context like user IDs, operation names, timestamps
- **Log at service boundaries** - Log when entering/exiting major operations
- **Use child loggers for related operations** - Maintain consistent context
- **Log both success and failure paths** - Track what works and what doesn't
- **Include error details** - Stack traces, error codes, relevant context

```typescript
// Good - structured logging with context
this.logger.info("User authentication started", {
    email: user.email,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
});

// Good - error logging with context
this.logger.error("Database query failed", {
    error,
    query: "findUserByEmail",
    email,
    retryCount,
});
```

### Don'ts

- **Never use console.log/error/warn/info/debug** - Always use the logger service
- **Don't log sensitive information** - Passwords, tokens, personal data
- **Avoid logging in tight loops** - Can impact performance
- **Don't use string concatenation** - Use structured metadata instead
- **Don't ignore log levels** - Respect the logging hierarchy
- **Don't create logger instances manually** - Always use dependency injection

```typescript
// Bad - direct console usage
console.log("User created:", user);

// Bad - sensitive information
this.logger.info("User login", { password, creditCard });

// Bad - string concatenation
this.logger.error("Failed to create user: " + error.message);

// Good - structured and safe
this.logger.info("User created successfully", { userId: user.id, email: user.email });
```

## Troubleshooting

### Common Issues

**Logger not working in tests:**

- Ensure mock logger is bound before importing modules
- Clear require cache if needed: `jest.resetModules()`

**Missing log output:**

- Check LOG_LEVEL environment variable
- Verify logger is properly injected
- Check if running in test environment (logs are silent)

**Type errors:**

- Ensure ILoggerService is imported correctly
- Check DI container bindings
- Verify TYPES symbols are defined

### Debug Steps

1. Check environment configuration in `src/config/env.ts`
2. Verify DI bindings in `src/di/container.ts`
3. Ensure logger is injected in constructor
4. Check log level settings
5. Verify adapter configuration in `WinstonTransportAdapter`

## Related Documentation

- [Logger Adapter Guide](../adapters/logger-adapter.guide.md) - Implementation details for the Winston adapter
- [Infrastructure Services Guide](./infrastructure-services.guide.md) - Overview of all infrastructure services
- [Services Guide](./services.guide.md) - General service patterns and best practices
- [DI Container Guide](../di/container.guide.md) - Dependency injection setup and configuration
- [Environment Configuration Guide](../config/env.guide.md) - Environment variable setup and usage
