# User Service Guide

## Overview

The `UserService` provides business logic for user management operations including CRUD operations, user validation, and user-related business rules. It acts as an intermediary between controllers and the user repository, implementing domain-specific logic and validation.

## Interface

```typescript
export interface IUserService {
    getAllUsers(): Promise<User[]>;
    getUserById(id: number): Promise<User>;
    createUser(data: CreateUserDto): Promise<User>;
    updateUser(id: number, data: UpdateUserDto): Promise<User>;
    deleteUser(id: number): Promise<void>;
}
```

## Dependencies

The service depends on the user repository for data access:

```typescript
@injectable()
export default class UserService implements IUserService {
    constructor(@inject(TYPES.IUserRepository) private readonly userRepo: IUserRepository) {}
}
```

## Core Operations

### Get All Users

```typescript
async getAllUsers(): Promise<User[]> {
    return this.userRepo.findAll();
}
```

**Features:**

- Simple delegation to repository
- Returns all users in the system
- No filtering or pagination (consider adding for production)

### Get User by ID

```typescript
async getUserById(id: number): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new Error("UserNotFound");
    return user;
}
```

**Features:**

- Validates user existence
- Throws descriptive error if user not found
- Returns complete user object

### Create User

```typescript
async createUser(data: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new Error("UserExists");
    return this.userRepo.create(data);
}
```

**Business Rules:**

- Email uniqueness validation
- Delegates password hashing to repository
- Returns created user with generated ID

**Input Validation:**

```typescript
// CreateUserDto structure
interface CreateUserDto {
    email: string;
    password: string;
}
```

### Update User

```typescript
async updateUser(id: number, data: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.update(id, data);
    if (!user) throw new Error("UserNotFound");
    return user;
}
```

**Features:**

- Validates user existence through repository response
- Allows partial updates through `UpdateUserDto`
- Returns updated user object

**Input Validation:**

```typescript
// UpdateUserDto structure (all fields optional)
interface UpdateUserDto {
    email?: string;
    password?: string;
}
```

### Delete User

```typescript
async deleteUser(id: number): Promise<void> {
    const deleted = await this.userRepo.delete(id);
    if (!deleted) throw new Error("UserNotFound");
}
```

**Features:**

- Validates user existence
- Hard delete operation (consider soft delete for production)
- No return value for successful deletion

## Error Handling

### Standard Errors

```typescript
// User not found errors
throw new Error("UserNotFound"); // User doesn't exist
throw new Error("UserExists"); // Email already registered
```

### Error Categories

- **Validation Errors**: Business rule violations (duplicate email)
- **Not Found Errors**: Resource doesn't exist
- **Repository Errors**: Database operation failures (propagated)

## Usage Examples

### Controller Integration

```typescript
@injectable()
export default class UsersController implements IUsersController {
    constructor(@inject(TYPES.IUserService) private readonly userService: IUserService) {}

    async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await this.userService.getAllUsers();
            res.json({
                success: true,
                message: "Users retrieved successfully",
                data: { users },
            });
        } catch (error) {
            throw error; // Let error middleware handle
        }
    }

    async createUser(req: Request, res: Response): Promise<void> {
        try {
            const user = await this.userService.createUser(req.body);
            res.status(201).json({
                success: true,
                message: "User created successfully",
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
            throw error;
        }
    }
}
```

### Service-to-Service Usage

```typescript
@injectable()
export default class AuthenticationService {
    constructor(@inject(TYPES.IUserService) private readonly userService: IUserService) {}

    async validateUserForLogin(email: string): Promise<User> {
        // Use repository directly for login to access password hash
        const user = await this.userRepo.findByEmail(email);
        if (!user) throw new Error("AuthFailed");
        return user;
    }
}
```

## Validation Patterns

### Input Validation

```typescript
// Using Zod schemas for validation
import { createUserSchema, updateUserSchema } from '@/db/user-validation.schema';

async createUser(data: CreateUserDto): Promise<User> {
    // Validate input (typically done in middleware)
    const validData = createUserSchema.parse(data);

    // Business logic validation
    const existing = await this.userRepo.findByEmail(validData.email);
    if (existing) throw new Error("UserExists");

    return this.userRepo.create(validData);
}
```

### Business Rule Validation

```typescript
async updateUser(id: number, data: UpdateUserDto): Promise<User> {
    // Additional business rules for updates
    if (data.email) {
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing && existing.id !== id) {
            throw new Error("EmailAlreadyTaken");
        }
    }

    const user = await this.userRepo.update(id, data);
    if (!user) throw new Error("UserNotFound");
    return user;
}
```

## Testing

### Unit Testing Pattern

```typescript
describe("UserService", () => {
    let mockRepo: jest.Mocked<IUserRepository>;
    let userService: UserService;

    beforeEach(() => {
        mockRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            markEmailAsVerified: jest.fn(),
        };
        userService = new UserService(mockRepo);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("createUser", () => {
        it("should create user successfully", async () => {
            const userData: CreateUserDto = {
                email: "test@example.com",
                password: "password123",
            };
            const expectedUser: User = {
                id: 1,
                email: "test@example.com",
                emailVerified: false,
            };

            mockRepo.findByEmail.mockResolvedValue(null);
            mockRepo.create.mockResolvedValue(expectedUser);

            const result = await userService.createUser(userData);

            expect(result).toEqual(expectedUser);
            expect(mockRepo.findByEmail).toHaveBeenCalledWith("test@example.com");
            expect(mockRepo.create).toHaveBeenCalledWith(userData);
        });

        it("should throw error when user exists", async () => {
            const userData: CreateUserDto = {
                email: "existing@example.com",
                password: "password123",
            };
            const existingUser: User = {
                id: 1,
                email: "existing@example.com",
                emailVerified: true,
            };

            mockRepo.findByEmail.mockResolvedValue(existingUser);

            await expect(userService.createUser(userData)).rejects.toThrow("UserExists");

            expect(mockRepo.findByEmail).toHaveBeenCalledWith("existing@example.com");
            expect(mockRepo.create).not.toHaveBeenCalled();
        });
    });

    describe("getUserById", () => {
        it("should return user when found", async () => {
            const user: User = {
                id: 2,
                email: "found@example.com",
                emailVerified: false,
            };
            mockRepo.findById.mockResolvedValue(user);

            const result = await userService.getUserById(2);

            expect(result).toEqual(user);
            expect(mockRepo.findById).toHaveBeenCalledWith(2);
        });

        it("should throw error when user not found", async () => {
            mockRepo.findById.mockResolvedValue(null);

            await expect(userService.getUserById(999)).rejects.toThrow("UserNotFound");

            expect(mockRepo.findById).toHaveBeenCalledWith(999);
        });
    });
});
```

### Integration Testing

```typescript
describe("UserService Integration", () => {
    let container: Container;
    let userService: IUserService;
    let userRepo: IUserRepository;

    beforeEach(async () => {
        container = createTestContainer();
        userService = container.get<IUserService>(TYPES.IUserService);
        userRepo = container.get<IUserRepository>(TYPES.IUserRepository);

        await cleanDatabase();
    });

    it("should create and retrieve user", async () => {
        const userData: CreateUserDto = {
            email: "integration@test.com",
            password: "testpassword",
        };

        // Create user
        const createdUser = await userService.createUser(userData);
        expect(createdUser.id).toBeDefined();
        expect(createdUser.email).toBe(userData.email);
        expect(createdUser.emailVerified).toBe(false);

        // Retrieve user
        const retrievedUser = await userService.getUserById(createdUser.id);
        expect(retrievedUser).toEqual(createdUser);
    });
});
```

## Performance Considerations

### Repository Delegation

The service primarily delegates to the repository, keeping business logic minimal:

```typescript
// ✅ Good: Simple delegation
async getAllUsers(): Promise<User[]> {
    return this.userRepo.findAll();
}

// ❌ Avoid: Complex logic in simple operations
async getAllUsers(): Promise<User[]> {
    const users = await this.userRepo.findAll();
    // Avoid heavy processing here
    return users.map(user => this.enrichUserData(user));
}
```

### Caching Considerations

For read-heavy operations, consider caching at the service level:

```typescript
@injectable()
export default class UserService implements IUserService {
    constructor(
        @inject(TYPES.IUserRepository) private readonly userRepo: IUserRepository,
        @inject(TYPES.ICacheService) private readonly cacheService: ICacheService,
    ) {}

    async getUserById(id: number): Promise<User> {
        const cacheKey = `user:${id}`;

        // Try cache first
        const cached = await this.cacheService.client.get(cacheKey);
        if (cached) {
            return JSON.parse(cached) as User;
        }

        // Fallback to repository
        const user = await this.userRepo.findById(id);
        if (!user) throw new Error("UserNotFound");

        // Cache for 1 hour
        await this.cacheService.client.setEx(cacheKey, 3600, JSON.stringify(user));

        return user;
    }
}
```

## Security Considerations

### Password Handling

```typescript
// ✅ Good: Let repository handle password hashing
async createUser(data: CreateUserDto): Promise<User> {
    // Repository handles password hashing
    return this.userRepo.create(data);
}

// ❌ Bad: Handling passwords in service
async createUser(data: CreateUserDto): Promise<User> {
    const hashedPassword = await hashPassword(data.password);
    return this.userRepo.create({ ...data, password: hashedPassword });
}
```

### Data Sanitization

```typescript
async updateUser(id: number, data: UpdateUserDto): Promise<User> {
    // Sanitize input data
    const sanitizedData = {
        ...data,
        email: data.email?.toLowerCase().trim(),
    };

    const user = await this.userRepo.update(id, sanitizedData);
    if (!user) throw new Error("UserNotFound");
    return user;
}
```

## Future Enhancements

### Pagination Support

```typescript
interface GetUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

async getAllUsers(options: GetUsersOptions = {}): Promise<PaginatedUsers> {
    return this.userRepo.findMany(options);
}
```

### Soft Delete Support

```typescript
async deleteUser(id: number, soft: boolean = true): Promise<void> {
    if (soft) {
        const updated = await this.userRepo.update(id, {
            deletedAt: new Date()
        });
        if (!updated) throw new Error("UserNotFound");
    } else {
        const deleted = await this.userRepo.delete(id);
        if (!deleted) throw new Error("UserNotFound");
    }
}
```

### Bulk Operations

```typescript
async createUsers(users: CreateUserDto[]): Promise<User[]> {
    // Validate all emails are unique
    const emails = users.map(u => u.email);
    const existing = await this.userRepo.findByEmails(emails);
    if (existing.length > 0) {
        throw new Error("DuplicateEmails");
    }

    return this.userRepo.createMany(users);
}
```

## Best Practices

### Service Design

1. **Keep Services Thin**: Delegate complex operations to repositories
2. **Validate Business Rules**: Implement domain-specific validation
3. **Use Descriptive Errors**: Throw meaningful error messages
4. **Handle Edge Cases**: Check for null/undefined returns from repositories
5. **Maintain Single Responsibility**: Focus on user-related operations only

### Error Handling

1. **Consistent Error Messages**: Use standard error names across the application
2. **Fail Fast**: Validate inputs early and throw errors immediately
3. **Don't Swallow Errors**: Let controllers and middleware handle error responses
4. **Log Important Operations**: Track user creation, updates, and deletions

### Testing

1. **Mock Dependencies**: Always mock repository dependencies
2. **Test Error Paths**: Verify error handling for all edge cases
3. **Use Type-Safe Mocks**: Ensure mocks match interface signatures
4. **Test Business Logic**: Focus on validation and business rule testing

## Related Documentation

- [User Repository Guide](../repositories/user-repository.guide.md)
- [Authentication Service Guide](./authentication-service.guide.md)
- [User Types Guide](../types/user-types.guide.md)
- [User Controller Guide](../controllers/users-controller.guide.md)
