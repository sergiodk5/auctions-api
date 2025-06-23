# Controllers Layer Guide

## Overview

The controllers layer in this TypeScript Express API handles HTTP request/response processing, acting as the intermediary between routes and services. Controllers are responsible for request validation, calling appropriate services, handling errors, and returning properly formatted responses.

## Architecture

### Controller Layer Principles

1. **HTTP-Focused**: Controllers handle HTTP-specific concerns (status codes, headers, response formatting)
2. **Thin Layer**: Business logic is delegated to services, controllers focus on request/response handling
3. **Dependency Injection**: All controllers use Inversify for service injection
4. **Interface-Based Design**: Controllers implement well-defined interfaces for consistency
5. **Error Handling**: Centralized error handling with proper HTTP status codes
6. **Validation Integration**: Works with validation middleware for input sanitization
7. **Structured Logging**: Use LoggerService for all logging needs, never console.log/error

### Controller Types

#### Core Controllers

- **AuthController**: Authentication endpoints (login, register, refresh, logout)
- **UsersController**: User management CRUD operations and role assignments
- **RoleController**: Role management and role-permission associations
- **PermissionController**: Permission management operations

## Controller Structure

### Basic Controller Pattern

```typescript
import { TYPES } from "@/di/types";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { ILoggerService } from "@/services/logger.service";

export interface IExampleController {
    getResource(req: Request, res: Response): Promise<void>;
    createResource(req: Request, res: Response): Promise<void>;
}

@injectable()
export default class ExampleController implements IExampleController {
    constructor(
        @inject(TYPES.IExampleService) private readonly exampleService: IExampleService,
        @inject(TYPES.ILoggerService) private readonly logger: ILoggerService,
    ) {}

    async getResource(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid resource ID",
                });
                return;
            }

            const resource = await this.exampleService.getById(id);
            res.json({
                success: true,
                message: "Resource retrieved successfully",
                data: resource,
            });
        } catch (error) {
            this.handleServiceError(error, res);
        }
    }

    private handleServiceError(error: unknown, res: Response): void {
        if (error instanceof Error) {
            switch (error.message) {
                case "ResourceNotFound":
                    res.status(404).json({
                        success: false,
                        message: "Resource not found",
                    });
                    break;
                default:
                    res.status(500).json({
                        success: false,
                        message: "Internal server error",
                    });
            }
        }
    }
}
```

### Controller Interface Requirements

- **Promise-Based**: All controller methods return `Promise<void>`
- **Request/Response Types**: Use Express `Request` and `Response` types
- **Error Handling**: Implement proper error handling with HTTP status codes
- **Response Format**: Use consistent JSON response structure

## Standard Response Format

### Success Response Structure

```typescript
// Single resource
{
    success: true,
    message: "Resource retrieved successfully",
    data: { /* resource object */ }
}

// Collection response
{
    success: true,
    message: "Resources retrieved successfully",
    data: [/* array of resources */]
}

// Operation success (no data)
{
    success: true,
    message: "Operation completed successfully"
}
```

### Error Response Structure

```typescript
// Client error (400-499)
{
    success: false,
    message: "Descriptive error message"
}

// Server error (500-599)
{
    success: false,
    message: "Internal server error",
    error?: "Detailed error for development" // Only in non-production
}

// Validation error (400)
{
    success: false,
    message: "Validation failed",
    errors: [
        { field: "email", message: "Invalid email format" }
    ]
}
```

## HTTP Status Code Usage

### Success Codes

- **200 OK**: Successful GET, PUT, PATCH operations
- **201 Created**: Successful POST operations (resource creation)
- **204 No Content**: Successful DELETE operations, logout, password resets

### Client Error Codes

- **400 Bad Request**: Invalid request data, validation failures
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Valid authentication but insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflicts (duplicate email, etc.)

### Server Error Codes

- **500 Internal Server Error**: Unexpected server errors

## Input Validation Patterns

### Parameter Validation

```typescript
async getResourceById(req: Request, res: Response): Promise<void> {
    // Validate path parameters
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        res.status(400).json({
            success: false,
            message: "Invalid resource ID"
        });
        return;
    }

    try {
        const resource = await this.service.getById(id);
        res.json({
            success: true,
            data: resource
        });
    } catch (error) {
        this.handleServiceError(error, res);
    }
}
```

### Body Validation Integration

```typescript
// Controllers access validated data from middleware
async createResource(req: Request, res: Response): Promise<void> {
    try {
        // Validation middleware populates req.body.cleanBody.body
        const data = req.body.cleanBody.body as CreateResourceDto;
        const resource = await this.service.create(data);

        res.status(201).json({
            success: true,
            message: "Resource created successfully",
            data: resource
        });
    } catch (error) {
        this.handleServiceError(error, res);
    }
}
```

### Query Parameter Handling

```typescript
async getResources(req: Request, res: Response): Promise<void> {
    try {
        // Extract and validate query parameters
        const includeDetails = req.query.include_details === "true";
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        if (page < 1 || limit < 1 || limit > 100) {
            res.status(400).json({
                success: false,
                message: "Invalid pagination parameters"
            });
            return;
        }

        const resources = await this.service.getAll({
            page,
            limit,
            includeDetails
        });

        res.json({
            success: true,
            data: resources
        });
    } catch (error) {
        this.handleServiceError(error, res);
    }
}
```

## Error Handling Patterns

### Service Error Mapping

```typescript
private handleServiceError(error: unknown, res: Response): void {
    if (!(error instanceof Error)) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
        return;
    }

    switch (error.message) {
        case "ResourceNotFound":
        case "UserNotFound":
            res.status(404).json({
                success: false,
                message: "Resource not found"
            });
            break;

        case "ResourceExists":
        case "EmailAlreadyTaken":
            res.status(409).json({
                success: false,
                message: "Resource already exists"
            });
            break;

        case "InsufficientPermissions":
            res.status(403).json({
                success: false,
                message: "Insufficient permissions"
            });
            break;

        case "ValidationFailed":
            res.status(400).json({
                success: false,
                message: "Invalid input data"
            });
            break;

        default:
            this.logger.error("Unhandled service error", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
            res.status(500).json({
                success: false,
                message: "Internal server error"
            });
    }
}
```

### Authentication Context Access

```typescript
// Access authenticated user from request
async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
        // Authentication middleware populates req.user
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required"
            });
            return;
        }

        const user = await this.userService.getUserById(userId);
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        this.handleServiceError(error, res);
    }
}
```

## Dependency Injection

### Controller Registration

Controllers are registered in `src/di/container.ts`:

```typescript
// Controllers
container.bind<IUsersController>(TYPES.IUsersController).to(UsersController);
container.bind<IAuthController>(TYPES.IAuthController).to(AuthController);
container.bind<IRoleController>(TYPES.IRoleController).to(RoleController);
container.bind<IPermissionController>(TYPES.IPermissionController).to(PermissionController);
```

### Service Injection

Controllers inject services through the constructor:

```typescript
@injectable()
export default class UsersController implements IUsersController {
    constructor(
        @inject(TYPES.IUserService) private readonly userService: IUserService,
        @inject(TYPES.IUserRoleRepository) private readonly userRoleRepository: IUserRoleRepository,
    ) {}
}
```

## Testing Controllers

### Unit Testing Pattern

```typescript
describe("UsersController", () => {
    let mockUserService: jest.Mocked<IUserService>;
    let controller: UsersController;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        mockUserService = {
            getAllUsers: jest.fn(),
            getUserById: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
        };

        controller = new UsersController(mockUserService);

        req = { params: {}, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            sendStatus: jest.fn(),
        };
    });

    it("should return user successfully", async () => {
        const mockUser = { id: 1, email: "test@example.com", emailVerified: true };
        req.params = { id: "1" };
        mockUserService.getUserById.mockResolvedValue(mockUser);

        await controller.getUserById(req as Request, res as Response);

        expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockUser,
        });
    });

    it("should handle invalid ID parameter", async () => {
        req.params = { id: "invalid" };

        await controller.getUserById(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid user ID",
        });
        expect(mockUserService.getUserById).not.toHaveBeenCalled();
    });
});
```

### Mocking Dependencies

- **Service Mocks**: Mock all service methods used by the controller
- **Request/Response Mocks**: Mock Express request and response objects
- **Authentication Mocks**: Mock user authentication context when needed

### Test Coverage Requirements

- **Happy Path**: Test successful operations
- **Error Cases**: Test all error scenarios and status codes
- **Validation**: Test parameter and body validation
- **Edge Cases**: Test boundary conditions and malformed inputs

## Security Considerations

### Input Sanitization

```typescript
// Controllers rely on validation middleware for input sanitization
async createUser(req: Request, res: Response): Promise<void> {
    try {
        // Data is already validated and sanitized by middleware
        const userData = req.body.cleanBody.body as CreateUserDto;
        const user = await this.userService.createUser(userData);

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        this.handleServiceError(error, res);
    }
}
```

### Authorization Checks

```typescript
async deleteUser(req: Request, res: Response): Promise<void> {
    try {
        const userId = parseInt(req.params.id);
        const currentUserId = (req as any).user?.id;

        // Check if user can delete this specific user
        if (userId !== currentUserId) {
            // Check if user has admin permissions (handled by middleware)
            // This controller assumes authorization middleware has run
        }

        await this.userService.deleteUser(userId);
        res.status(204).send();
    } catch (error) {
        this.handleServiceError(error, res);
    }
}
```

### Information Disclosure Prevention

```typescript
// Avoid exposing internal error details in production
private handleServiceError(error: unknown, res: Response): void {
    this.logger.error("Service error in controller", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
    });

    // Return generic error message to client
    res.status(500).json({
        success: false,
        message: "Internal server error"
        // Don't include error details in production
    });
}
```

## Best Practices

### Controller Design

1. **Keep Controllers Thin**: Delegate business logic to services
2. **Consistent Response Format**: Use standardized JSON response structure
3. **Proper Error Handling**: Map service errors to appropriate HTTP status codes
4. **Input Validation**: Validate all parameters and rely on validation middleware
5. **Use Dependency Injection**: Never instantiate services directly

### HTTP Best Practices

1. **Appropriate Status Codes**: Use correct HTTP status codes for different scenarios
2. **RESTful Design**: Follow REST conventions for resource endpoints
3. **Idempotent Operations**: Ensure PUT and DELETE operations are idempotent
4. **Consistent Naming**: Use clear, descriptive endpoint names

### Error Handling

1. **Centralized Error Mapping**: Use consistent error handling patterns
2. **Log Errors**: Log all errors for debugging and monitoring
3. **Client-Friendly Messages**: Provide helpful error messages without exposing internals
4. **Graceful Degradation**: Handle service unavailability gracefully

## Performance Considerations

### Response Optimization

```typescript
// Efficient data fetching based on client needs
async getUser(req: Request, res: Response): Promise<void> {
    try {
        const userId = parseInt(req.params.id);
        const includeRoles = req.query.include_roles === "true";

        let user;
        if (includeRoles) {
            user = await this.userService.getUserWithRoles(userId);
        } else {
            user = await this.userService.getUserById(userId);
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        this.handleServiceError(error, res);
    }
}
```

### Pagination Support

```typescript
async getUsers(req: Request, res: Response): Promise<void> {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
        const offset = (page - 1) * limit;

        const { users, total } = await this.userService.getUsers({ limit, offset });

        res.json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        this.handleServiceError(error, res);
    }
}
```

## Controller-Specific Guides

- [Authentication Controller Guide](./auth-controller.guide.md)
- [Users Controller Guide](./users-controller.guide.md)
- [Role Controller Guide](./role-controller.guide.md)
- [Permission Controller Guide](./permission-controller.guide.md)

## Related Documentation

- [Services Layer Guide](../services/services.guide.md)
- [Middleware Guide](../middlewares/middleware.guide.md)
- [Routes Guide](../routes/routes.guide.md)
- [Validation Guide](../validation/validation.guide.md)
