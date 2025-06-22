# Dependency Injection Types Guide

## Overview

This guide covers the `src/di/types.ts` file, which defines the type registry for dependency injection in the auctions API. The TYPES object contains symbols that serve as unique identifiers for binding and resolving dependencies in the Inversify container.

## Architecture

The types system uses **Symbol.for()** to create unique, global symbols that ensure type safety and prevent naming conflicts in dependency injection.

### Why Symbols?

- **Uniqueness**: Symbols are guaranteed to be unique
- **Global Registry**: `Symbol.for()` creates globally registered symbols
- **Type Safety**: TypeScript can enforce correct symbol usage
- **Debugging**: Meaningful names help identify dependencies in error messages

## Type Categories

The TYPES object organizes dependency identifiers into logical categories:

### 1. Repository Layer

Data access layer identifiers for database operations:

```typescript
const TYPES = {
    // User management repositories
    IUserRepository: Symbol.for("IUserRepository"),
    IEmailVerificationRepository: Symbol.for("IEmailVerificationRepository"),

    // RBAC (Role-Based Access Control) repositories
    IPermissionRepository: Symbol.for("IPermissionRepository"),
    IRoleRepository: Symbol.for("IRoleRepository"),
    IUserRoleRepository: Symbol.for("IUserRoleRepository"),
    IUserPermissionRepository: Symbol.for("IUserPermissionRepository"),

    // Token management repository
    ITokenRepository: Symbol.for("ITokenRepository"),
};
```

**Usage Examples:**

```typescript
// Repository injection in services
@injectable()
export class UserService implements IUserService {
    constructor(
        @inject(TYPES.IUserRepository) private readonly userRepo: IUserRepository,
        @inject(TYPES.IEmailVerificationRepository) private readonly emailRepo: IEmailVerificationRepository,
    ) {}
}

// Container binding
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository);
container.bind<IEmailVerificationRepository>(TYPES.IEmailVerificationRepository).to(EmailVerificationRepository);

// Route-level resolution
const userController = container.get<IUsersController>(TYPES.IUsersController);
```

### 2. Infrastructure Services

Core system services for database, caching, and validation:

```typescript
const TYPES = {
    // Core infrastructure
    IDatabaseService: Symbol.for("IDatabaseService"),
    ICacheService: Symbol.for("ICacheService"),
    IValidationService: Symbol.for("IValidationService"),
};
```

**Usage Examples:**

```typescript
// Database service in repositories
@injectable()
export class UserRepository implements IUserRepository {
    constructor(@inject(TYPES.IDatabaseService) private readonly db: IDatabaseService) {}

    async findAll(): Promise<User[]> {
        return this.db.query<User[]>("SELECT * FROM users");
    }
}

// Cache service in business logic
@injectable()
export class AuthenticationService implements IAuthenticationService {
    constructor(
        @inject(TYPES.ICacheService) private readonly cache: ICacheService,
        @inject(TYPES.IUserRepository) private readonly userRepo: IUserRepository,
    ) {}

    async getUserFromCache(id: number): Promise<User | null> {
        const cached = await this.cache.get(`user:${id}`);
        if (cached) return JSON.parse(cached);

        const user = await this.userRepo.findById(id);
        if (user) {
            await this.cache.set(`user:${id}`, JSON.stringify(user), 3600);
        }
        return user;
    }
}
```

### 3. Business Services

Application business logic services:

```typescript
const TYPES = {
    // User domain services
    IUserService: Symbol.for("IUserService"),
    IAuthenticationService: Symbol.for("IAuthenticationService"),

    // Authorization and security services
    IAuthorizationService: Symbol.for("IAuthorizationService"),
    IPermissionService: Symbol.for("IPermissionService"),
    IRoleService: Symbol.for("IRoleService"),
};
```

**Usage Examples:**

```typescript
// Service composition for complex operations
@injectable()
export class AuthController implements IAuthController {
    constructor(
        @inject(TYPES.IAuthenticationService) private readonly authService: IAuthenticationService,
        @inject(TYPES.IUserService) private readonly userService: IUserService,
        @inject(TYPES.IValidationService) private readonly validationService: IValidationService,
    ) {}

    async login(req: Request, res: Response): Promise<void> {
        // Validate input
        const { email, password } = this.validationService.validateLogin(req.body);

        // Authenticate user
        const { user, tokens } = await this.authService.authenticate(email, password);

        // Update user last login
        await this.userService.updateLastLogin(user.id);

        res.json({
            success: true,
            message: "Login successful",
            data: { user, tokens },
        });
    }
}

// Authorization service with multiple dependencies
@injectable()
export class AuthorizationService implements IAuthorizationService {
    constructor(
        @inject(TYPES.IUserPermissionRepository) private readonly userPermissionRepo: IUserPermissionRepository,
        @inject(TYPES.IUserRoleRepository) private readonly userRoleRepo: IUserRoleRepository,
        @inject(TYPES.IRoleRepository) private readonly roleRepo: IRoleRepository,
    ) {}
}
```

### 4. External Services

External service integrations:

```typescript
const TYPES = {
    // Email services
    IMailerService: Symbol.for("IMailerService"),
    MailerTransporter: Symbol.for("MailerTransporter"),
};
```

**Usage Examples:**

```typescript
// Mailer service injection
@injectable()
export class EmailVerificationService {
    constructor(
        @inject(TYPES.IMailerService) private readonly mailer: IMailerService,
        @inject(TYPES.IEmailVerificationRepository) private readonly emailRepo: IEmailVerificationRepository,
    ) {}

    async sendVerificationEmail(userId: number, email: string): Promise<void> {
        const token = await this.emailRepo.createVerificationToken(userId);

        await this.mailer.sendMail({
            to: email,
            subject: "Email Verification",
            template: "email-verification",
            context: { token: token.token },
        });
    }
}

// Transporter injection in mailer service
@injectable()
export class MailerService implements IMailerService {
    constructor(@inject(TYPES.MailerTransporter) private readonly transporter: nodemailer.Transporter) {}
}
```

### 5. Controller Layer

API endpoint controllers:

```typescript
const TYPES = {
    // API controllers
    IUsersController: Symbol.for("IUsersController"),
    IAuthController: Symbol.for("IAuthController"),
    IRoleController: Symbol.for("IRoleController"),
    IPermissionController: Symbol.for("IPermissionController"),
};
```

**Usage Examples:**

```typescript
// Route registration with controller injection
import container from "@/di/container";
import { TYPES } from "@/di/types";

const usersController = container.get<IUsersController>(TYPES.IUsersController);
const authController = container.get<IAuthController>(TYPES.IAuthController);

const userRoute = Router();

// User management endpoints
userRoute.get("/", usersController.getAllUsers.bind(usersController));
userRoute.get("/:id", usersController.getUserById.bind(usersController));
userRoute.post("/", usersController.createUser.bind(usersController));

// Authentication endpoints
const authRoute = Router();
authRoute.post("/login", authController.login.bind(authController));
authRoute.post("/register", authController.register.bind(authController));
```

### 6. Middleware Layer

Cross-cutting concern middleware:

```typescript
const TYPES = {
    // Security middleware
    IAuthenticationGuardMiddleware: Symbol.for("IAuthenticationGuardMiddleware"),
    IAuthorizationMiddleware: Symbol.for("IAuthorizationMiddleware"),

    // Rate limiting middleware
    IRefreshRateLimiter: Symbol.for("IRefreshRateLimiter"),
    ILoginRateLimiter: Symbol.for("ILoginRateLimiter"),

    // Validation middleware
    IValidationMiddleware: Symbol.for("IValidationMiddleware"),
};
```

**Usage Examples:**

```typescript
// Middleware chain composition
const authenticationGuard = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const loginRateLimiter = container.get<IMiddleware>(TYPES.ILoginRateLimiter);

// Protected route with full middleware stack
userRoute.post(
    "/",
    validationMiddleware.validate(createUserSchema),
    loginRateLimiter.use.bind(loginRateLimiter),
    authenticationGuard.use.bind(authenticationGuard),
    authorizationMiddleware.authorize("users:create"),
    usersController.createUser.bind(usersController),
);

// Authorization middleware with permission checking
@injectable()
export class AuthorizationMiddleware implements IAuthorizationMiddleware {
    constructor(@inject(TYPES.IAuthorizationService) private readonly authService: IAuthorizationService) {}

    authorize(permission: string) {
        return async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const hasPermission = await this.authService.hasPermission(userId, permission);
            if (!hasPermission) {
                return res.status(403).json({ message: "Forbidden" });
            }

            next();
        };
    }
}
```

## Naming Conventions

### Symbol Naming Pattern

All symbols follow the pattern: `I{ServiceName}{Layer}` where layer is optional:

```typescript
// ✅ Good naming conventions
IUserRepository: Symbol.for("IUserRepository"),           // Repository layer
IUserService: Symbol.for("IUserService"),                 // Service layer
IUsersController: Symbol.for("IUsersController"),         // Controller layer
IDatabaseService: Symbol.for("IDatabaseService"),         // Infrastructure
IAuthenticationGuardMiddleware: Symbol.for("IAuthenticationGuardMiddleware"), // Middleware

// ❌ Avoid inconsistent naming
UserRepo: Symbol.for("UserRepo"),                         // Missing 'I' prefix
IUser: Symbol.for("IUser"),                              // Too generic
DatabaseService: Symbol.for("DatabaseService"),          // Missing 'I' prefix
```

### Interface Alignment

Symbol names should match their corresponding interface names:

```typescript
// types.ts
IUserService: Symbol.for("IUserService"),

// user.service.ts
export interface IUserService {
    getAllUsers(): Promise<User[]>;
    // ...
}

@injectable()
export default class UserService implements IUserService {
    // ...
}

// container.ts
container.bind<IUserService>(TYPES.IUserService).to(UserService);
```

## Usage Patterns

### 1. Service Injection Pattern

Standard service dependency injection:

```typescript
@injectable()
export class ComplexService {
    constructor(
        @inject(TYPES.IUserRepository) private readonly userRepo: IUserRepository,
        @inject(TYPES.IRoleRepository) private readonly roleRepo: IRoleRepository,
        @inject(TYPES.ICacheService) private readonly cache: ICacheService,
        @inject(TYPES.IMailerService) private readonly mailer: IMailerService,
    ) {}
}
```

### 2. Container Resolution Pattern

Direct container resolution in routes:

```typescript
// Route file
import container from "@/di/container";
import { TYPES } from "@/di/types";

const controller = container.get<IUsersController>(TYPES.IUsersController);
const middleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);
```

### 3. Testing Pattern

Mock injection for unit tests:

```typescript
describe("UserService", () => {
    let testContainer: Container;
    let userService: UserService;
    let mockUserRepo: jest.Mocked<IUserRepository>;

    beforeEach(() => {
        testContainer = new Container();

        // Create mocks
        mockUserRepo = createMockUserRepository();

        // Bind mocks using same TYPES
        testContainer.bind<IUserRepository>(TYPES.IUserRepository).toConstantValue(mockUserRepo);
        testContainer.bind<UserService>(UserService).toSelf();

        // Resolve with mocked dependencies
        userService = testContainer.get(UserService);
    });
});
```

## Best Practices

### 1. Consistent Symbol Usage

Always use TYPES symbols, never create symbols directly:

```typescript
// ✅ Good: Use TYPES registry
container.bind<IUserService>(TYPES.IUserService).to(UserService);
const service = container.get<IUserService>(TYPES.IUserService);

// ❌ Bad: Direct symbol creation
const UserServiceSymbol = Symbol.for("UserService");
container.bind<IUserService>(UserServiceSymbol).to(UserService);
```

### 2. Type Safety

Always specify generic types when resolving dependencies:

```typescript
// ✅ Good: Explicit typing
const userService = container.get<IUserService>(TYPES.IUserService);
const authController = container.get<IAuthController>(TYPES.IAuthController);

// ❌ Bad: Missing types
const userService = container.get(TYPES.IUserService);
const authController = container.get(TYPES.IAuthController) as any;
```

### 3. Import Organization

Import TYPES alongside container for clarity:

```typescript
// ✅ Good: Clear imports
import container from "@/di/container";
import { TYPES } from "@/di/types";

// ❌ Unclear: Separate imports or missing TYPES
import container from "@/di/container";
// Later in file...
import { TYPES } from "@/di/types";
```

### 4. Error Prevention

Validate that all required TYPES are defined:

```typescript
// Validation helper for critical services
export function validateRequiredTypes(): void {
    const requiredTypes = [
        TYPES.IDatabaseService,
        TYPES.IUserRepository,
        TYPES.IAuthenticationService,
        TYPES.IUsersController,
    ];

    for (const type of requiredTypes) {
        if (!type) {
            throw new Error(`Required type symbol is undefined`);
        }
    }
}
```

## Adding New Dependencies

### Step-by-Step Process

1. **Define Interface** (if not exists):

    ```typescript
    // services/auction.service.ts
    export interface IAuctionService {
        createAuction(data: CreateAuctionDto): Promise<Auction>;
        // ...
    }
    ```

2. **Add Type Symbol**:

    ```typescript
    // di/types.ts
    const TYPES = {
        // ...existing types...
        IAuctionService: Symbol.for("IAuctionService"),
        IAuctionRepository: Symbol.for("IAuctionRepository"),
    };
    ```

3. **Update Container Bindings**:

    ```typescript
    // di/container.ts
    container.bind<IAuctionRepository>(TYPES.IAuctionRepository).to(AuctionRepository);
    container.bind<IAuctionService>(TYPES.IAuctionService).to(AuctionService);
    ```

4. **Use in Dependency Injection**:
    ```typescript
    // services/auction.service.ts
    @injectable()
    export class AuctionService implements IAuctionService {
        constructor(@inject(TYPES.IAuctionRepository) private readonly auctionRepo: IAuctionRepository) {}
    }
    ```

### Dependency Validation

Ensure new dependencies are properly configured:

```typescript
// Test new dependency resolution
try {
    const auctionService = container.get<IAuctionService>(TYPES.IAuctionService);
    console.log("✅ AuctionService resolved successfully");
} catch (error) {
    console.error("❌ Failed to resolve AuctionService:", error);
}
```

## Troubleshooting

### Common Type-Related Issues

1. **Symbol Not Found**:

    ```
    Error: No matching bindings found for serviceIdentifier: Symbol(IAuctionService)
    ```

    **Solution**: Verify the symbol exists in TYPES and is bound in container.

2. **Type Mismatch**:

    ```
    Error: Cannot assign IUserService to UserService
    ```

    **Solution**: Ensure interface and implementation match, check import paths.

3. **Missing Export**:
    ```
    Error: TYPES is undefined
    ```
    **Solution**: Verify TYPES is properly exported from `di/types.ts`.

### Debugging Tips

1. **Log Available Bindings**:

    ```typescript
    console.log("Container bindings:", container.getAll(TYPES.IUserService));
    ```

2. **Validate Symbol Registry**:

    ```typescript
    Object.entries(TYPES).forEach(([key, symbol]) => {
        console.log(`${key}: ${symbol.toString()}`);
    });
    ```

3. **Check Container State**:
    ```typescript
    console.log("Container has bindings:", container.isBound(TYPES.IUserService));
    ```

The TYPES registry serves as the central nervous system for dependency injection, ensuring type safety and proper dependency resolution throughout the auction API application.
