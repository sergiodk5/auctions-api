# Environment Configuration Guide

This guide explains how to use the environment configuration system in the Auctions API project. The configuration is centralized in `src/config/env.ts` and provides a type-safe, centralized way to manage environment variables.

## Overview

The environment configuration system consists of two main helper functions and a collection of pre-configured constants that are used throughout the application.

### Helper Functions

#### `getEnv(key: string, defaultValue: string): string`

This function retrieves a required environment variable with a fallback default value. If the environment variable is not set and the default value is empty, it throws an error.

```typescript
import { getEnv } from "@/config/env";

// Will throw an error if MY_REQUIRED_VAR is not set and defaultValue is empty
const requiredVar = getEnv("MY_REQUIRED_VAR", "");

// Will use default value if MY_VAR is not set
const myVar = getEnv("MY_VAR", "default_value");
```

#### `getEnvOptional(key: string, defaultValue = ""): string`

This function retrieves an optional environment variable. If not set, it returns the default value without throwing an error.

```typescript
import { getEnvOptional } from "@/config/env";

// Will return empty string if OPTIONAL_VAR is not set
const optionalVar = getEnvOptional("OPTIONAL_VAR");

// Will return "fallback" if OPTIONAL_VAR is not set
const optionalVarWithDefault = getEnvOptional("OPTIONAL_VAR", "fallback");
```

## Available Environment Variables

### Server Configuration

#### `SERVER_PORT`

- **Environment Variable**: `PORT`
- **Default**: `"8090"`
- **Description**: The port where the Express server will listen
- **Usage**: Used in `src/server.ts` to start the server

```typescript
import { SERVER_PORT } from "@/config/env";

app.listen(SERVER_PORT, () => {
    console.log(`Server running on ${SERVER_PORT}`);
});
```

#### `NODE_ENV`

- **Environment Variable**: `NODE_ENV`
- **Default**: `"development"`
- **Description**: Application environment (development, production, test)
- **Usage**: Used for conditional logic throughout the application

```typescript
import { NODE_ENV } from "@/config/env";

if (NODE_ENV === "test") {
    // Use mock services
} else {
    // Use real services
}
```

### Database Configuration

#### `DATABASE_URL`

- **Environment Variable**: `DATABASE_URL`
- **Default**: `"postgres://postgres:postgres@localhost:5432/postgres"`
- **Description**: PostgreSQL connection string for the main database
- **Usage**: Used in `src/services/database.service.ts` and database scripts

```typescript
import { DATABASE_URL } from "@/config/env";

const client = new Client({ connectionString: DATABASE_URL });
```

#### `TEST_DATABASE_URL`

- **Environment Variable**: `TEST_DATABASE_URL`
- **Default**: `"postgres://postgres:postgres@localhost:5432/postgres_test"`
- **Description**: PostgreSQL connection string for the test database
- **Usage**: Used when `NODE_ENV` is "test"

### Redis Configuration

#### `REDIS_HOST`

- **Environment Variable**: `REDIS_HOST`
- **Default**: `"localhost"`
- **Description**: Redis server hostname

#### `REDIS_PORT`

- **Environment Variable**: `REDIS_PORT`
- **Default**: `"6379"`
- **Description**: Redis server port

#### `REDIS_PASSWORD`

- **Environment Variable**: `REDIS_PASSWORD`
- **Default**: `""` (empty string)
- **Description**: Redis server password (optional)
- **Note**: Uses `getEnvOptional` since Redis might not require authentication

```typescript
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from "@/config/env";

const client = createClient({
    socket: {
        host: REDIS_HOST,
        port: Number(REDIS_PORT),
    },
    password: REDIS_PASSWORD,
});
```

### JWT Configuration

#### `JWT_SECRET`

- **Environment Variable**: `JWT_SECRET`
- **Default**: `"your_jwt_secret"`
- **Description**: Secret key for signing access tokens
- **Security**: **MUST** be changed in production

#### `JWT_REFRESH_SECRET`

- **Environment Variable**: `JWT_REFRESH_SECRET`
- **Default**: `"    "` (4 spaces)
- **Description**: Secret key for signing refresh tokens
- **Security**: **MUST** be changed in production

#### `JWT_RESET_SECRET`

- **Environment Variable**: `JWT_RESET_SECRET`
- **Default**: `"your_jwt_reset_secret"`
- **Description**: Secret key for signing password reset tokens
- **Security**: **MUST** be changed in production

#### JWT-related Constants

These are hardcoded constants used for JWT configuration:

- `ACCESS_LIFETIME = "15m"` - Access token expiration time
- `REFRESH_IDLE_TTL = 7 * 24 * 3600` - Refresh token idle TTL in seconds (7 days)
- `REFRESH_ABSOLUTE_TTL = 30 * 24 * 3600` - Refresh token absolute TTL in seconds (30 days)
- `RESET_PASSWORD_TTL = 3600` - Password reset token TTL in seconds (1 hour)

```typescript
import { JWT_SECRET, ACCESS_LIFETIME } from "@/config/env";

const token = jwt.sign({ sub: user.id.toString(), jti }, JWT_SECRET, { expiresIn: ACCESS_LIFETIME });
```

### Email Configuration

#### SMTP Settings

#### `SMTP_HOST`

- **Environment Variable**: `SMTP_HOST`
- **Default**: `"mailhog"`
- **Description**: SMTP server hostname

#### `SMTP_PORT`

- **Environment Variable**: `SMTP_PORT`
- **Default**: `"1025"`
- **Description**: SMTP server port

#### `SMTP_SECURE`

- **Environment Variable**: `SMTP_SECURE`
- **Default**: `"false"`
- **Description**: Whether to use secure SMTP connection
- **Note**: Converted to boolean with `=== "true"`

#### `SMTP_USER`

- **Environment Variable**: `SMTP_USER`
- **Default**: `"user"`
- **Description**: SMTP authentication username

#### `SMTP_PASS`

- **Environment Variable**: `SMTP_PASS`
- **Default**: `"password"`
- **Description**: SMTP authentication password

#### Email Provider Settings

#### `MAILER_PROVIDER`

- **Environment Variable**: `MAILER_PROVIDER`
- **Default**: `"sendgrid"`
- **Description**: Email service provider to use

#### `SENDGRID_API_KEY`

- **Environment Variable**: `SENDGRID_API_KEY`
- **Default**: `"your-sendgrid-api-key"`
- **Description**: SendGrid API key for email delivery

#### `MAILER_FROM_DOMAIN`

- **Environment Variable**: `MAILER_FROM_DOMAIN`
- **Default**: `"localhost"`
- **Description**: Domain used in the "from" field of emails

```typescript
import { MAILER_FROM_DOMAIN } from "@/config/env";

const emailFrom = `"No Reply" <no-reply@${MAILER_FROM_DOMAIN}>`;
```

### Frontend Configuration

#### `FRONTEND_URL`

- **Environment Variable**: `FRONTEND_URL`
- **Default**: `"http://localhost:3000"`
- **Description**: Frontend application URL used for generating links in emails

```typescript
import { FRONTEND_URL } from "@/config/env";

const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
```

## Usage Patterns

### 1. Service Configuration

Services typically import only the environment variables they need:

```typescript
// src/services/cache.service.ts
import { NODE_ENV, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "@/config/env";

@injectable()
export default class CacheService {
    constructor() {
        if (NODE_ENV === "test") {
            // Use mock client
        } else {
            // Use real Redis client with env vars
            this.client = createClient({
                socket: {
                    host: REDIS_HOST,
                    port: Number(REDIS_PORT),
                },
                password: REDIS_PASSWORD,
            });
        }
    }
}
```

### 2. Environment-Specific Logic

Use `NODE_ENV` for environment-specific behavior:

```typescript
import { NODE_ENV, DATABASE_URL, TEST_DATABASE_URL } from "@/config/env";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
```

### 3. Authentication Configuration

JWT services import all necessary secrets and lifetimes:

```typescript
import { JWT_SECRET, JWT_REFRESH_SECRET, ACCESS_LIFETIME, REFRESH_IDLE_TTL } from "@/config/env";

const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_LIFETIME });
const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_IDLE_TTL });
```

### 4. Database Scripts

Database scripts and seeders use environment-aware connection strings:

```typescript
import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const client = new Client({ connectionString });
```

## Testing Environment Variables

### Unit Tests

Unit tests can import and use the helper functions:

```typescript
import { getEnv } from "@/config/env";

describe("Environment Variables", () => {
    it("should return default value when env var is not set", () => {
        const result = getEnv("NON_EXISTENT_VAR", "default");
        expect(result).toBe("default");
    });
});
```

### Integration Tests

Integration tests typically set up their environment in `tests/setup/integration.setup.ts`:

```typescript
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });
```

## Best Practices

### 1. Type Safety

Always import environment variables from `@/config/env` rather than accessing `process.env` directly:

```typescript
// ✅ Good - Type-safe and centralized
import { DATABASE_URL } from "@/config/env";

// ❌ Bad - No type safety, not centralized
const dbUrl = process.env.DATABASE_URL;
```

### 2. Required vs Optional Variables

- Use `getEnv()` for required variables that should fail if not provided
- Use `getEnvOptional()` for optional variables with sensible defaults

### 3. Security

- Always override default values for secrets in production
- Use strong, unique values for JWT secrets
- Never commit real secrets to version control

### 4. Environment Separation

- Use different database URLs for test and development
- Ensure test environment doesn't affect production data
- Use appropriate defaults for development

### 5. Validation

The configuration system validates that required environment variables are set at startup, failing fast if misconfigured.

## Environment File Example

Create a `.env` file in your project root with the following structure:

```bash
# Server Configuration
PORT=8090
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgres://username:password@localhost:5432/auctions_dev
TEST_DATABASE_URL=postgres://username:password@localhost:5432/auctions_test

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_RESET_SECRET=your_super_secret_reset_key_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Email Provider Configuration
MAILER_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
MAILER_FROM_DOMAIN=yourdomain.com

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
```

Remember to add `.env` to your `.gitignore` file to prevent committing sensitive information to version control.
