# Users Schema Guide

This guide covers the users schema (`src/db/users.schema.ts`), which defines the core user authentication system including user accounts, password management, and email verification.

## Overview

The users schema provides the foundation for user authentication and management in the Auctions API. It includes the main users table and associated validation schemas for user-related operations.

## Table Structure

### `usersTable`

The primary table for storing user account information.

```typescript
export const usersTable = pgTable("users", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at"),
});
```

#### Columns

| Column            | Type           | Constraints                 | Description                           |
| ----------------- | -------------- | --------------------------- | ------------------------------------- |
| `id`              | `integer`      | Primary Key, Auto-increment | Unique user identifier                |
| `email`           | `varchar(255)` | Not Null, Unique            | User's email address (used for login) |
| `password`        | `varchar(255)` | Not Null                    | Hashed password                       |
| `emailVerified`   | `boolean`      | Not Null, Default: false    | Email verification status             |
| `emailVerifiedAt` | `timestamp`    | Nullable                    | Timestamp of email verification       |

#### Indexes

- **Primary Key**: `id`
- **Unique Constraint**: `email`

## Validation Schemas

### Drizzle-Generated Schemas

These schemas are automatically generated from the table definition using `drizzle-zod`:

#### `createUserSchema`

```typescript
export const createUserSchema = createInsertSchema(usersTable);
```

- **Usage**: Creating new users in services
- **Includes**: All table columns with their validation rules
- **Auto-generated**: Based on Drizzle table definition

#### `updateUserSchema`

```typescript
export const updateUserSchema = createInsertSchema(usersTable).partial();
```

- **Usage**: Updating existing users
- **Includes**: All table columns as optional fields
- **Partial**: All fields are optional for updates

#### `loginSchema`

```typescript
export const loginSchema = createInsertSchema(usersTable)
    .pick({
        email: true,
        password: true,
    })
    .strict();
```

- **Usage**: User login validation
- **Includes**: Only email and password fields
- **Strict**: No additional fields allowed

### Custom Validation Schemas

#### `forgotPasswordSchema`

```typescript
export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});
```

- **Usage**: Password reset requests
- **Validates**: Email format
- **Endpoint**: `POST /api/v1/auth/forgot-password`

#### `resetPasswordSchema`

```typescript
export const resetPasswordSchema = z.object({
    token: z.string(),
    password: z.string().min(8),
});
```

- **Usage**: Password reset with token
- **Validates**: Reset token and new password (min 8 chars)
- **Endpoint**: `POST /api/v1/auth/reset-password`

#### `emailVerificationSchema`

```typescript
export const emailVerificationSchema = z.object({
    token: z.string(),
});
```

- **Usage**: Email verification
- **Validates**: Verification token format
- **Endpoint**: `POST /api/v1/auth/verify-email`

## Usage Examples

### 1. Repository Layer

```typescript
import { usersTable, createUserSchema } from "@/db/users.schema";
import { eq } from "drizzle-orm";

@injectable()
export class UserRepository {
    async create(userData: z.infer<typeof createUserSchema>) {
        const [user] = await this.db.insert(usersTable).values(userData).returning();
        return user;
    }

    async findByEmail(email: string) {
        const [user] = await this.db.select().from(usersTable).where(eq(usersTable.email, email));
        return user;
    }

    async updateEmailVerification(id: number) {
        const [user] = await this.db
            .update(usersTable)
            .set({
                emailVerified: true,
                emailVerifiedAt: new Date(),
            })
            .where(eq(usersTable.id, id))
            .returning();
        return user;
    }
}
```

### 2. Service Layer

```typescript
import { createUserSchema, loginSchema } from "@/db/users.schema";
import { hashPassword, verifyPassword } from "@/utils/password.util";

@injectable()
export class AuthenticationService {
    async register(userData: z.infer<typeof createUserSchema>) {
        // Validate input
        const validatedData = createUserSchema.parse(userData);

        // Hash password
        const hashedPassword = await hashPassword(validatedData.password);

        // Create user
        return await this.userRepository.create({
            ...validatedData,
            password: hashedPassword,
        });
    }

    async login(credentials: z.infer<typeof loginSchema>) {
        // Validate input
        const { email, password } = loginSchema.parse(credentials);

        // Find user
        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new Error("Invalid credentials");

        // Verify password
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) throw new Error("Invalid credentials");

        return user;
    }
}
```

### 3. Route Validation

See [`user-validation.schema.ts`](./validation-schemas.guide.md#user-validation) for route-specific validation schemas.

## Relationships

### Foreign Key References

The `usersTable` is referenced by several other tables:

#### `emailVerificationTable`

```typescript
// From email-verification.schema.ts
userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id);
```

#### `refreshFamiliesTable`

```typescript
// From tokens.schema.ts
userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id);
```

#### `userRolesTable`

```typescript
// From rbac.schema.ts
user_id: integer("user_id")
    .notNull()
    .references(() => usersTable.id);
```

## Security Considerations

### Password Storage

- **Never store plain text passwords**
- **Always hash passwords** using `@/utils/password.util`
- **Use strong hashing algorithms** (bcrypt recommended)

```typescript
import { hashPassword } from "@/utils/password.util";

const hashedPassword = await hashPassword(plainTextPassword);
```

### Email Verification

- **Default to unverified emails** (`emailVerified: false`)
- **Require email verification** for sensitive operations
- **Track verification timestamp** for audit purposes

### Data Validation

- **Always validate email format** using Zod email validation
- **Enforce minimum password length** (8 characters minimum)
- **Sanitize input data** before database operations

## Common Queries

### Find User by Email

```typescript
const user = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
```

### Update Email Verification Status

```typescript
await db
    .update(usersTable)
    .set({
        emailVerified: true,
        emailVerifiedAt: new Date(),
    })
    .where(eq(usersTable.id, userId));
```

### Get Unverified Users

```typescript
const unverifiedUsers = await db.select().from(usersTable).where(eq(usersTable.emailVerified, false));
```

### Update User Password

```typescript
const hashedPassword = await hashPassword(newPassword);
await db.update(usersTable).set({ password: hashedPassword }).where(eq(usersTable.id, userId));
```

## Type Definitions

### Inferred Types

```typescript
import { usersTable, createUserSchema } from "@/db/users.schema";

// Table row type
type User = typeof usersTable.$inferSelect;

// Insert type
type NewUser = typeof usersTable.$inferInsert;

// Validation schema types
type CreateUserData = z.infer<typeof createUserSchema>;
type LoginData = z.infer<typeof loginSchema>;
```

### Custom Types

```typescript
// User without sensitive data
export type PublicUser = Omit<User, "password">;

// User creation data
export type UserRegistrationData = {
    email: string;
    password: string;
};

// User profile update data
export type UserUpdateData = {
    email?: string;
    emailVerified?: boolean;
};
```

## Testing Patterns

### Repository Tests

```typescript
import { usersTable } from "@/db/users.schema";

describe("UserRepository", () => {
    it("should create a new user", async () => {
        const userData = {
            email: "test@example.com",
            password: "hashedpassword123",
        };

        const user = await userRepository.create(userData);

        expect(user).toMatchObject({
            email: userData.email,
            emailVerified: false,
        });
        expect(user.id).toBeDefined();
        expect(user.password).toBe(userData.password);
    });
});
```

### Validation Tests

```typescript
import { createUserSchema, loginSchema } from "@/db/users.schema";

describe("User Validation Schemas", () => {
    it("should validate valid user data", () => {
        const userData = {
            email: "valid@example.com",
            password: "validpassword123",
        };

        expect(() => createUserSchema.parse(userData)).not.toThrow();
    });

    it("should reject invalid email", () => {
        const userData = {
            email: "invalid-email",
            password: "validpassword123",
        };

        expect(() => createUserSchema.parse(userData)).toThrow();
    });
});
```

## Migration History

### Initial Migration (0000_users.sql)

- Created `users` table with basic authentication fields
- Added unique constraint on email
- Set up auto-incrementing primary key

### Related Migrations

- `0001_tokens.sql` - Added token management tables
- `0002_messy_spot.sql` - Added email verification system
- See migration files in `/migrations` directory

## Related Documentation

- [Authentication Service Guide](../services/authentication-service.guide.md)
- [User Repository Guide](../repositories/user-repository.guide.md)
- [Password Utilities Guide](../utils/password-util.guide.md)
- [Email Verification Schema Guide](./email-verification-schema.guide.md)
- [User Validation Schemas Guide](./validation-schemas.guide.md#user-validation)
