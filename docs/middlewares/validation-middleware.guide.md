# Validation Middleware Guide

## Overview

The `ValidationMiddleware` provides request data validation using Zod schemas, ensuring all incoming data meets specified requirements before reaching controllers. It validates request bodies, parameters, and query strings, providing sanitized data and structured error responses.

## Architecture

### Core Responsibilities

1. **Schema Validation**: Validate request data against Zod schemas
2. **Data Sanitization**: Clean and transform input data
3. **Error Handling**: Provide detailed validation error responses
4. **Type Safety**: Ensure type-safe access to validated data
5. **Integration**: Work seamlessly with Drizzle ORM schemas

### Key Features

- **Flexible Schema Support**: Works with any Zod-compatible schema
- **Multi-Part Validation**: Validates body, params, and query simultaneously
- **Structured Errors**: Returns detailed validation errors with field information
- **Clean Data Access**: Provides sanitized data through `req.body.cleanBody`
- **Service Integration**: Uses `IValidationService` for error handling

### Dependencies

- **IValidationService**: For schema validation and error handling
- **Zod**: For schema definition and validation
- **Drizzle Schemas**: Integration with database schemas

## Implementation

### Interface Definition

```typescript
type ValidatableSchema =
    | {
          parse: (data: unknown) => unknown;
          shape?: Record<string, unknown>;
      }
    | ZodTypeAny;

interface ValidatedRequest extends Request {
    body: {
        cleanBody: Record<string, unknown>;
    } & Record<string, unknown>;
}

export interface IValidationMiddleware {
    validate(schema: ValidatableSchema): (req: Request, res: Response, next: NextFunction) => void;
}
```

### Class Structure

```typescript
@injectable()
export class ValidationMiddleware implements IValidationMiddleware {
    constructor(
        @inject(TYPES.IValidationService)
        private validator: IValidationService,
    ) {}

    public validate(schema: ValidatableSchema) {
        const parse = this.validator.validateSchema(schema);

        return (req: Request, res: Response, next: NextFunction) => {
            try {
                // Validate entire request object
                const clean = parse({
                    body: req.body,
                    params: req.params,
                    query: req.query,
                });

                // Store clean data for controller access
                (req as ValidatedRequest).body.cleanBody = clean;
                next();
            } catch (err) {
                this.validator.handleError(res, err);
                return;
            }
        };
    }
}
```

## Validation Patterns

### Basic Request Validation

```typescript
// Define validation schema
const createUserSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
    }),
    params: z.object({}),
    query: z.object({}),
});

// Apply validation middleware
router.post("/users", validationMiddleware.validate(createUserSchema), usersController.createUser);
```

### Parameter Validation

```typescript
// Validate path parameters
const getUserSchema = z.object({
    body: z.object({}),
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
    }),
    query: z.object({
        include_roles: z
            .enum(["true", "false"])
            .optional()
            .transform((val) => val === "true"),
    }),
});

router.get("/users/:id", validationMiddleware.validate(getUserSchema), usersController.getUserById);
```

### Query Parameter Validation

```typescript
// Validate query parameters with pagination
const getUsersSchema = z.object({
    body: z.object({}),
    params: z.object({}),
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).default("1"),
        limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
        search: z.string().optional(),
        role: z.string().optional(),
        email_verified: z
            .enum(["true", "false"])
            .optional()
            .transform((val) => val === "true"),
    }),
});

router.get("/users", validationMiddleware.validate(getUsersSchema), usersController.getAllUsers);
```

### Complex Object Validation

```typescript
// Nested object validation
const updateProfileSchema = z.object({
    body: z.object({
        personalInfo: z.object({
            firstName: z.string().min(1).max(50),
            lastName: z.string().min(1).max(50),
            phoneNumber: z
                .string()
                .regex(/^\+?[\d\s-()]+$/)
                .optional(),
        }),
        preferences: z.object({
            newsletter: z.boolean().default(false),
            notifications: z.boolean().default(true),
            language: z.enum(["en", "es", "fr"]).default("en"),
        }),
        address: z
            .object({
                street: z.string().min(1),
                city: z.string().min(1),
                zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
                country: z.string().length(2), // ISO country code
            })
            .optional(),
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
    }),
    query: z.object({}),
});

router.put(
    "/users/:id/profile",
    authGuard.handle.bind(authGuard),
    validationMiddleware.validate(updateProfileSchema),
    profileController.updateProfile,
);
```

## Integration with Drizzle Schemas

### Using Drizzle Insert Schemas

```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "@/db/users.schema";

// Create validation schema from Drizzle schema
const createUserValidationSchema = z.object({
    body: createInsertSchema(users, {
        email: z.string().email(),
        password: z.string().min(8),
    }).omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
    }),
    params: z.object({}),
    query: z.object({}),
});

router.post("/users", validationMiddleware.validate(createUserValidationSchema), usersController.createUser);
```

### Update Schema Patterns

```typescript
// Partial update schema
const updateUserValidationSchema = z.object({
    body: createInsertSchema(users).partial().omit({
        id: true,
        createdAt: true,
        updatedAt: true,
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
    }),
    query: z.object({}),
});

router.put(
    "/users/:id",
    authGuard.handle.bind(authGuard),
    validationMiddleware.validate(updateUserValidationSchema),
    usersController.updateUser,
);
```

### Role and Permission Schemas

```typescript
import { roles, permissions } from "@/db/rbac.schema";

// Role creation schema
const createRoleSchema = z.object({
    body: createInsertSchema(roles).omit({
        id: true,
        createdAt: true,
        updatedAt: true,
    }),
    params: z.object({}),
    query: z.object({}),
});

// Permission assignment schema
const assignPermissionSchema = z.object({
    body: z.object({
        permissionIds: z.array(z.number().int().positive()),
    }),
    params: z.object({
        roleId: z.string().regex(/^\d+$/).transform(Number),
    }),
    query: z.object({}),
});
```

## Error Handling

### Validation Error Response

```typescript
// Standard validation error format
{
    success: false,
    message: "Validation failed",
    errors: [
        {
            field: "email",
            message: "Invalid email format"
        },
        {
            field: "password",
            message: "Password must be at least 8 characters"
        }
    ]
}
```

### Error Types

#### Required Field Missing

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "field": "firstName",
            "message": "Required"
        }
    ]
}
```

#### Invalid Format

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "field": "email",
            "message": "Invalid email"
        }
    ]
}
```

#### Type Mismatch

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "field": "age",
            "message": "Expected number, received string"
        }
    ]
}
```

#### Custom Validation

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "field": "password",
            "message": "Password must contain at least one uppercase letter"
        }
    ]
}
```

## Accessing Validated Data

### In Controllers

```typescript
// Access validated data in controllers
export default class UsersController implements IUsersController {
    async createUser(req: Request, res: Response): Promise<void> {
        try {
            // Access validated and sanitized data
            const userData = req.body.cleanBody.body as CreateUserDto;

            // Data is guaranteed to be valid according to schema
            const user = await this.userService.createUser(userData);

            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: user,
            });
        } catch (error) {
            this.handleServiceError(error, res);
        }
    }

    async getUserById(req: Request, res: Response): Promise<void> {
        try {
            // Access validated parameters
            const { id } = req.body.cleanBody.params as { id: number };
            const { include_roles } = req.body.cleanBody.query as { include_roles?: boolean };

            let user;
            if (include_roles) {
                user = await this.userService.getUserWithRoles(id);
            } else {
                user = await this.userService.getUserById(id);
            }

            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            this.handleServiceError(error, res);
        }
    }
}
```

### Type Safety

```typescript
// Define TypeScript interfaces for validated data
interface CreateUserRequest {
    body: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    };
    params: {};
    query: {};
}

interface GetUserRequest {
    body: {};
    params: {
        id: number;
    };
    query: {
        include_roles?: boolean;
    };
}

// Use in controllers with type safety
async createUser(req: Request, res: Response): Promise<void> {
    const { body } = req.body.cleanBody as CreateUserRequest;
    // body is now type-safe
}
```

## Advanced Validation Patterns

### Conditional Validation

```typescript
// Conditional validation based on user type
const createAccountSchema = z.object({
    body: z
        .object({
            accountType: z.enum(["personal", "business"]),
            email: z.string().email(),
            // Conditional fields based on account type
        })
        .refine(
            (data) => {
                if (data.accountType === "business") {
                    return data.companyName && data.taxId;
                }
                return true;
            },
            {
                message: "Business accounts require company name and tax ID",
                path: ["accountType"],
            },
        ),
    params: z.object({}),
    query: z.object({}),
});
```

### Custom Validation Rules

```typescript
// Custom validation with business logic
const updateEmailSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email()
            .refine(
                async (email) => {
                    // Check if email is already taken
                    const existingUser = await userService.getUserByEmail(email);
                    return !existingUser;
                },
                {
                    message: "Email is already taken",
                },
            ),
        currentPassword: z.string().min(1),
    }),
    params: z.object({}),
    query: z.object({}),
});
```

### Transform and Sanitize

```typescript
// Data transformation and sanitization
const createPostSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1)
            .max(200)
            .transform((title) => title.replace(/\s+/g, " ")), // Normalize whitespace
        content: z
            .string()
            .trim()
            .min(10)
            .transform((content) => sanitizeHtml(content)), // Sanitize HTML
        tags: z
            .string()
            .transform((tags) => tags.split(",").map((tag) => tag.trim().toLowerCase()))
            .pipe(z.array(z.string().min(1)).max(10)),
        publishedAt: z
            .string()
            .datetime()
            .transform((date) => new Date(date))
            .optional(),
    }),
    params: z.object({}),
    query: z.object({}),
});
```

## Testing

### Unit Test Structure

```typescript
describe("ValidationMiddleware", () => {
    let validationService: jest.Mocked<IValidationService>;
    let middleware: ValidationMiddleware;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        validationService = {
            validateSchema: jest.fn(),
            handleError: jest.fn(),
        } as jest.Mocked<IValidationService>;

        middleware = new ValidationMiddleware(validationService);

        req = {
            body: {},
            params: {},
            query: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    // Test cases...
});
```

### Test Cases

#### Valid Data

```typescript
it("should validate and transform valid data", () => {
    const schema = z.object({
        body: z.object({
            email: z.string().email(),
            age: z.string().transform(Number),
        }),
        params: z.object({}),
        query: z.object({}),
    });

    req.body = { email: "test@example.com", age: "25" };

    const mockParse = jest.fn().mockReturnValue({
        body: { email: "test@example.com", age: 25 },
        params: {},
        query: {},
    });
    validationService.validateSchema.mockReturnValue(mockParse);

    const validateMiddleware = middleware.validate(schema);
    validateMiddleware(req as Request, res as Response, next);

    expect(req.body.cleanBody).toEqual({
        body: { email: "test@example.com", age: 25 },
        params: {},
        query: {},
    });
    expect(next).toHaveBeenCalled();
});
```

#### Invalid Data

```typescript
it("should handle validation errors", () => {
    const schema = z.object({
        body: z.object({
            email: z.string().email(),
        }),
    });

    req.body = { email: "invalid-email" };

    const mockParse = jest.fn().mockImplementation(() => {
        throw new ZodError([
            {
                code: "invalid_string",
                validation: "email",
                path: ["body", "email"],
                message: "Invalid email format",
            },
        ]);
    });
    validationService.validateSchema.mockReturnValue(mockParse);

    const validateMiddleware = middleware.validate(schema);
    validateMiddleware(req as Request, res as Response, next);

    expect(validationService.handleError).toHaveBeenCalledWith(res, expect.any(ZodError));
    expect(next).not.toHaveBeenCalled();
});
```

#### Parameter Validation

```typescript
it("should validate path parameters", () => {
    const schema = z.object({
        body: z.object({}),
        params: z.object({
            id: z.string().regex(/^\d+$/).transform(Number),
        }),
        query: z.object({}),
    });

    req.params = { id: "123" };

    const mockParse = jest.fn().mockReturnValue({
        body: {},
        params: { id: 123 },
        query: {},
    });
    validationService.validateSchema.mockReturnValue(mockParse);

    const validateMiddleware = middleware.validate(schema);
    validateMiddleware(req as Request, res as Response, next);

    expect(req.body.cleanBody.params).toEqual({ id: 123 });
    expect(next).toHaveBeenCalled();
});
```

### Integration Testing

```typescript
describe("Validation Integration", () => {
    let app: Express;

    beforeEach(() => {
        app = createTestApp();
    });

    it("should accept valid user creation data", async () => {
        const userData = {
            email: "test@example.com",
            password: "securepassword",
            firstName: "John",
            lastName: "Doe",
        };

        const response = await request(app).post("/users").send(userData).expect(201);

        expect(response.body.success).toBe(true);
    });

    it("should reject invalid email format", async () => {
        const userData = {
            email: "invalid-email",
            password: "securepassword",
            firstName: "John",
            lastName: "Doe",
        };

        const response = await request(app).post("/users").send(userData).expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("Validation failed");
        expect(response.body.errors).toContainEqual({
            field: expect.stringContaining("email"),
            message: expect.stringContaining("email"),
        });
    });
});
```

## Performance Considerations

### Schema Caching

```typescript
class ValidationMiddleware {
    private schemaCache = new Map<string, ZodSchema>();

    public validate(schema: ValidatableSchema) {
        // Cache compiled schemas for reuse
        const schemaKey = JSON.stringify(schema);
        let cachedSchema = this.schemaCache.get(schemaKey);

        if (!cachedSchema) {
            cachedSchema = this.validator.validateSchema(schema);
            this.schemaCache.set(schemaKey, cachedSchema);
        }

        return (req: Request, res: Response, next: NextFunction) => {
            try {
                const clean = cachedSchema.parse({
                    body: req.body,
                    params: req.params,
                    query: req.query,
                });

                req.body.cleanBody = clean;
                next();
            } catch (err) {
                this.validator.handleError(res, err);
            }
        };
    }
}
```

### Efficient Validation

```typescript
// Use .strict() to prevent extra properties
const strictSchema = z.object({
    body: z
        .object({
            email: z.string().email(),
            password: z.string().min(8),
        })
        .strict(), // Reject extra properties
    params: z.object({}),
    query: z.object({}),
});

// Use .transform() sparingly for performance
const efficientSchema = z.object({
    body: z.object({
        id: z.coerce.number(), // More efficient than .transform()
        active: z.coerce.boolean(),
    }),
});
```

## Security Considerations

### Input Sanitization

```typescript
// Always sanitize user input
const createPostSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .max(200)
            .transform((title) => escapeHtml(title)),
        content: z
            .string()
            .trim()
            .max(10000)
            .transform((content) =>
                sanitizeHtml(content, {
                    allowedTags: ["p", "br", "strong", "em"],
                    allowedAttributes: {},
                }),
            ),
    }),
});
```

### Data Limits

```typescript
// Prevent DoS attacks with size limits
const uploadSchema = z.object({
    body: z.object({
        files: z
            .array(
                z.object({
                    name: z.string().max(255),
                    size: z.number().max(10 * 1024 * 1024), // 10MB limit
                    type: z.enum(["image/jpeg", "image/png", "application/pdf"]),
                }),
            )
            .max(10), // Maximum 10 files
    }),
});
```

### SQL Injection Prevention

```typescript
// Validate database identifiers
const querySchema = z.object({
    query: z.object({
        orderBy: z.enum(["id", "name", "created_at"]), // Whitelist only
        direction: z.enum(["asc", "desc"]),
        search: z
            .string()
            .max(100)
            .regex(/^[a-zA-Z0-9\s]+$/), // Alphanumeric only
    }),
});
```

## Best Practices

### Schema Design

1. **Use Drizzle Integration**: Leverage Drizzle schemas for consistency
2. **Validate Everything**: Validate body, params, and query parameters
3. **Transform Data**: Use transforms for type conversion and sanitization
4. **Set Limits**: Always set maximum lengths and sizes
5. **Whitelist Values**: Use enums for constrained values

### Error Handling

1. **Detailed Errors**: Provide specific field-level error messages
2. **Consistent Format**: Use consistent error response structure
3. **Security Awareness**: Don't expose sensitive information in errors
4. **Graceful Degradation**: Handle validation service failures

### Performance

1. **Cache Schemas**: Cache compiled schemas for reuse
2. **Efficient Transforms**: Use built-in coercion when possible
3. **Lazy Validation**: Only validate required fields
4. **Size Limits**: Set appropriate limits on data size

### Security

1. **Sanitize Input**: Always sanitize user input
2. **Validate Types**: Ensure proper type validation
3. **Prevent Injection**: Use whitelisting for dynamic values
4. **Rate Limiting**: Combine with rate limiting for protection

## Related Documentation

- [Validation Service Guide](../services/validation-service.guide.md)
- [Database Schema Guide](../db/schema.guide.md)
- [Controllers Layer Guide](../controllers/controllers.guide.md)
- [Middlewares Layer Guide](./middlewares.guide.md)
