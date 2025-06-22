# Utils Directory Guide

## Overview

This guide covers the utility functions and helper modules in the `src/utils/` directory. These utilities provide reusable functionality for common operations across the auctions API application.

## Architecture

The utils directory contains focused, single-purpose utility modules that:

- Provide reusable functions for common operations
- Abstract complex implementations behind simple interfaces
- Ensure consistent behavior across the application
- Enable easy testing and mocking
- Follow functional programming principles where possible

## Available Utilities

### Password Utility (`password.util.ts`)

The password utility provides secure password hashing and comparison functionality using bcrypt.

#### Core Functions

```typescript
// Hash a plain text password
export async function hashPassword(password: string): Promise<string>;

// Compare a plain text password with a hashed password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean>;
```

#### Security Features

- **Salt Rounds**: Uses 10 salt rounds for bcrypt hashing (industry standard)
- **Async Operations**: All operations are asynchronous for non-blocking performance
- **Error Handling**: Graceful error handling with meaningful error messages
- **Environment Awareness**: Suppresses console logging in test environment

## Usage Examples

### 1. Password Hashing

#### User Registration

```typescript
import { hashPassword } from "@/utils/password.util";

@injectable()
export class UserRepository implements IUserRepository {
    async create(data: CreateUserDto): Promise<User> {
        // Hash password before storing
        const hashedPassword = await hashPassword(data.password);

        const [user] = await this.databaseService.db
            .insert(usersTable)
            .values({
                email: data.email,
                password: hashedPassword,
            })
            .returning({
                id: usersTable.id,
                email: usersTable.email,
                // password field excluded from return for security
            });

        return user;
    }
}
```

#### Password Reset

```typescript
import { hashPassword } from "@/utils/password.util";

@injectable()
export class AuthenticationService implements IAuthenticationService {
    async resetPassword(token: string, newPassword: string): Promise<void> {
        // Validate reset token
        const payload = this.validatePasswordResetToken(token);

        // Hash the new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user's password
        await this.userRepo.update(payload.userId, {
            password: hashedPassword,
        });

        // Invalidate the reset token
        await this.invalidateResetToken(token);
    }
}
```

#### Database Seeding

```typescript
import { hashPassword } from "@/utils/password.util";

export async function seedUsers(): Promise<void> {
    const users = [
        { email: "admin@example.com", role: "admin" },
        { email: "user@example.com", role: "user" },
    ];

    for (const userData of users) {
        // Use consistent password for all seed users
        const hashedPassword = await hashPassword("password123");

        await db.insert(usersTable).values({
            email: userData.email,
            password: hashedPassword,
            emailVerified: true,
        });
    }
}
```

### 2. Password Comparison

#### User Authentication

```typescript
import { comparePassword } from "@/utils/password.util";

@injectable()
export class AuthenticationService implements IAuthenticationService {
    async authenticate(email: string, password: string): Promise<AuthResult> {
        // Find user by email
        const user = await this.userRepo.findByEmail(email);
        if (!user?.password) {
            throw new Error("AuthFailed");
        }

        // Compare provided password with stored hash
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            throw new Error("AuthFailed");
        }

        // Generate tokens for authenticated user
        const tokens = await this.generateTokens(user.id);

        return { user, tokens };
    }
}
```

#### Change Password Validation

```typescript
import { comparePassword, hashPassword } from "@/utils/password.util";

@injectable()
export class UserService implements IUserService {
    async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
        // Get current user
        const user = await this.userRepo.findById(userId);
        if (!user?.password) {
            throw new Error("UserNotFound");
        }

        // Verify current password
        const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error("InvalidCurrentPassword");
        }

        // Hash and update new password
        const hashedNewPassword = await hashPassword(newPassword);
        await this.userRepo.update(userId, {
            password: hashedNewPassword,
        });
    }
}
```

## Testing Patterns

### Unit Testing with Mocks

```typescript
import { hashPassword, comparePassword } from "@/utils/password.util";
import * as passwordUtils from "@/utils/password.util";

// Mock the entire password utility module
jest.mock("@/utils/password.util");

describe("AuthenticationService", () => {
    let authService: AuthenticationService;
    let mockUserRepo: jest.Mocked<IUserRepository>;

    beforeEach(() => {
        // Setup mocked password utilities
        (passwordUtils.hashPassword as jest.Mock).mockImplementation(async (password: string) => `hashed_${password}`);
        (passwordUtils.comparePassword as jest.Mock).mockImplementation(
            async (password: string, hash: string) => hash === `hashed_${password}`,
        );
    });

    it("should authenticate user with valid credentials", async () => {
        // Arrange
        const email = "test@example.com";
        const password = "password123";
        const hashedPassword = "hashed_password123";

        mockUserRepo.findByEmail.mockResolvedValue({
            id: 1,
            email,
            password: hashedPassword,
        });

        (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);

        // Act
        const result = await authService.authenticate(email, password);

        // Assert
        expect(passwordUtils.comparePassword).toHaveBeenCalledWith(password, hashedPassword);
        expect(result.user.email).toBe(email);
    });

    it("should reject authentication with invalid password", async () => {
        // Arrange
        const email = "test@example.com";
        const password = "wrongpassword";

        mockUserRepo.findByEmail.mockResolvedValue({
            id: 1,
            email,
            password: "hashed_password123",
        });

        (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

        // Act & Assert
        await expect(authService.authenticate(email, password)).rejects.toThrow("AuthFailed");
    });
});
```

### Integration Testing

```typescript
import { hashPassword, comparePassword } from "@/utils/password.util";

describe("Password Utility Integration", () => {
    it("should hash and verify passwords correctly", async () => {
        const password = "mySecurePassword123!";

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Verify the hash is different from original
        expect(hashedPassword).not.toBe(password);
        expect(hashedPassword).toMatch(/^\$2[ayb]\$\d+\$/); // bcrypt format

        // Verify correct password comparison
        const isValid = await comparePassword(password, hashedPassword);
        expect(isValid).toBe(true);

        // Verify incorrect password comparison
        const isInvalid = await comparePassword("wrongpassword", hashedPassword);
        expect(isInvalid).toBe(false);
    });

    it("should generate different hashes for same password", async () => {
        const password = "samePassword";

        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);

        // Hashes should be different due to salting
        expect(hash1).not.toBe(hash2);

        // But both should validate correctly
        expect(await comparePassword(password, hash1)).toBe(true);
        expect(await comparePassword(password, hash2)).toBe(true);
    });
});
```

## Best Practices

### 1. Security Guidelines

```typescript
// ✅ Good: Always hash passwords before storage
const hashedPassword = await hashPassword(userInput.password);
await userRepo.create({ email, password: hashedPassword });

// ❌ Bad: Never store plain text passwords
await userRepo.create({ email, password: userInput.password });

// ✅ Good: Use comparePassword for verification
const isValid = await comparePassword(inputPassword, storedHash);

// ❌ Bad: Never compare plain text or implement custom comparison
const isValid = inputPassword === storedPassword;
```

### 2. Error Handling

```typescript
// ✅ Good: Handle hashing errors gracefully
async function createUser(userData: CreateUserDto): Promise<User> {
    try {
        const hashedPassword = await hashPassword(userData.password);
        return await userRepo.create({ ...userData, password: hashedPassword });
    } catch (error) {
        if (error.message === "Failed to hash password") {
            throw new Error("Unable to process password. Please try again.");
        }
        throw error;
    }
}

// ✅ Good: Handle comparison errors
async function authenticateUser(email: string, password: string): Promise<User> {
    try {
        const user = await userRepo.findByEmail(email);
        if (!user || !(await comparePassword(password, user.password))) {
            throw new Error("AuthFailed");
        }
        return user;
    } catch (error) {
        // Don't leak specific error details for security
        throw new Error("AuthFailed");
    }
}
```

### 3. Performance Considerations

```typescript
// ✅ Good: Use async/await for non-blocking operations
async function bulkCreateUsers(users: CreateUserDto[]): Promise<User[]> {
    // Hash all passwords concurrently
    const hashPromises = users.map((user) => hashPassword(user.password));
    const hashedPasswords = await Promise.all(hashPromises);

    // Create users with hashed passwords
    const usersWithHashedPasswords = users.map((user, index) => ({
        ...user,
        password: hashedPasswords[index],
    }));

    return await userRepo.createMany(usersWithHashedPasswords);
}

// ❌ Bad: Sequential hashing blocks execution
async function bulkCreateUsersSequential(users: CreateUserDto[]): Promise<User[]> {
    const processedUsers = [];
    for (const user of users) {
        const hashedPassword = await hashPassword(user.password);
        processedUsers.push({ ...user, password: hashedPassword });
    }
    return await userRepo.createMany(processedUsers);
}
```

### 4. Testing Best Practices

```typescript
// ✅ Good: Mock password utilities in unit tests
jest.mock("@/utils/password.util", () => ({
    hashPassword: jest.fn().mockImplementation(async (pwd) => `hashed_${pwd}`),
    comparePassword: jest.fn().mockResolvedValue(true),
}));

// ✅ Good: Test real password utilities in integration tests
describe("Password Integration", () => {
    // Don't mock - test real functionality
    it("should handle real password operations", async () => {
        const password = "realPassword123";
        const hash = await hashPassword(password);
        expect(await comparePassword(password, hash)).toBe(true);
    });
});
```

## Adding New Utilities

### Guidelines for New Utility Functions

1. **Single Responsibility**: Each utility should have one clear purpose
2. **Pure Functions**: Prefer pure functions when possible (no side effects)
3. **Async When Needed**: Use async/await for I/O operations
4. **Error Handling**: Provide meaningful error messages
5. **Testing**: Include comprehensive unit tests
6. **Documentation**: Document parameters, return values, and usage examples

### Example: Adding a New Utility

```typescript
// src/utils/string.util.ts
/**
 * Generates a random string of specified length
 * @param length - The length of the string to generate
 * @param charset - The character set to use (default: alphanumeric)
 * @returns A random string
 */
export function generateRandomString(
    length: number,
    charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
): string {
    let result = "";
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
}

/**
 * Slugifies a string for URL-safe usage
 * @param text - The text to slugify
 * @returns A URL-safe slug
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-"); // Replace multiple hyphens with single
}
```

### Testing New Utilities

```typescript
// tests/unit/utils/string.util.test.ts
import { generateRandomString, slugify } from "@/utils/string.util";

describe("String Utilities", () => {
    describe("generateRandomString", () => {
        it("should generate string of specified length", () => {
            const result = generateRandomString(10);
            expect(result).toHaveLength(10);
        });

        it("should use custom charset", () => {
            const result = generateRandomString(5, "ABC");
            expect(result).toMatch(/^[ABC]+$/);
        });
    });

    describe("slugify", () => {
        it("should convert text to URL-safe slug", () => {
            expect(slugify("Hello World!")).toBe("hello-world");
            expect(slugify("Product #123")).toBe("product-123");
        });
    });
});
```

## Environment Integration

The utilities integrate with the environment configuration:

```typescript
// Password utility respects NODE_ENV for logging
import { NODE_ENV } from "@/config/env";

export async function hashPassword(password: string): Promise<string> {
    try {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    } catch (error) {
        // Only log in non-test environments
        if (NODE_ENV !== "test") {
            console.error("Error hashing password:", error);
        }
        throw new Error("Failed to hash password");
    }
}
```

## Future Utilities

Potential utility modules for future development:

- **Date/Time Utilities**: Date formatting, timezone handling, duration calculations
- **Validation Utilities**: Common validation patterns, format checkers
- **String Utilities**: Text processing, slug generation, sanitization
- **Number Utilities**: Currency formatting, percentage calculations
- **Array Utilities**: Data manipulation, filtering, sorting helpers
- **File Utilities**: File type detection, size formatting, path operations
- **Crypto Utilities**: Token generation, encryption helpers, UUID operations

The utils directory provides a foundation for building reusable, well-tested functionality that enhances code quality and developer productivity throughout the auction API application.
