# Logger Adapter Guide

## Overview

The Logger Adapter pattern provides a clean abstraction layer between the application's logging interface and the underlying logging library implementation. This approach follows the Adapter Design Pattern and ensures that the application's business logic remains independent of any specific logging library.

## Architecture

The adapter pattern for logging consists of three main components:

1. **ILoggerTransport Interface** - Generic contract for logging operations
2. **WinstonTransportAdapter** - Concrete implementation using Winston library
3. **LoggerService** - Business logic layer that uses the adapter

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   LoggerService │───▶│ ILoggerTransport │◀───│ WinstonTransport│
│   (Business)    │    │   (Interface)    │    │   (Adapter)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        ▼
                                │                ┌─────────────────┐
                                │                │   Winston       │
                                │                │   (Library)     │
                                │                └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │   Mock Logger   │
                        │   (Testing)     │
                        └─────────────────┘
```

## Interface Definition

The `ILoggerTransport` interface defines the contract that all logging adapters must implement:

```typescript
export interface ILoggerTransport {
    error(message: string, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    info(message: string, meta?: Record<string, any>): void;
    http(message: string, meta?: Record<string, any>): void;
    verbose(message: string, meta?: Record<string, any>): void;
    debug(message: string, meta?: Record<string, any>): void;
    silly(message: string, meta?: Record<string, any>): void;
    child(meta: Record<string, any>): ILoggerTransport;
}
```

## Winston Transport Adapter

### Implementation

```typescript
export class WinstonTransportAdapter implements ILoggerTransport {
    private readonly logger: Logger;

    constructor() {
        this.logger = this.createLogger();
    }

    private createLogger(): Logger {
        const isProduction = NODE_ENV === "production";
        const isTest = NODE_ENV === "test";

        // Environment-specific configuration
        const baseFormats = [
            winston.format.timestamp({
                format: isProduction ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD HH:mm:ss.SSS",
            }),
            winston.format.errors({ stack: true }),
        ];

        // Configure format based on environment
        let logFormat;
        if (isTest) {
            logFormat = winston.format.combine(...baseFormats, winston.format.simple());
        } else if (isProduction) {
            logFormat = winston.format.combine(...baseFormats, winston.format.json());
        } else {
            logFormat = winston.format.combine(
                ...baseFormats,
                winston.format.colorize({ all: true }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
                    return `[${timestamp}] ${level}: ${message}${metaStr}`;
                }),
            );
        }

        return winston.createLogger({
            level: LOG_LEVEL,
            format: logFormat,
            transports: this.createTransports(isTest, isProduction),
            exitOnError: false,
            handleExceptions: true,
            handleRejections: true,
            // ... additional configuration
        });
    }

    // Implement interface methods
    public error(message: string, meta?: Record<string, any>): void {
        this.logger.error(message, meta);
    }

    // ... other log level methods

    public child(meta: Record<string, any>): ILoggerTransport {
        const childLogger = this.logger.child(meta);
        const adapter = Object.create(WinstonTransportAdapter.prototype);
        adapter.logger = childLogger;
        return adapter as ILoggerTransport;
    }
}
```

### Environment-Specific Configuration

#### Test Environment

```typescript
if (isTest) {
    // Silent console transport for tests to reduce noise
    transports.push(
        new winston.transports.Console({
            silent: true,
        }),
    );
}
```

**Features:**

- Silent console output
- Simple format to reduce overhead
- No file logging
- Exception handling disabled

#### Development Environment

```typescript
// Console transport with colorized output
transports.push(new winston.transports.Console());

// Human-readable format with colors
logFormat = winston.format.combine(
    ...baseFormats,
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
        return `[${timestamp}] ${level}: ${message}${metaStr}`;
    }),
);
```

**Features:**

- Colorized console output
- Human-readable format
- Detailed timestamps with milliseconds
- Console-only logging

#### Production Environment

```typescript
if (isProduction) {
    // File transports for production
    transports.push(
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
        }),
        new winston.transports.File({
            filename: "logs/combined.log",
        }),
    );
}

// Structured JSON logging
logFormat = winston.format.combine(...baseFormats, winston.format.json());
```

**Features:**

- Structured JSON format
- File-based logging (error.log, combined.log)
- Exception and rejection handling
- Optimized performance

## Creating Alternative Adapters

The adapter pattern makes it easy to switch logging libraries or create custom implementations:

### Console Adapter (Simple)

```typescript
export class ConsoleTransportAdapter implements ILoggerTransport {
    error(message: string, meta?: Record<string, any>): void {
        console.error(`[ERROR] ${message}`, meta || {});
    }

    warn(message: string, meta?: Record<string, any>): void {
        console.warn(`[WARN] ${message}`, meta || {});
    }

    info(message: string, meta?: Record<string, any>): void {
        console.info(`[INFO] ${message}`, meta || {});
    }

    // ... other methods

    child(meta: Record<string, any>): ILoggerTransport {
        return new ConsoleTransportAdapter(); // Simple implementation
    }
}
```

### Pino Adapter (Alternative Library)

```typescript
import pino from "pino";

export class PinoTransportAdapter implements ILoggerTransport {
    private readonly logger: pino.Logger;

    constructor() {
        this.logger = pino({
            level: LOG_LEVEL,
            transport:
                NODE_ENV === "development"
                    ? {
                          target: "pino-pretty",
                          options: { colorize: true },
                      }
                    : undefined,
        });
    }

    error(message: string, meta?: Record<string, any>): void {
        this.logger.error(meta, message);
    }

    // ... implement other methods

    child(meta: Record<string, any>): ILoggerTransport {
        const childLogger = this.logger.child(meta);
        const adapter = Object.create(PinoTransportAdapter.prototype);
        adapter.logger = childLogger;
        return adapter as ILoggerTransport;
    }
}
```

### Mock Adapter (Testing)

```typescript
export class MockTransportAdapter implements ILoggerTransport {
    public readonly logs: Array<{ level: string; message: string; meta?: any }> = [];

    error(message: string, meta?: Record<string, any>): void {
        this.logs.push({ level: "error", message, meta });
    }

    warn(message: string, meta?: Record<string, any>): void {
        this.logs.push({ level: "warn", message, meta });
    }

    // ... other methods

    child(meta: Record<string, any>): ILoggerTransport {
        return new MockTransportAdapter(); // Returns new instance for isolation
    }

    // Test utility methods
    getErrorLogs(): Array<{ message: string; meta?: any }> {
        return this.logs.filter((log) => log.level === "error");
    }

    getLastLog(): { level: string; message: string; meta?: any } | undefined {
        return this.logs[this.logs.length - 1];
    }

    clear(): void {
        this.logs.length = 0;
    }
}
```

## Dependency Injection Configuration

### Container Setup

```typescript
// src/di/container.ts
import { WinstonTransportAdapter } from "@/adapters/winston-transport.adapter";
import { ILoggerTransport } from "@/services/logger.service";

// Bind the adapter
container.bind<ILoggerTransport>(TYPES.LoggerTransport).to(WinstonTransportAdapter).inSingletonScope();
```

### Type Definitions

```typescript
// src/di/types.ts
export const TYPES = {
    // Logger types
    LoggerTransport: Symbol.for("LoggerTransport"),
    ILoggerService: Symbol.for("ILoggerService"),
} as const;
```

### Environment-Specific Binding

```typescript
// Conditional binding based on environment
if (NODE_ENV === "test") {
    container.bind<ILoggerTransport>(TYPES.LoggerTransport).to(MockTransportAdapter);
} else if (NODE_ENV === "development") {
    container.bind<ILoggerTransport>(TYPES.LoggerTransport).to(ConsoleTransportAdapter);
} else {
    container.bind<ILoggerTransport>(TYPES.LoggerTransport).to(WinstonTransportAdapter);
}
```

## Testing Strategies

### Unit Testing with Mock Adapter

```typescript
describe("Logger Adapter", () => {
    let mockAdapter: MockTransportAdapter;

    beforeEach(() => {
        mockAdapter = new MockTransportAdapter();
        container.unbind(TYPES.LoggerTransport);
        container.bind<ILoggerTransport>(TYPES.LoggerTransport).toConstantValue(mockAdapter);
    });

    it("should log error messages", () => {
        mockAdapter.error("Test error", { userId: 123 });

        const errorLogs = mockAdapter.getErrorLogs();
        expect(errorLogs).toHaveLength(1);
        expect(errorLogs[0].message).toBe("Test error");
        expect(errorLogs[0].meta).toEqual({ userId: 123 });
    });

    it("should create child loggers", () => {
        const childAdapter = mockAdapter.child({ requestId: "abc123" });

        expect(childAdapter).toBeInstanceOf(MockTransportAdapter);
        expect(childAdapter).not.toBe(mockAdapter); // Different instance
    });
});
```

### Integration Testing with Real Adapter

```typescript
describe("Winston Adapter Integration", () => {
    let adapter: WinstonTransportAdapter;

    beforeEach(() => {
        adapter = new WinstonTransportAdapter();
    });

    it("should handle all log levels", () => {
        // These will produce actual log output
        adapter.error("Test error");
        adapter.warn("Test warning");
        adapter.info("Test info");
        adapter.debug("Test debug");

        // No assertions needed - visual verification in test output
    });

    it("should create functional child loggers", () => {
        const childAdapter = adapter.child({ service: "test" });

        // Child should have same interface
        expect(typeof childAdapter.error).toBe("function");
        expect(typeof childAdapter.info).toBe("function");
        expect(typeof childAdapter.child).toBe("function");
    });
});
```

## Adapter Benefits

### 1. Library Independence

The application doesn't depend directly on Winston, making it easy to:

- Switch to different logging libraries (Pino, Bunyan, custom)
- Upgrade or downgrade library versions without affecting business logic
- Test different logging solutions

### 2. Environment Flexibility

Different adapters can be used for different environments:

- **Production**: Full-featured Winston with file logging
- **Development**: Simple console adapter with colors
- **Testing**: Mock adapter for verification
- **CI/CD**: Silent adapter to reduce noise

### 3. Testing Benefits

- Mock adapters for unit testing
- Verification of log calls without external dependencies
- Isolated testing of logging behavior
- Performance testing without I/O overhead

### 4. Configuration Centralization

All logging configuration is centralized in the adapter:

- Format settings
- Transport configuration
- Environment-specific behavior
- Performance optimizations

## Best Practices

### Adapter Implementation

```typescript
// Good - Clean interface implementation
export class CustomTransportAdapter implements ILoggerTransport {
    private readonly logger: SomeLogger;

    constructor() {
        this.logger = this.initializeLogger();
    }

    // Implement all interface methods
    error(message: string, meta?: Record<string, any>): void {
        this.logger.logError(message, meta);
    }

    // Always implement child method correctly
    child(meta: Record<string, any>): ILoggerTransport {
        const childLogger = this.logger.createChild(meta);
        const adapter = Object.create(CustomTransportAdapter.prototype);
        adapter.logger = childLogger;
        return adapter as ILoggerTransport;
    }
}
```

### Error Handling

```typescript
// Good - Handle adapter errors gracefully
export class SafeTransportAdapter implements ILoggerTransport {
    error(message: string, meta?: Record<string, any>): void {
        try {
            this.logger.error(message, meta);
        } catch (loggingError) {
            // Fallback to console if adapter fails
            console.error("Logging adapter failed:", loggingError);
            console.error("Original message:", message, meta);
        }
    }
}
```

### Performance Considerations

```typescript
// Good - Lazy initialization and caching
export class OptimizedTransportAdapter implements ILoggerTransport {
    private logger?: SomeLogger;

    private getLogger(): SomeLogger {
        if (!this.logger) {
            this.logger = this.createLogger();
        }
        return this.logger;
    }

    error(message: string, meta?: Record<string, any>): void {
        // Only initialize when first used
        this.getLogger().error(message, meta);
    }
}
```

## Common Pitfalls

### 1. Breaking Interface Contract

```typescript
// Bad - Missing interface methods
export class IncompleteAdapter implements ILoggerTransport {
    error(message: string, meta?: Record<string, any>): void {
        console.error(message);
    }

    // Missing all other required methods!
}

// Good - Complete implementation
export class CompleteAdapter implements ILoggerTransport {
    // Implement ALL interface methods
    error(message: string, meta?: Record<string, any>): void {
        /* ... */
    }
    warn(message: string, meta?: Record<string, any>): void {
        /* ... */
    }
    info(message: string, meta?: Record<string, any>): void {
        /* ... */
    }
    // ... all other methods
}
```

### 2. Incorrect Child Logger Implementation

```typescript
// Bad - Returns same instance
child(meta: Record<string, any>): ILoggerTransport {
    return this; // Wrong! Should return new instance
}

// Good - Returns new instance with metadata
child(meta: Record<string, any>): ILoggerTransport {
    const childLogger = this.logger.child(meta);
    const adapter = Object.create(WinstonTransportAdapter.prototype);
    adapter.logger = childLogger;
    return adapter as ILoggerTransport;
}
```

### 3. Environment Configuration Issues

```typescript
// Bad - Hardcoded configuration
export class BadAdapter implements ILoggerTransport {
    constructor() {
        this.logger = winston.createLogger({
            level: "debug", // Always debug level
            transports: [new winston.transports.Console()], // Always console
        });
    }
}

// Good - Environment-aware configuration
export class GoodAdapter implements ILoggerTransport {
    constructor() {
        this.logger = winston.createLogger({
            level: LOG_LEVEL, // From environment
            transports: this.createTransports(), // Environment-specific
        });
    }
}
```

## Related Documentation

- [Logger Service Guide](../services/logger-service.guide.md) - Usage patterns and business logic layer
- [Infrastructure Services Guide](../services/infrastructure-services.guide.md) - Overview of all infrastructure services
- [DI Container Guide](../di/container.guide.md) - Dependency injection setup and configuration
- [Environment Configuration Guide](../config/env.guide.md) - Environment variable configuration
- [Testing Guide](../../testing.md) - General testing patterns and best practices
