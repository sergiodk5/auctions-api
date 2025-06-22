# User Repository Guide

## Overview

The `UserRepository` handles all database operations related to user accounts, including authentication, profile management, and email verification status. It implements secure password handling and provides optimized queries for user data access.

## Interface Definition

```typescript
export interface IUserRepository {
    findAll(): Promise<User[]>;
    findById(id: number): Promise<User | undefined>;
    findByEmail(email: string): Promise<User | undefined>;
    create(data: CreateUserDto): Promise<User>;
    update(id: number, data: Partial<CreateUserDto>): Promise<User | undefined>;
    delete(id: number): Promise<boolean>;
    markEmailAsVerified(id: number): Promise<void>;
}
```

## Implementation Details

### Dependencies

- **Database Service**: Drizzle ORM database connection
- **Password Utilities**: From `@/utils/password.util`
- **User Schema**: From `@/db/users.schema`

### Constructor

```typescript
@injectable()
export default class UserRepository implements IUserRepository {
    constructor(@inject(TYPES.IDatabaseService) private readonly databaseService: IDatabaseService) {}
}
```

## Method Documentation

### findAll()

Returns all users with public fields only (excludes passwords).

```typescript
async findAll(): Promise<User[]>
```

**Returns**: Array of users without sensitive information
**Use Cases**: Admin user listing, user management interfaces

**Example**:

```typescript
const users = await userRepo.findAll();
// Returns: [{ id: 1, email: "user@example.com", emailVerified: true, emailVerifiedAt: Date }]
```

### findById(id)

Finds a user by their unique ID, returning public fields only.

```typescript
async findById(id: number): Promise<User | undefined>
```

**Parameters**:

- `id`: Unique user identifier

**Returns**: User object or `undefined` if not found
**Use Cases**: Profile viewing, user management

**Example**:

```typescript
const user = await userRepo.findById(1);
if (user) {
    console.log(`Found user: ${user.email}`);
} else {
    console.log("User not found");
}
```

### findByEmail(email)

Finds a user by email address, **includes password** for authentication purposes.

```typescript
async findByEmail(email: string): Promise<User | undefined>
```

**Parameters**:

- `email`: User's email address

**Returns**: User object with password or `undefined` if not found
**Use Cases**: Authentication, login verification
**Security Note**: This is the only method that returns password data

**Example**:

```typescript
const user = await userRepo.findByEmail("user@example.com");
if (user && (await comparePassword(inputPassword, user.password))) {
    // Authentication successful
}
```

### create(data)

Creates a new user with automatic password hashing.

```typescript
async create(data: CreateUserDto): Promise<User>
```

**Parameters**:

- `data`: User creation data containing email and password

**Returns**: Created user object (without password)
**Side Effects**: Automatically hashes the password before storage

**Example**:

```typescript
const userData: CreateUserDto = {
    email: "newuser@example.com",
    password: "securepassword123",
};

const newUser = await userRepo.create(userData);
// Password is automatically hashed before storage
// Returns user without password field
```

### update(id, data)

Updates user information for the specified user ID.

```typescript
async update(id: number, data: Partial<CreateUserDto>): Promise<User | undefined>
```

**Parameters**:

- `id`: User ID to update
- `data`: Partial user data to update

**Returns**: Updated user object or `undefined` if user not found
**Note**: Currently updates raw data - password hashing not implemented for updates

**Example**:

```typescript
const updated = await userRepo.update(1, {
    email: "updated@example.com",
});

if (updated) {
    console.log("User updated successfully");
}
```

### delete(id)

Permanently deletes a user from the database.

```typescript
async delete(id: number): Promise<boolean>
```

**Parameters**:

- `id`: User ID to delete

**Returns**: `true` if user was deleted, `false` if user didn't exist
**Warning**: This is a hard delete operation

**Example**:

```typescript
const deleted = await userRepo.delete(1);
if (deleted) {
    console.log("User deleted successfully");
} else {
    console.log("User not found or already deleted");
}
```

### markEmailAsVerified(id)

Updates the email verification status for a user.

```typescript
async markEmailAsVerified(id: number): Promise<void>
```

**Parameters**:

- `id`: User ID to mark as verified

**Side Effects**:

- Sets `emailVerified` to `true`
- Sets `emailVerifiedAt` to current timestamp

**Example**:

```typescript
await userRepo.markEmailAsVerified(userId);
// User's email is now marked as verified with timestamp
```

## Security Considerations

### Password Handling

1. **Automatic Hashing**: Passwords are automatically hashed during `create()`
2. **Selective Exposure**: Only `findByEmail()` returns password data
3. **Update Gap**: Password updates need manual hashing (improvement needed)

```typescript
// Current create operation (secure)
const user = await userRepo.create({ email, password }); // Auto-hashed

// Update password (needs improvement)
const hashedPassword = await hashPassword(newPassword);
await userRepo.update(userId, { password: hashedPassword });
```

### Data Exposure

```typescript
// Public methods (no password)
findAll() → { id, email, emailVerified, emailVerifiedAt }
findById() → { id, email, emailVerified, emailVerifiedAt }

// Authentication method (includes password)
findByEmail() → { id, email, password, emailVerified, emailVerifiedAt }
```

## Usage Patterns

### User Registration Flow

```typescript
class AuthenticationService {
    async register(data: CreateUserDto): Promise<User> {
        // Check if user exists
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) throw new Error("User already exists");

        // Create user (password auto-hashed)
        const user = await this.userRepo.create(data);

        // Generate verification email
        await this.generateVerificationEmail(user.id, user.email);

        return user;
    }
}
```

### Authentication Flow

```typescript
class AuthenticationService {
    async login(email: string, password: string): Promise<AuthResult> {
        // Get user with password
        const user = await this.userRepo.findByEmail(email);
        if (!user) throw new Error("Invalid credentials");

        // Verify password
        const isValid = await comparePassword(password, user.password);
        if (!isValid) throw new Error("Invalid credentials");

        // Generate tokens
        return this.generateTokens(user);
    }
}
```

### Email Verification Flow

```typescript
class AuthenticationService {
    async verifyEmail(token: string): Promise<void> {
        // Validate token and get user ID
        const verification = await this.emailVerificationRepo.findByToken(token);
        if (!verification) throw new Error("Invalid token");

        // Mark email as verified
        await this.userRepo.markEmailAsVerified(verification.userId);

        // Clean up verification token
        await this.emailVerificationRepo.markAsVerified(verification.id);
    }
}
```

## Testing Strategies

### Unit Testing

```typescript
describe("UserRepository", () => {
    let mockDb: jest.Mocked<any>;
    let userRepo: IUserRepository;

    beforeEach(() => {
        mockDb = {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            returning: jest.fn(),
            values: jest.fn(),
        };

        const databaseService = { db: mockDb };
        userRepo = new UserRepository(databaseService as any);
    });

    it("should create user with hashed password", async () => {
        const userData = { email: "test@example.com", password: "password123" };
        const hashedUser = { id: 1, email: userData.email, emailVerified: false };

        mockDb.returning.mockResolvedValue([hashedUser]);

        const result = await userRepo.create(userData);

        expect(mockDb.insert).toHaveBeenCalledWith(usersTable);
        expect(mockDb.values).toHaveBeenCalledWith({
            email: userData.email,
            password: expect.stringMatching(/^\$/), // bcrypt hash pattern
        });
        expect(result).toEqual(hashedUser);
    });
});
```

### Integration Testing with Mocks

```typescript
import { MockUserRepository } from "@tests/mocks/repositories/mock-user.repository";

describe("User Integration Tests", () => {
    let userRepo: MockUserRepository;

    beforeEach(() => {
        userRepo = MockUserRepository.getInstance();
        MockUserRepository.configureInstance({ hashPasswords: true });
        userRepo.clearUsers();
    });

    it("should handle complete user lifecycle", async () => {
        // Create user
        const userData = { email: "test@example.com", password: "password123" };
        const user = await userRepo.create(userData);

        expect(user.email).toBe(userData.email);
        expect(user.id).toBeDefined();

        // Verify password was hashed
        const userWithPassword = userRepo.findUserWithPassword(userData.email);
        expect(userWithPassword?.password).toBe("hashed_password123");

        // Update user
        const updated = await userRepo.update(user.id, { email: "new@example.com" });
        expect(updated?.email).toBe("new@example.com");

        // Mark verified
        await userRepo.markEmailAsVerified(user.id);
        const verified = await userRepo.findById(user.id);
        expect(verified?.emailVerified).toBe(true);

        // Delete user
        const deleted = await userRepo.delete(user.id);
        expect(deleted).toBe(true);

        // Verify deletion
        const notFound = await userRepo.findById(user.id);
        expect(notFound).toBeUndefined();
    });
});
```

## Performance Considerations

### Query Optimization

1. **Index Usage**: Queries use indexed columns (id, email)
2. **Selective Fields**: Returns only necessary fields to reduce data transfer
3. **Single Queries**: Each method performs single database operation

### Caching Opportunities

```typescript
// Potential caching for frequently accessed users
class CachedUserRepository extends UserRepository {
    constructor(
        @inject(TYPES.IDatabaseService) db: IDatabaseService,
        @inject(TYPES.ICacheService) private cache: ICacheService,
    ) {
        super(db);
    }

    async findById(id: number): Promise<User | undefined> {
        const cacheKey = `user:${id}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const user = await super.findById(id);
        if (user) {
            await this.cache.setEx(cacheKey, 300, JSON.stringify(user)); // 5 min cache
        }

        return user;
    }
}
```

## Common Issues and Solutions

### Issue: Password Not Hashed on Update

**Problem**: `update()` method doesn't hash passwords automatically

**Solution**: Hash password before calling update

```typescript
// Incorrect
await userRepo.update(userId, { password: "newpassword" });

// Correct
const hashedPassword = await hashPassword("newpassword");
await userRepo.update(userId, { password: hashedPassword });
```

### Issue: Accidental Password Exposure

**Problem**: Using wrong method for profile display

**Solution**: Use appropriate method for use case

```typescript
// Incorrect - exposes password
const user = await userRepo.findByEmail(email); // Has password field

// Correct - safe for profiles
const user = await userRepo.findById(userId); // No password field
```

### Issue: Handling Non-Existent Users

**Problem**: Not checking for undefined returns

**Solution**: Always check for undefined

```typescript
// Incorrect
const user = await userRepo.findById(userId);
console.log(user.email); // Potential TypeError

// Correct
const user = await userRepo.findById(userId);
if (user) {
    console.log(user.email);
} else {
    throw new Error("User not found");
}
```

## Future Improvements

### Planned Enhancements

1. **Password Update Security**: Automatic hashing in update method
2. **Soft Deletes**: Replace hard deletes with soft delete functionality
3. **Audit Trail**: Track user data changes
4. **Query Optimization**: Add caching for frequently accessed users
5. **Profile Fields**: Support additional user profile fields

### Breaking Changes to Consider

1. **Password Hashing in Updates**: Will change update behavior
2. **Soft Delete Implementation**: Will change delete return semantics
3. **Profile Expansion**: May require schema migrations

This UserRepository provides a secure, efficient foundation for user data management with clear patterns for authentication, profile management, and data protection.
