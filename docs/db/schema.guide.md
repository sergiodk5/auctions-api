# Database Schema Guide

This guide provides a comprehensive overview of the database schema architecture in the Auctions API project. The database layer uses Drizzle ORM with PostgreSQL and follows a modular approach with separate schema files for different domains.

## Overview

The database schema is organized into several key components:

- **Core Schema Files**: Define database tables and relationships
- **Validation Schema Files**: Define Zod validation schemas for API endpoints
- **Main Schema Export**: Aggregates all schemas for use throughout the application
- **Seeders**: Populate the database with initial data

## Architecture Principles

### 1. Modular Organization

Each domain has its own schema file (users, tokens, RBAC, etc.) to maintain separation of concerns.

### 2. Type Safety

Uses Drizzle ORM with TypeScript for complete type safety from database to API layer.

### 3. Validation Integration

Zod schemas are derived from Drizzle schemas and used for API validation.

### 4. Relationship Management

Foreign key relationships are explicitly defined and enforced at the database level.

## Schema Files Structure

```
src/db/
├── schema.ts                    # Main schema export
├── users.schema.ts             # User accounts and authentication
├── tokens.schema.ts            # JWT refresh token management
├── email-verification.schema.ts # Email verification tokens
├── rbac.schema.ts              # Role-Based Access Control
├── user-validation.schema.ts   # User API validation schemas
├── rbac-validation.schema.ts   # RBAC API validation schemas
└── seeds/                      # Database seeders
    ├── admin-user.seeder.ts
    ├── permissions.seeder.ts
    ├── role-permissions.seeder.ts
    ├── roles.seeder.ts
    └── users.seeder.ts
```

## Usage Patterns

### 1. Repository Layer

Repositories import specific table definitions:

```typescript
import { usersTable } from "@/db/users.schema";
import { rolesTable, userRolesTable } from "@/db/rbac.schema";

@injectable()
export class UserRepository {
    async findById(id: number) {
        return await this.db.select().from(usersTable).where(eq(usersTable.id, id));
    }
}
```

### 2. Route Validation

Routes import validation schemas for middleware:

```typescript
import { createUserRouteSchema, updateUserRouteSchema } from "@/db/user-validation.schema";
import { validation } from "@/middlewares/validation.middleware";

router.post("/users", validation(createUserRouteSchema), userController.create);
```

### 3. Service Layer

Services use validation schemas for type safety:

```typescript
import { createUserSchema } from "@/db/users.schema";

export class UserService {
    async createUser(userData: z.infer<typeof createUserSchema>) {
        // Type-safe user creation
    }
}
```

### 4. Database Scripts

Scripts import schema for database operations:

```typescript
import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { usersTable } from "@/db/users.schema";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
```

## Best Practices

### 1. Schema Organization

- Keep related tables in the same schema file
- Use descriptive table and column names
- Include proper indexes and constraints

### 2. Validation Consistency

- Derive Zod schemas from Drizzle schemas when possible
- Create separate validation schemas for API routes
- Maintain consistency between database and API validation

### 3. Relationship Management

- Always define foreign key constraints
- Use appropriate cascade behaviors
- Document complex relationships

### 4. Migration Safety

- Never modify existing columns in schema files
- Create new migrations for schema changes
- Test migrations in development before production

### 5. Type Safety

- Export type definitions from schema files
- Use TypeScript interfaces for complex queries
- Leverage Drizzle's type inference capabilities

## Common Patterns

### Table Definition Pattern

```typescript
export const exampleTable = pgTable("example", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### Validation Schema Pattern

```typescript
export const createExampleSchema = createInsertSchema(exampleTable);
export const updateExampleSchema = createInsertSchema(exampleTable).partial();

export const createExampleRouteSchema = z.object({
    body: createExampleSchema.omit({ id: true, createdAt: true, updatedAt: true }),
});
```

### Seeder Pattern

```typescript
import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { exampleTable } from "@/db/example.schema";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

export async function exampleSeeder() {
    const data = [
        /* seed data */
    ];
    await db.insert(exampleTable).values(data).onConflictDoNothing();
}
```

## Related Documentation

- [Users Schema Guide](./users-schema.guide.md) - User authentication and profiles
- [RBAC Schema Guide](./rbac-schema.guide.md) - Role-Based Access Control
- [Tokens Schema Guide](./tokens-schema.guide.md) - JWT token management
- [Email Verification Schema Guide](./email-verification-schema.guide.md) - Email verification system
- [Validation Schemas Guide](./validation-schemas.guide.md) - API validation patterns
- [Database Seeders Guide](./seeders.guide.md) - Database seeding patterns

## Migration Information

When making schema changes:

1. **Never modify existing schema files directly**
2. **Create a new migration file** using Drizzle Kit
3. **Update the schema file** to match the migration
4. **Update related validation schemas** if needed
5. **Test the migration** in development environment
6. **Update seeders** if they're affected by schema changes

For detailed migration procedures, see the [Migration Guide](../migration.guide.md).
