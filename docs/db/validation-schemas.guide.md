# Validation Schemas Guide

This guide covers the validation schema files that provide Zod-based validation for API endpoints in the Auctions API project.

## Overview

The validation schema system provides type-safe, runtime validation for API requests using Zod. The schemas are organized into domain-specific files and integrate with the validation middleware to ensure data integrity.

## Schema Files

### `user-validation.schema.ts`

Provides validation for user-related API endpoints.

### `rbac-validation.schema.ts`

Provides validation for Role-Based Access Control endpoints.

## User Validation Schemas

Located in `src/db/user-validation.schema.ts`, these schemas validate user management and authentication endpoints.

### User Management Schemas

#### `createUserRouteSchema`

```typescript
export const createUserRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        emailVerified: z.boolean().optional(),
        emailVerifiedAt: z.date().optional().nullable(),
    }),
});
```

- **Usage**: `POST /api/v1/users`
- **Validates**: User creation data
- **Required Fields**: email, password
- **Optional Fields**: emailVerified, emailVerifiedAt
- **Validation Rules**:
    - Email must be valid format
    - Password minimum 8 characters

#### `updateUserRouteSchema`

```typescript
export const updateUserRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format").optional(),
        password: z.string().min(8, "Password must be at least 8 characters").optional(),
        emailVerified: z.boolean().optional(),
        emailVerifiedAt: z.date().optional().nullable(),
    }),
});
```

- **Usage**: `PUT /api/v1/users/:id`
- **Validates**: User update data
- **All Fields Optional**: Partial update support
- **Same Validation Rules**: As create schema when provided

#### `loginRouteSchema`

```typescript
export const loginRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
    }),
});
```

- **Usage**: `POST /api/v1/users/login`
- **Validates**: User login credentials
- **Required Fields**: email, password
- **Validation Rules**:
    - Email must be valid format
    - Password cannot be empty

### Authentication Schemas

#### `registerRouteSchema`

```typescript
export const registerRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        emailVerified: z.boolean().optional(),
        emailVerifiedAt: z.date().optional().nullable(),
    }),
});
```

- **Usage**: `POST /api/v1/auth/register`
- **Validates**: User registration data
- **Same as**: `createUserRouteSchema`

#### `authLoginRouteSchema`

```typescript
export const authLoginRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
    }),
});
```

- **Usage**: `POST /api/v1/auth/login`
- **Validates**: Authentication login
- **Same as**: `loginRouteSchema`

#### `forgotPasswordRouteSchema`

```typescript
export const forgotPasswordRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
    }),
});
```

- **Usage**: `POST /api/v1/auth/forgot-password`
- **Validates**: Forgot password request
- **Required Fields**: email

### Usage Example - User Routes

```typescript
import { createUserRouteSchema, updateUserRouteSchema, loginRouteSchema } from "@/db/user-validation.schema";
import { validation } from "@/middlewares/validation.middleware";

// User creation
router.post("/users", validation(createUserRouteSchema), userController.create);

// User update
router.put("/users/:id", validation(updateUserRouteSchema), userController.update);

// User login
router.post("/users/login", validation(loginRouteSchema), userController.login);
```

## RBAC Validation Schemas

Located in `src/db/rbac-validation.schema.ts`, these schemas validate Role-Based Access Control endpoints.

### Role Management Schemas

#### `createRoleSchema`

```typescript
export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Role name is required").max(100, "Role name too long"),
    }),
});
```

- **Usage**: `POST /api/v1/roles`
- **Validates**: Role creation data
- **Required Fields**: name
- **Validation Rules**:
    - Name minimum 1 character
    - Name maximum 100 characters

#### `updateRoleSchema`

```typescript
export const updateRoleSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Role name is required").max(100, "Role name too long").optional(),
    }),
});
```

- **Usage**: `PUT /api/v1/roles/:id`
- **Validates**: Role update data
- **Optional Fields**: name (for partial updates)

#### `assignRolePermissionSchema`

```typescript
export const assignRolePermissionSchema = z.object({
    body: z.object({
        permission_id: z.number().int().positive("Permission ID must be a positive integer"),
    }),
});
```

- **Usage**: `POST /api/v1/roles/:id/permissions`
- **Validates**: Single permission assignment to role
- **Required Fields**: permission_id
- **Validation Rules**: Must be positive integer

#### `setRolePermissionsSchema`

```typescript
export const setRolePermissionsSchema = z.object({
    body: z.object({
        permission_ids: z.array(z.number().int().positive()).min(0, "Permission IDs array is required"),
    }),
});
```

- **Usage**: `PUT /api/v1/roles/:id/permissions`
- **Validates**: Bulk permission assignment to role
- **Required Fields**: permission_ids (array)
- **Validation Rules**: Array of positive integers

### Permission Management Schemas

#### `createPermissionSchema`

```typescript
export const createPermissionSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Permission name is required").max(100, "Permission name too long"),
        description: z.string().max(255, "Description too long").optional(),
    }),
});
```

- **Usage**: `POST /api/v1/permissions`
- **Validates**: Permission creation data
- **Required Fields**: name
- **Optional Fields**: description
- **Validation Rules**:
    - Name: 1-100 characters
    - Description: max 255 characters

#### `updatePermissionSchema`

```typescript
export const updatePermissionSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Permission name is required").max(100, "Permission name too long").optional(),
        description: z.string().max(255, "Description too long").optional(),
    }),
});
```

- **Usage**: `PUT /api/v1/permissions/:id`
- **Validates**: Permission update data
- **All Fields Optional**: For partial updates

### User Role Assignment Schemas

#### `assignUserRolesSchema`

```typescript
export const assignUserRolesSchema = z.object({
    body: z.object({
        role_ids: z.array(z.number().int().positive()).min(1, "At least one role ID is required"),
    }),
});
```

- **Usage**: `POST /api/v1/users/:id/roles`
- **Validates**: Role assignment to user
- **Required Fields**: role_ids (array)
- **Validation Rules**:
    - Array must contain at least one element
    - All elements must be positive integers

### TypeScript Type Exports

The RBAC validation file also exports TypeScript types:

```typescript
export type CreateRoleDto = z.infer<typeof createRoleSchema>["body"];
```

### Usage Example - RBAC Routes

```typescript
import {
    createRoleSchema,
    updateRoleSchema,
    assignRolePermissionSchema,
    setRolePermissionsSchema,
    createPermissionSchema,
    assignUserRolesSchema,
} from "@/db/rbac-validation.schema";
import { validation } from "@/middlewares/validation.middleware";

// Role management
router.post("/roles", validation(createRoleSchema), roleController.create);
router.put("/roles/:id", validation(updateRoleSchema), roleController.update);

// Role permissions
router.post("/roles/:id/permissions", validation(assignRolePermissionSchema), roleController.assignPermission);
router.put("/roles/:id/permissions", validation(setRolePermissionsSchema), roleController.setPermissions);

// Permission management
router.post("/permissions", validation(createPermissionSchema), permissionController.create);

// User roles
router.post("/users/:id/roles", validation(assignUserRolesSchema), userController.assignRoles);
```

## Validation Middleware Integration

### How Validation Works

The validation schemas work with the validation middleware to provide automatic request validation:

```typescript
// middleware/validation.middleware.ts
export const validation = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate the entire request object (body, params, query)
            const validatedData = schema.parse(req);

            // Replace request data with validated data
            Object.assign(req, validatedData);

            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(422).json({
                    success: false,
                    message: "Validation failed",
                    errors: error.errors,
                });
            }
            next(error);
        }
    };
};
```

### Request Structure

All validation schemas expect the following request structure:

```typescript
{
    body: {
        // Request body data
    },
    params?: {
        // URL parameters
    },
    query?: {
        // Query string parameters
    }
}
```

### Error Response Format

When validation fails, the middleware returns:

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": ["body", "email"],
            "message": "Required"
        }
    ]
}
```

## Advanced Validation Patterns

### Custom Validation Rules

You can extend schemas with custom validation:

```typescript
const createUserWithCustomValidation = createUserRouteSchema.extend({
    body: createUserRouteSchema.shape.body.extend({
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
    }),
});
```

### Conditional Validation

For more complex validation logic:

```typescript
const updateUserWithConditionals = z.object({
    body: z
        .object({
            email: z.string().email().optional(),
            password: z.string().min(8).optional(),
            emailVerified: z.boolean().optional(),
        })
        .refine(
            (data) => {
                // If emailVerified is set to true, email must be provided
                if (data.emailVerified === true && !data.email) {
                    return false;
                }
                return true;
            },
            {
                message: "Email is required when setting emailVerified to true",
                path: ["email"],
            },
        ),
});
```

### Array Validation

For endpoints that accept arrays:

```typescript
const bulkCreateUsersSchema = z.object({
    body: z.object({
        users: z
            .array(
                z.object({
                    email: z.string().email(),
                    password: z.string().min(8),
                }),
            )
            .min(1, "At least one user is required")
            .max(100, "Cannot create more than 100 users at once"),
    }),
});
```

## Type Safety Integration

### Using Inferred Types

```typescript
import { createUserRouteSchema } from "@/db/user-validation.schema";

// Extract types from validation schemas
type CreateUserRequest = z.infer<typeof createUserRouteSchema>;
type CreateUserBody = CreateUserRequest["body"];

// Use in controller
export const createUser = async (req: Request & CreateUserRequest, res: Response) => {
    // req.body is now fully typed
    const { email, password } = req.body;
    // TypeScript knows these exist and their types
};
```

### Service Layer Integration

```typescript
@injectable()
export class UserService {
    async createUser(userData: z.infer<typeof createUserRouteSchema>["body"]) {
        // userData is fully typed from the validation schema
        const hashedPassword = await hashPassword(userData.password);

        return await this.userRepository.create({
            ...userData,
            password: hashedPassword,
        });
    }
}
```

## Testing Validation Schemas

### Unit Tests for Schemas

```typescript
import { createUserRouteSchema, loginRouteSchema } from "@/db/user-validation.schema";

describe("User Validation Schemas", () => {
    describe("createUserRouteSchema", () => {
        it("should validate valid user data", () => {
            const validData = {
                body: {
                    email: "test@example.com",
                    password: "password123",
                },
            };

            expect(() => createUserRouteSchema.parse(validData)).not.toThrow();
        });

        it("should reject invalid email", () => {
            const invalidData = {
                body: {
                    email: "invalid-email",
                    password: "password123",
                },
            };

            expect(() => createUserRouteSchema.parse(invalidData)).toThrow();
        });

        it("should reject short password", () => {
            const invalidData = {
                body: {
                    email: "test@example.com",
                    password: "123", // Too short
                },
            };

            expect(() => createUserRouteSchema.parse(invalidData)).toThrow();
        });
    });

    describe("loginRouteSchema", () => {
        it("should validate login credentials", () => {
            const validData = {
                body: {
                    email: "test@example.com",
                    password: "anypassword",
                },
            };

            expect(() => loginRouteSchema.parse(validData)).not.toThrow();
        });

        it("should reject empty password", () => {
            const invalidData = {
                body: {
                    email: "test@example.com",
                    password: "",
                },
            };

            expect(() => loginRouteSchema.parse(invalidData)).toThrow();
        });
    });
});
```

### Integration Tests with Validation

```typescript
import request from "supertest";
import { app } from "@/app";

describe("User Routes Validation", () => {
    it("should return validation error for invalid user data", async () => {
        const response = await request(app).post("/api/v1/users").send({
            email: "invalid-email",
            password: "123", // Too short
        });

        expect(response.status).toBe(422);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation failed");
        expect(response.body.errors).toHaveLength(2); // Email and password errors
    });

    it("should create user with valid data", async () => {
        const response = await request(app).post("/api/v1/users").send({
            email: "test@example.com",
            password: "password123",
        });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
    });
});
```

## Best Practices

### 1. Schema Organization

- **Group related schemas** in domain-specific files
- **Use consistent naming conventions** (e.g., `*RouteSchema`)
- **Export TypeScript types** for use in controllers and services

### 2. Validation Rules

- **Be specific with error messages** to help API consumers
- **Use appropriate validation rules** for each field type
- **Consider business logic** in validation (not just data types)

### 3. Error Handling

- **Return consistent error formats** across all endpoints
- **Include field paths** in error messages
- **Use appropriate HTTP status codes** (422 for validation errors)

### 4. Performance

- **Keep validation schemas lightweight** for better performance
- **Cache compiled schemas** if needed for high-traffic endpoints
- **Use efficient validation rules** (avoid complex regex when possible)

### 5. Maintainability

- **Keep validation schemas close** to their related database schemas
- **Update validation when database schemas change**
- **Document complex validation rules** in comments

## Common Validation Patterns

### Email Validation

```typescript
email: z.string().email("Invalid email format");
```

### Password Validation

```typescript
password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password too long");
```

### ID Validation

```typescript
id: z.number().int().positive("ID must be a positive integer");
```

### Array Validation

```typescript
ids: z.array(z.number().int().positive()).min(1, "At least one ID is required").max(100, "Too many IDs");
```

### Optional Fields

```typescript
field: z.string().optional();
field: z.string().nullable();
field: z.string().optional().nullable();
```

## Related Documentation

- [Validation Middleware Guide](../middlewares/validation-middleware.guide.md)
- [Users Schema Guide](./users-schema.guide.md)
- [RBAC Schema Guide](./rbac-schema.guide.md)
- [API Documentation](../../openapi.yaml)
- [Controller Implementation Examples](../controllers/)
