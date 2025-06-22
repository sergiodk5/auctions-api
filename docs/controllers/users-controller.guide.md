# Users Controller Guide

## Overview

The `UsersController` handles all user management HTTP endpoints including CRUD operations and user role management. It provides the HTTP interface for user administration and profile management functionality.

## Interface

```typescript
export interface IUsersController {
    getAllUsers(req: Request, res: Response): Promise<void>;
    getUserById(req: Request, res: Response): Promise<void>;
    createUser(req: Request, res: Response): Promise<void>;
    updateUser(req: Request, res: Response): Promise<void>;
    deleteUser(req: Request, res: Response): Promise<void>;
    getUserRoles(req: Request, res: Response): Promise<void>;
    assignUserRoles(req: Request, res: Response): Promise<void>;
    removeUserRole(req: Request, res: Response): Promise<void>;
}
```

## Dependencies

The controller depends on the user service and user role repository:

```typescript
@injectable()
export default class UsersController implements IUsersController {
    constructor(
        @inject(TYPES.IUserService) private readonly userService: IUserService,
        @inject(TYPES.IUserRoleRepository) private readonly userRoleRepository: IUserRoleRepository,
    ) {}
}
```

## Core CRUD Operations

### Get All Users

```typescript
async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
        const users = await this.userService.getAllUsers();
        res.status(200).json({
            success: true,
            data: users
        });
    } catch {
        res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
}
```

**HTTP Details:**

- **Method**: GET
- **Path**: `/api/v1/users`
- **Success**: 200 OK with users array
- **Authentication**: Required (admin permissions)

**Response Example:**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "email": "user1@example.com",
            "emailVerified": true
        },
        {
            "id": 2,
            "email": "user2@example.com",
            "emailVerified": false
        }
    ]
}
```

### Get User by ID

```typescript
async getUserById(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
        return;
    }

    try {
        const user = await this.userService.getUserById(id);
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (e) {
        res.status(404).json({
            success: false,
            message: "User not found"
        });
    }
}
```

**HTTP Details:**

- **Method**: GET
- **Path**: `/api/v1/users/:id`
- **Parameters**: `id` (integer) - User ID
- **Success**: 200 OK with user data
- **Error**: 400 Bad Request for invalid ID, 404 Not Found if user doesn't exist

**Parameter Validation:**

- Validates that ID is a valid integer
- Returns 400 for non-numeric IDs
- Handles service errors appropriately

### Create User

```typescript
async createUser(req: Request, res: Response): Promise<void> {
    const data = req.body.cleanBody.body as CreateUserDto;
    try {
        const user = await this.userService.createUser(data);
        res.status(201).json({
            success: true,
            data: user
        });
    } catch (e) {
        // @ts-expect-error: TypeScript doesn't know about the custom error
        if (e.message === "UserExists") {
            res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to create user"
            });
        }
    }
}
```

**HTTP Details:**

- **Method**: POST
- **Path**: `/api/v1/users`
- **Body**: `CreateUserDto` (validated by middleware)
- **Success**: 201 Created with user data
- **Error**: 409 Conflict for duplicate email, 500 for other errors

**Request Example:**

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"email": "newuser@example.com", "password": "securepassword"}'
```

### Update User

```typescript
async updateUser(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
        return;
    }

    const data = req.body.cleanBody.body as UpdateUserDto;
    try {
        const user = await this.userService.updateUser(id, data);
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (e) {
        res.status(404).json({
            success: false,
            message: "User not found"
        });
    }
}
```

**HTTP Details:**

- **Method**: PUT
- **Path**: `/api/v1/users/:id`
- **Parameters**: `id` (integer) - User ID
- **Body**: `UpdateUserDto` (partial user data)
- **Success**: 200 OK with updated user data
- **Error**: 400 for invalid ID, 404 if user not found

### Delete User

```typescript
async deleteUser(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
        return;
    }

    try {
        await this.userService.deleteUser(id);
        res.status(204).send();
    } catch (e) {
        res.status(404).json({
            success: false,
            message: "User not found"
        });
    }
}
```

**HTTP Details:**

- **Method**: DELETE
- **Path**: `/api/v1/users/:id`
- **Parameters**: `id` (integer) - User ID
- **Success**: 204 No Content
- **Error**: 400 for invalid ID, 404 if user not found

## Role Management Operations

### Get User Roles

```typescript
async getUserRoles(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
        return;
    }

    try {
        const roles = await this.userRoleRepository.getRoles(id);
        res.status(200).json({
            success: true,
            data: roles
        });
    } catch (e) {
        res.status(404).json({
            success: false,
            message: "User not found"
        });
    }
}
```

**HTTP Details:**

- **Method**: GET
- **Path**: `/api/v1/users/:id/roles`
- **Parameters**: `id` (integer) - User ID
- **Success**: 200 OK with roles array
- **Error**: 400 for invalid ID, 404 if user not found

**Response Example:**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "admin",
            "created_at": "2023-01-01T00:00:00Z",
            "updated_at": "2023-01-01T00:00:00Z"
        },
        {
            "id": 2,
            "name": "editor",
            "created_at": "2023-01-01T00:00:00Z",
            "updated_at": "2023-01-01T00:00:00Z"
        }
    ]
}
```

### Assign User Roles

```typescript
async assignUserRoles(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
        return;
    }

    const { roleIds } = req.body.cleanBody.body;
    if (!Array.isArray(roleIds) || roleIds.some((roleId) => typeof roleId !== "number")) {
        res.status(400).json({
            success: false,
            message: "Invalid role IDs"
        });
        return;
    }

    try {
        await this.userRoleRepository.assignRoles(id, roleIds);
        res.status(200).json({
            success: true,
            message: "Roles assigned successfully"
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Failed to assign roles"
        });
    }
}
```

**HTTP Details:**

- **Method**: POST
- **Path**: `/api/v1/users/:id/roles`
- **Parameters**: `id` (integer) - User ID
- **Body**: `{ roleIds: number[] }` - Array of role IDs to assign
- **Success**: 200 OK with success message
- **Error**: 400 for invalid data, 500 for assignment failure

**Request Example:**

```bash
curl -X POST http://localhost:3000/api/v1/users/1/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"roleIds": [1, 2]}'
```

### Remove User Role

```typescript
async removeUserRole(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id, 10);
    const roleId = parseInt(req.params.roleId, 10);

    if (isNaN(id) || isNaN(roleId)) {
        res.status(400).json({
            success: false,
            message: "Invalid user ID or role ID"
        });
        return;
    }

    try {
        await this.userRoleRepository.removeRoles(id, [roleId]);
        res.status(200).json({
            success: true,
            message: "Role removed successfully"
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Failed to remove role"
        });
    }
}
```

**HTTP Details:**

- **Method**: DELETE
- **Path**: `/api/v1/users/:id/roles/:roleId`
- **Parameters**: `id` (integer) - User ID, `roleId` (integer) - Role ID
- **Success**: 200 OK with success message
- **Error**: 400 for invalid IDs, 500 for removal failure

## Input Validation

### Parameter Validation

```typescript
// Standard ID validation pattern
const id = parseInt(req.params.id, 10);
if (isNaN(id)) {
    res.status(400).json({
        success: false,
        message: "Invalid user ID",
    });
    return;
}
```

### Array Validation

```typescript
// Role IDs array validation
const { roleIds } = req.body.cleanBody.body;
if (!Array.isArray(roleIds) || roleIds.some((roleId) => typeof roleId !== "number")) {
    res.status(400).json({
        success: false,
        message: "Invalid role IDs",
    });
    return;
}
```

### Body Data Access

```typescript
// Controllers access validated data from middleware
const data = req.body.cleanBody.body as CreateUserDto;
// Validation middleware ensures this data is clean and type-safe
```

## Error Handling

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
        case "UserNotFound":
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            break;

        case "UserExists":
            res.status(409).json({
                success: false,
                message: "Email already exists"
            });
            break;

        case "InsufficientPermissions":
            res.status(403).json({
                success: false,
                message: "Insufficient permissions"
            });
            break;

        default:
            console.error("Unhandled user service error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error"
            });
    }
}
```

### HTTP Status Code Usage

- **200 OK**: Successful GET, PUT operations
- **201 Created**: Successful user creation
- **204 No Content**: Successful deletion
- **400 Bad Request**: Invalid parameters or request data
- **404 Not Found**: User not found
- **409 Conflict**: Email already exists
- **500 Internal Server Error**: Unexpected errors

## Authorization Integration

### Protected Endpoints

```typescript
// Authorization is handled by middleware before reaching controller
async deleteUser(req: Request, res: Response): Promise<void> {
    // Authorization middleware ensures user has 'users:delete' permission
    // or is deleting their own account

    const id = parseInt(req.params.id, 10);
    const currentUserId = (req as any).user?.id;

    // Additional business logic authorization can be added here
    if (id !== currentUserId && !await this.hasAdminPermission(req)) {
        res.status(403).json({
            success: false,
            message: "Cannot delete this user"
        });
        return;
    }

    try {
        await this.userService.deleteUser(id);
        res.status(204).send();
    } catch (error) {
        this.handleServiceError(error, res);
    }
}
```

### Permission Checks

- **users:read**: Required for getting users
- **users:create**: Required for creating users
- **users:update**: Required for updating users (or own profile)
- **users:delete**: Required for deleting users (or own account)
- **roles:assign**: Required for role management operations

## Testing

### Unit Testing Pattern

```typescript
describe("UsersController", () => {
    let mockUserService: jest.Mocked<IUserService>;
    let mockUserRoleRepository: jest.Mocked<IUserRoleRepository>;
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

        mockUserRoleRepository = {
            assignRoles: jest.fn(),
            removeRoles: jest.fn(),
            getRoles: jest.fn(),
        };

        controller = new UsersController(mockUserService, mockUserRoleRepository);

        req = {
            params: {},
            body: { cleanBody: { body: {} } },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };
    });

    describe("getUserById", () => {
        it("should return user successfully", async () => {
            const mockUser = { id: 1, email: "test@example.com", emailVerified: true };
            req.params = { id: "1" };
            mockUserService.getUserById.mockResolvedValue(mockUser);

            await controller.getUserById(req as Request, res as Response);

            expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
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
});
```

### Integration Testing

```typescript
describe("UsersController Integration", () => {
    let app: Express;
    let userService: IUserService;
    let authToken: string;

    beforeEach(async () => {
        app = createTestApp();
        userService = container.get<IUserService>(TYPES.IUserService);
        authToken = await createTestAdminToken();
        await cleanDatabase();
    });

    it("should create and retrieve user", async () => {
        const userData = {
            email: "integration@test.com",
            password: "testpassword",
        };

        // Create user
        const createResponse = await request(app)
            .post("/api/v1/users")
            .set("Authorization", `Bearer ${authToken}`)
            .send(userData)
            .expect(201);

        const userId = createResponse.body.data.id;

        // Retrieve user
        const getResponse = await request(app)
            .get(`/api/v1/users/${userId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .expect(200);

        expect(getResponse.body.success).toBe(true);
        expect(getResponse.body.data.email).toBe(userData.email);
    });
});
```

## Route Integration

### Route Definition

```typescript
// In routes/user.route.ts
import { Router } from "express";
import { container } from "@/di/container";
import { TYPES } from "@/di/types";

const router = Router();
const usersController = container.get<IUsersController>(TYPES.IUsersController);

// User CRUD operations
router.get(
    "/",
    authenticationGuard,
    authorizationMiddleware.requirePermission("users:read"),
    usersController.getAllUsers.bind(usersController),
);

router.get(
    "/:id",
    authenticationGuard,
    authorizationMiddleware.requirePermission("users:read"),
    usersController.getUserById.bind(usersController),
);

router.post(
    "/",
    authenticationGuard,
    authorizationMiddleware.requirePermission("users:create"),
    validationMiddleware(createUserSchema),
    usersController.createUser.bind(usersController),
);

// Role management
router.get(
    "/:id/roles",
    authenticationGuard,
    authorizationMiddleware.requirePermission("users:read"),
    usersController.getUserRoles.bind(usersController),
);

router.post(
    "/:id/roles",
    authenticationGuard,
    authorizationMiddleware.requirePermission("roles:assign"),
    usersController.assignUserRoles.bind(usersController),
);

export default router;
```

## Best Practices

### Input Validation

1. **Parameter Validation**: Always validate URL parameters before processing
2. **Type Checking**: Use proper type checking for arrays and objects
3. **Middleware Integration**: Rely on validation middleware for body data
4. **Early Return**: Return early for validation failures

### Error Handling

1. **Consistent Responses**: Use standardized error response format
2. **Appropriate Status Codes**: Use correct HTTP status codes for different errors
3. **Error Logging**: Log errors for debugging while protecting sensitive data
4. **Service Error Mapping**: Map service errors to appropriate HTTP responses

### Performance

1. **Parameter Parsing**: Parse parameters once and reuse
2. **Efficient Queries**: Let services handle query optimization
3. **Response Size**: Return only necessary data in responses
4. **Error Caching**: Avoid expensive operations in error paths

### Security

1. **Authorization**: Verify permissions before operations
2. **Input Sanitization**: Rely on validation middleware for sanitization
3. **Error Information**: Don't expose sensitive information in error messages
4. **Rate Limiting**: Implement rate limiting for expensive operations

## Related Documentation

- [User Service Guide](../services/user-service.guide.md)
- [Authorization Service Guide](../services/authorization-service.guide.md)
- [RBAC Repositories Guide](../repositories/rbac-repositories.guide.md)
- [Authentication Controller Guide](./auth-controller.guide.md)
