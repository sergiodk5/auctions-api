# OpenAPI Documentation Setup

This project now includes comprehensive OpenAPI 3.0 documentation using Swagger UI Express.

## Accessing the Documentation

Once your server is running, you can access the interactive API documentation at:

```
http://localhost:8090/api-docs
```

## Features

### 📚 Complete API Documentation

- **Authentication endpoints**: Registration, login, token refresh, password reset, email verification
- **User management**: CRUD operations for users with proper authentication
- **Product endpoints**: Basic product management operations
- **System endpoints**: Health check and status monitoring

### 🔒 Security Schemas

- **Bearer Authentication**: JWT tokens for protected endpoints
- **Cookie Authentication**: Refresh token handling via secure cookies

### 📋 Comprehensive Schemas

- Request/response models for all endpoints
- Proper error response documentation
- Input validation schemas
- Authentication requirements clearly marked

## API Structure

### Authentication (`/api/v1/auth`)

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/revoke` - Token revocation
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset completion
- `POST /api/v1/auth/verify-email` - Email verification
- `POST /api/v1/auth/resend-verification` - Resend verification email

### Users (`/api/v1/users`) 🔒 _Requires Authentication_

- `GET /api/v1/users` - Get all users
- `POST /api/v1/users` - Create new user
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Products (`/api/v1/products`)

- `GET /api/v1/products` - Get all products
- `POST /api/v1/products` - Create new product
- `GET /api/v1/products/{id}` - Get product by ID
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product

### System (`/api/v1/status`)

- `GET /api/v1/status` - Health check

## Usage Examples

### Testing Authentication Flow

1. **Register a new user**:

    ```bash
    curl -X POST http://localhost:8090/api/v1/auth/register \
      -H "Content-Type: application/json" \
      -d '{
        "email": "user@example.com",
        "password": "securepassword123"
      }'
    ```

2. **Login to get access token**:

    ```bash
    curl -X POST http://localhost:8090/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "user@example.com",
        "password": "securepassword123"
      }'
    ```

3. **Use the token for protected endpoints**:
    ```bash
    curl -X GET http://localhost:8090/api/v1/users \
      -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
    ```

## Development Notes

### Adding New Endpoints

When adding new API endpoints, make sure to include OpenAPI documentation comments:

```typescript
/**
 * @swagger
 * /your-endpoint:
 *   post:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []  # If authentication required
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/YourSchema'
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseSchema'
 */
```

### Configuration

The OpenAPI configuration is located in `src/config/swagger.ts`. You can:

- Update API information (title, version, description)
- Add new servers (staging, production URLs)
- Define new reusable schemas
- Configure security schemes
- Customize the Swagger UI appearance

### Environment-specific URLs

Update the servers array in the swagger configuration for different environments:

```typescript
servers: [
  {
    url: "http://localhost:8090",
    description: "Development server",
  },
  {
    url: "https://staging-api.auctions.com",
    description: "Staging server",
  },
  {
    url: "https://api.auctions.com",
    description: "Production server",
  },
],
```

## Benefits

✅ **Interactive Testing**: Test all endpoints directly from the browser
✅ **Clear Documentation**: Comprehensive API documentation for developers
✅ **Type Safety**: Schemas match your TypeScript interfaces
✅ **Authentication Testing**: Built-in support for testing protected endpoints
✅ **Professional Presentation**: Clean, organized documentation for stakeholders
✅ **Development Efficiency**: Faster onboarding for new developers

## Next Steps

Consider adding:

- API versioning support
- Rate limiting documentation
- Response time examples
- More detailed error codes
- Example request/response payloads
- Webhook documentation (if applicable)
