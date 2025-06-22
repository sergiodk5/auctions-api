# Dependency Injection Container Guide

## Overview

This guide covers the dependency injection (DI) container system used in the auctions API, built with Inversify. The DI container provides a centralized way to manage dependencies, promote loose coupling, and enable proper testing through dependency inversion.

## Architecture

The DI system consists of two main files:

- `src/di/container.ts` - Container configuration and bindings
- `src/di/types.ts` - Type definitions (symbols) for dependency resolution

## Key Benefits

- **Loose Coupling**: Components depend on interfaces, not concrete implementations
- **Testability**: Easy to mock dependencies for unit tests
- **Centralized Configuration**: All dependencies configured in one place
- **Type Safety**: Full TypeScript support with interface-based bindings
- **Singleton Management**: Automatic singleton scope for stateful services

## Container Structure

### Scoping Strategy

The container uses **Singleton scope** by default:

```typescript
const container = new Container({ defaultScope: "Singleton" });
```

This ensures that services like database connections, cache services, and repositories maintain state across requests while being memory efficient.

### Binding Layers

The container organizes bindings into logical layers:

1. **External Dependencies** (Mail transporter)
2. **Infrastructure Services** (Database, Cache)
3. **Repositories** (Data access layer)
4. **Services** (Business logic layer)
5. **Controllers** (API endpoints layer)
6. **Middleware** (Cross-cutting concerns)

## Configuration Examples

### 1. External Dependencies

#### Dynamic Mail Provider Configuration

```typescript
container
    .bind<import("nodemailer").Transporter>(TYPES.MailerTransporter)
    .toDynamicValue(() => {
        if (NODE_ENV === "production" && MAILER_PROVIDER === "sendgrid") {
            // SendGrid configuration for production
            return nodemailer.createTransporter(
                nodemailerSendgrid({
                    apiKey: SENDGRID_API_KEY,
                }),
            );
        }
        // SMTP configuration for development/testing
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
    })
    .inSingletonScope();
```

**Key Features:**

- Environment-based provider selection
- Dynamic configuration from environment variables
- Explicit singleton scope for connection reuse

### 2. Infrastructure Services

#### Database and Cache Services

```typescript
// Core infrastructure
container.bind<IDatabaseService>(TYPES.IDatabaseService).to(DatabaseService);
container.bind<ICacheService>(TYPES.ICacheService).to(CacheService);
```

**Usage in Services:**

```typescript
@injectable()
export class SomeService {
    constructor(
        @inject(TYPES.IDatabaseService) private db: IDatabaseService,
        @inject(TYPES.ICacheService) private cache: ICacheService,
    ) {}
}
```

### 3. Repository Layer

#### Data Access Components

```typescript
// User-related repositories
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository);
container.bind<IEmailVerificationRepository>(TYPES.IEmailVerificationRepository).to(EmailVerificationRepository);

// RBAC repositories
container.bind<IPermissionRepository>(TYPES.IPermissionRepository).to(PermissionRepository);
container.bind<IRoleRepository>(TYPES.IRoleRepository).to(RoleRepository);
container.bind<IUserRoleRepository>(TYPES.IUserRoleRepository).to(UserRoleRepository);
container.bind<IUserPermissionRepository>(TYPES.IUserPermissionRepository).to(UserPermissionRepository);

// Token management
container.bind<ITokenRepository>(TYPES.ITokenRepository).to(TokenRepository);
```

**Usage in Services:**

```typescript
@injectable()
export class UserService implements IUserService {
    constructor(
        @inject(TYPES.IUserRepository) private readonly userRepo: IUserRepository,
        @inject(TYPES.IEmailVerificationRepository) private readonly emailRepo: IEmailVerificationRepository,
    ) {}

    async createUser(data: CreateUserDto): Promise<User> {
        // Check if user exists
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) throw new Error("UserExists");

        // Create user and verification token
        const user = await this.userRepo.create(data);
        await this.emailRepo.createVerificationToken(user.id);

        return user;
    }
}
```

### 4. Service Layer

#### Business Logic Services

```typescript
// Core business services
container.bind<IUserService>(TYPES.IUserService).to(UserService);
container.bind<IAuthenticationService>(TYPES.IAuthenticationService).to(AuthenticationService);
container.bind<IAuthorizationService>(TYPES.IAuthorizationService).to(AuthorizationService);

// Domain-specific services
container.bind<IPermissionService>(TYPES.IPermissionService).to(PermissionService);
container.bind<IRoleService>(TYPES.IRoleService).to(RoleService);
container.bind<IValidationService>(TYPES.IValidationService).to(ValidationService);

// External services
container.bind<IMailerService>(TYPES.IMailerService).to(MailerService);
```

**Multi-Dependency Service Example:**

```typescript
@injectable()
export class AuthorizationService implements IAuthorizationService {
    constructor(
        @inject(TYPES.IUserPermissionRepository)
        private readonly userPermissionRepo: IUserPermissionRepository,
        @inject(TYPES.IUserRoleRepository)
        private readonly userRoleRepo: IUserRoleRepository,
        @inject(TYPES.IRoleRepository)
        private readonly roleRepo: IRoleRepository,
    ) {}

    async hasPermission(userId: number, permission: string): Promise<boolean> {
        // Check direct permissions
        const directPermissions = await this.userPermissionRepo.getUserPermissions(userId);
        if (directPermissions.includes(permission)) return true;

        // Check role-based permissions
        const userRoles = await this.userRoleRepo.getUserRoles(userId);
        for (const role of userRoles) {
            const rolePermissions = await this.roleRepo.getRolePermissions(role.id);
            if (rolePermissions.includes(permission)) return true;
        }

        return false;
    }
}
```

### 5. Controller Layer

#### API Endpoint Controllers

```typescript
// API controllers
container.bind<IUsersController>(TYPES.IUsersController).to(UsersController);
container.bind<IAuthController>(TYPES.IAuthController).to(AuthController);
container.bind<IRoleController>(TYPES.IRoleController).to(RoleController);
container.bind<IPermissionController>(TYPES.IPermissionController).to(PermissionController);
```

**Controller Usage Example:**

```typescript
@injectable()
export class UsersController implements IUsersController {
    constructor(
        @inject(TYPES.IUserService) private readonly userService: IUserService,
        @inject(TYPES.IUserRoleRepository) private readonly userRoleRepository: IUserRoleRepository,
    ) {}

    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await this.userService.getAllUsers();
            res.json({
                success: true,
                message: "Users retrieved successfully",
                data: users,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to retrieve users",
            });
        }
    }
}
```

### 6. Middleware Layer

#### Cross-Cutting Concerns

```typescript
// Security middleware
container.bind<IMiddleware>(TYPES.IAuthenticationGuardMiddleware).to(AuthenticationGuardMiddleware);
container.bind<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware).to(AuthorizationMiddleware);

// Rate limiting middleware
container.bind<IMiddleware>(TYPES.IRefreshRateLimiter).to(RefreshRateLimiter);
container.bind<IMiddleware>(TYPES.ILoginRateLimiter).to(LoginRateLimiter);

// Validation middleware
container.bind<IValidationMiddleware>(TYPES.IValidationMiddleware).to(ValidationMiddleware);
```

## Usage Patterns

### 1. Route Configuration

Routes use `container.get()` to resolve dependencies:

```typescript
import container from "@/di/container";
import { TYPES } from "@/di/types";

// Resolve dependencies at module level
const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const usersController = container.get<IUsersController>(TYPES.IUsersController);

const userRoute = Router();

// Protected route with authorization
userRoute.get(
    "/",
    authenticationGuardMiddleware.use.bind(authenticationGuardMiddleware),
    authorizationMiddleware.authorize("users:read"),
    usersController.getAllUsers.bind(usersController),
);

// Route with validation
userRoute.post(
    "/",
    validationMiddleware.validate(createUserSchema),
    authenticationGuardMiddleware.use.bind(authenticationGuardMiddleware),
    authorizationMiddleware.authorize("users:create"),
    usersController.createUser.bind(usersController),
);
```

### 2. Testing with DI

#### Unit Testing with Mocks

```typescript
import { Container } from "inversify";
import { TYPES } from "@/di/types";
import UserService from "@/services/user.service";

describe("UserService", () => {
    let container: Container;
    let userService: UserService;
    let mockUserRepo: jest.Mocked<IUserRepository>;

    beforeEach(() => {
        container = new Container();

        // Create mock repository
        mockUserRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        // Bind mock to container
        container.bind<IUserRepository>(TYPES.IUserRepository).toConstantValue(mockUserRepo);
        container.bind<UserService>(UserService).toSelf();

        // Resolve service with mocked dependencies
        userService = container.get(UserService);
    });

    it("should create user when email is unique", async () => {
        // Arrange
        const userData = { email: "test@example.com", name: "Test User" };
        mockUserRepo.findByEmail.mockResolvedValue(null);
        mockUserRepo.create.mockResolvedValue({ id: 1, ...userData });

        // Act
        const result = await userService.createUser(userData);

        // Assert
        expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(userData.email);
        expect(mockUserRepo.create).toHaveBeenCalledWith(userData);
        expect(result).toEqual({ id: 1, ...userData });
    });
});
```

#### Integration Testing

```typescript
import container from "@/di/container";
import { TYPES } from "@/di/types";

describe("User Integration Tests", () => {
    let userRepo: IUserRepository;
    let emailVerificationRepo: IEmailVerificationRepository;

    beforeAll(() => {
        // Use real container for integration tests
        userRepo = container.get<IUserRepository>(TYPES.IUserRepository);
        emailVerificationRepo = container.get<IEmailVerificationRepository>(TYPES.IEmailVerificationRepository);
    });

    it("should create user and verification token", async () => {
        // Test with real dependencies
        const userData = { email: "integration@test.com", name: "Integration Test" };
        const user = await userRepo.create(userData);
        const token = await emailVerificationRepo.createVerificationToken(user.id);

        expect(user.id).toBeDefined();
        expect(token.userId).toBe(user.id);
    });
});
```

## Best Practices

### 1. Interface Segregation

Create focused interfaces for each service:

```typescript
// Good: Focused interface
export interface IUserService {
    getAllUsers(): Promise<User[]>;
    getUserById(id: number): Promise<User>;
    createUser(data: CreateUserDto): Promise<User>;
    updateUser(id: number, data: UpdateUserDto): Promise<User>;
    deleteUser(id: number): Promise<void>;
}

// Avoid: Monolithic interface
export interface IMegaService {
    // User operations
    getAllUsers(): Promise<User[]>;
    // Role operations
    getAllRoles(): Promise<Role[]>;
    // Permission operations
    getAllPermissions(): Promise<Permission[]>;
    // ... (too many responsibilities)
}
```

### 2. Dependency Declarations

Always declare dependencies in constructor parameters:

```typescript
// Good: Clear dependency declaration
@injectable()
export class AuthenticationService implements IAuthenticationService {
    constructor(
        @inject(TYPES.IUserRepository) private readonly userRepo: IUserRepository,
        @inject(TYPES.ITokenRepository) private readonly tokenRepo: ITokenRepository,
        @inject(TYPES.ICacheService) private readonly cache: ICacheService,
    ) {}
}

// Avoid: Property injection or manual container access
@injectable()
export class BadService {
    private userRepo: IUserRepository;

    constructor() {
        // Don't do this - bypasses DI
        this.userRepo = container.get<IUserRepository>(TYPES.IUserRepository);
    }
}
```

### 3. Type Safety

Use proper TypeScript types for all injected dependencies:

```typescript
// Good: Explicit typing
const userService = container.get<IUserService>(TYPES.IUserService);
const authController = container.get<IAuthController>(TYPES.IAuthController);

// Avoid: Any types
const userService = container.get(TYPES.IUserService) as any;
```

### 4. Error Handling

Handle container resolution errors gracefully:

```typescript
// Good: Proper error handling
try {
    const service = container.get<IUserService>(TYPES.IUserService);
    // Use service
} catch (error) {
    console.error("Failed to resolve UserService:", error);
    throw new Error("Service unavailable");
}

// Better: Validate container configuration at startup
export function validateContainer(): void {
    try {
        // Test critical service resolutions
        container.get<IDatabaseService>(TYPES.IDatabaseService);
        container.get<IUserService>(TYPES.IUserService);
        container.get<IAuthenticationService>(TYPES.IAuthenticationService);
        console.log("✅ DI container validation passed");
    } catch (error) {
        console.error("❌ DI container validation failed:", error);
        process.exit(1);
    }
}
```

## Troubleshooting

### Common Issues

1. **Missing Binding Error**

    ```
    Error: No matching bindings found for serviceIdentifier: Symbol(IUserService)
    ```

    **Solution**: Ensure the service is bound in `container.ts`:

    ```typescript
    container.bind<IUserService>(TYPES.IUserService).to(UserService);
    ```

2. **Circular Dependency Error**

    ```
    Error: Circular dependency detected
    ```

    **Solution**: Review service dependencies and break circular references by extracting shared logic into a separate service.

3. **Injectable Decorator Missing**

    ```
    Error: Missing required @injectable annotation
    ```

    **Solution**: Add `@injectable()` decorator to the class:

    ```typescript
    @injectable()
    export class MyService implements IMyService {
        // ...
    }
    ```

4. **Type Mismatch in Injection**
    ```
    Error: Cannot inject Symbol(IUserRepository) into UserService
    ```
    **Solution**: Verify the interface and implementation match, and the correct TYPES symbol is used.

### Performance Considerations

1. **Singleton Scope**: Use singleton scope for stateful services (databases, caches)
2. **Lazy Loading**: Services are created only when first requested
3. **Memory Management**: Singletons persist for application lifetime
4. **Container Validation**: Validate container configuration at startup to catch errors early

## Integration with Application

The container is initialized and used throughout the application:

1. **Server Startup**: Container is configured in `src/di/container.ts`
2. **Route Registration**: Routes resolve controllers and middleware from container
3. **Request Processing**: Controllers inject services for business logic
4. **Data Access**: Services inject repositories for data operations
5. **Testing**: Test-specific containers with mocked dependencies

This dependency injection system ensures clean architecture, testability, and maintainability throughout the auction API application.
