# Role and Permission Management API Examples

This document provides examples of how to use the new role and permission management endpoints.

## Prerequisites

1. Ensure you have admin credentials
2. Get an authentication token by logging in
3. All these endpoints require admin role access

## Authentication

First, get an admin token:

```bash
curl -X POST http://localhost:8090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

Use the returned `accessToken` in the `Authorization: Bearer <token>` header for all subsequent requests.

## Role Management

### 1. Get All Roles

```bash
# Get roles without permissions
curl -X GET http://localhost:8090/api/v1/roles \
  -H "Authorization: Bearer <your-admin-token>"

# Get roles with permissions
curl -X GET "http://localhost:8090/api/v1/roles?include_permissions=true" \
  -H "Authorization: Bearer <your-admin-token>"
```

### 2. Create a New Role

```bash
curl -X POST http://localhost:8090/api/v1/roles \
  -H "Authorization: Bearer <your-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "moderator"
  }'
```

### 3. Get Role by ID

```bash
# Get role without permissions
curl -X GET http://localhost:8090/api/v1/roles/1 \
  -H "Authorization: Bearer <your-admin-token>"

# Get role with permissions
curl -X GET "http://localhost:8090/api/v1/roles/1?include_permissions=true" \
  -H "Authorization: Bearer <your-admin-token>"
```

### 4. Update Role

```bash
curl -X PUT http://localhost:8090/api/v1/roles/1 \
  -H "Authorization: Bearer <your-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "super-moderator"
  }'
```

### 5. Delete Role

```bash
curl -X DELETE http://localhost:8090/api/v1/roles/1 \
  -H "Authorization: Bearer <your-admin-token>"
```

## Permission Management

### 1. Get All Permissions

```bash
curl -X GET http://localhost:8090/api/v1/permissions \
  -H "Authorization: Bearer <your-admin-token>"
```

### 2. Create a New Permission

```bash
curl -X POST http://localhost:8090/api/v1/permissions \
  -H "Authorization: Bearer <your-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "comment:moderate",
    "description": "Moderate user comments"
  }'
```

### 3. Get Permission by ID

```bash
curl -X GET http://localhost:8090/api/v1/permissions/1 \
  -H "Authorization: Bearer <your-admin-token>"
```

### 4. Update Permission

```bash
curl -X PUT http://localhost:8090/api/v1/permissions/1 \
  -H "Authorization: Bearer <your-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "comment:moderate",
    "description": "Moderate and delete user comments"
  }'
```

### 5. Delete Permission

```bash
curl -X DELETE http://localhost:8090/api/v1/permissions/1 \
  -H "Authorization: Bearer <your-admin-token>"
```

## Role-Permission Assignment

### 1. Assign Permission to Role

```bash
curl -X POST http://localhost:8090/api/v1/roles/2/permissions \
  -H "Authorization: Bearer <your-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_id": 5
  }'
```

### 2. Set All Permissions for Role

```bash
curl -X PUT http://localhost:8090/api/v1/roles/2/permissions \
  -H "Authorization: Bearer <your-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_ids": [1, 2, 5, 7]
  }'
```

### 3. Remove Permission from Role

```bash
curl -X DELETE http://localhost:8090/api/v1/roles/2/permissions/5 \
  -H "Authorization: Bearer <your-admin-token>"
```

## User-Role Assignment

### 1. Get User's Roles

```bash
curl -X GET http://localhost:8090/api/v1/users/123/roles \
  -H "Authorization: Bearer <your-admin-token>"
```

### 2. Assign Roles to User

```bash
curl -X POST http://localhost:8090/api/v1/users/123/roles \
  -H "Authorization: Bearer <your-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": [2, 3]
  }'
```

### 3. Remove Role from User

```bash
curl -X DELETE http://localhost:8090/api/v1/users/123/roles/2 \
  -H "Authorization: Bearer <your-admin-token>"
```

## Response Examples

### Successful Role Creation

```json
{
    "success": true,
    "message": "Role created successfully",
    "data": {
        "id": 4,
        "name": "moderator",
        "created_at": "2025-06-21T19:37:00.000Z",
        "updated_at": "2025-06-21T19:37:00.000Z"
    }
}
```

### Role with Permissions

```json
{
    "success": true,
    "message": "Role retrieved successfully",
    "data": {
        "id": 1,
        "name": "admin",
        "created_at": "2025-06-21T19:30:00.000Z",
        "updated_at": "2025-06-21T19:30:00.000Z",
        "permissions": [
            {
                "id": 1,
                "name": "user:create",
                "description": "Create users",
                "created_at": "2025-06-21T19:30:00.000Z",
                "updated_at": "2025-06-21T19:30:00.000Z"
            },
            {
                "id": 2,
                "name": "user:read",
                "description": "Read users",
                "created_at": "2025-06-21T19:30:00.000Z",
                "updated_at": "2025-06-21T19:30:00.000Z"
            }
        ]
    }
}
```

### Error Response (Unauthorized)

```json
{
    "success": false,
    "message": "Insufficient permissions"
}
```

### Error Response (Not Found)

```json
{
    "success": false,
    "message": "Role not found"
}
```

## Notes

1. All role and permission management endpoints require admin role access
2. User-role assignment endpoints also require admin role access
3. Role and permission names must be unique
4. Deleting a role or permission that is currently in use may fail depending on foreign key constraints
5. The `include_permissions=true` query parameter can be used with role endpoints to include permission details
6. When setting permissions for a role using `PUT /api/v1/roles/{id}/permissions`, it replaces all existing permissions
7. When assigning roles to a user, only new role assignments are created (duplicates are ignored)
