# Database Seeders Guide

This guide covers the database seeding system in the Auctions API project, which populates the database with initial data for development, testing, and production environments.

## Overview

The seeding system provides automated database population with essential data including:

- **Default roles** (admin, editor, client)
- **Standard permissions** (CRUD operations for various resources)
- **Role-permission mappings**
- **Sample users** for development
- **Admin user** for system access

## Seeder Files Structure

```
src/db/seeds/
├── roles.seeder.ts           # Creates default roles
├── permissions.seeder.ts     # Creates standard permissions
├── role-permissions.seeder.ts # Maps permissions to roles
├── users.seeder.ts          # Creates sample users
└── admin-user.seeder.ts     # Creates admin user
```

## Common Seeder Patterns

### Base Seeder Pattern

All seeders follow a consistent pattern:

```typescript
import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { tableName } from "@/db/schema-file";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Environment-aware database connection
const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

export async function seederFunction() {
    // Seeding logic here
    await db.insert(tableName).values(data).onConflictDoNothing();
}
```

### Key Pattern Elements

1. **Environment Awareness**: Uses appropriate database based on `NODE_ENV`
2. **Connection Management**: Creates pool and Drizzle instance
3. **Conflict Handling**: Uses `onConflictDoNothing()` for idempotent seeding
4. **Export Function**: Named export for the seeder function

## Individual Seeders

### Roles Seeder

**File**: `src/db/seeds/roles.seeder.ts`

Creates the three default roles using Drizzle Seed:

```typescript
import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { rolesTable } from "@/db/rbac.schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";
import { Pool } from "pg";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

export async function rolesSeeder() {
    await seed(db, { roles: rolesTable }).refine((f) => ({
        roles: {
            columns: {
                name: f.valuesFromArray({
                    values: ["admin", "editor", "client"],
                }),
            },
            count: 3,
        },
    }));
}
```

**Creates**:

- `admin` - Full system access
- `editor` - Content management access
- `client` - Basic user access

**Features**:

- Uses Drizzle Seed for automatic data generation
- Generates timestamps automatically
- Creates exactly 3 roles

### Permissions Seeder

**File**: `src/db/seeds/permissions.seeder.ts`

Creates standard CRUD permissions for system resources:

```typescript
import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { permissionsTable } from "@/db/rbac.schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

export async function permissionsSeeder() {
    const permissions = [
        { name: "user:read", description: "Read user information" },
        { name: "user:create", description: "Create new users" },
        { name: "user:update", description: "Update user information" },
        { name: "user:delete", description: "Delete users" },
        { name: "product:read", description: "Read product information" },
        { name: "product:create", description: "Create new products" },
        { name: "product:update", description: "Update product information" },
        { name: "product:delete", description: "Delete products" },
    ];

    await db.insert(permissionsTable).values(permissions).onConflictDoNothing();
}
```

**Creates**:

- User management permissions (`user:read`, `user:create`, `user:update`, `user:delete`)
- Product management permissions (`product:read`, `product:create`, `product:update`, `product:delete`)

**Features**:

- Manual data definition for precise control
- Descriptive permission names following `resource:action` pattern
- Conflict resolution prevents duplicate entries

### Role Permissions Seeder

**File**: `src/db/seeds/role-permissions.seeder.ts`

Maps permissions to roles to establish the default access control matrix:

```typescript
import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { permissionsTable, rolePermissionsTable, rolesTable } from "@/db/rbac.schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

export async function rolePermissionsSeeder() {
    // Get roles and permissions
    const roles = await db.select().from(rolesTable);
    const permissions = await db.select().from(permissionsTable);

    // Create role-permission mappings
    const rolePermissions = [];

    // Admin gets all permissions
    const adminRole = roles.find((r) => r.name === "admin");
    if (adminRole) {
        rolePermissions.push(
            ...permissions.map((p) => ({
                role_id: adminRole.id,
                permission_id: p.id,
            })),
        );
    }

    // Editor gets user and product permissions except delete
    const editorRole = roles.find((r) => r.name === "editor");
    if (editorRole) {
        const editorPermissions = permissions.filter(
            (p) => (p.name.startsWith("user:") || p.name.startsWith("product:")) && !p.name.endsWith(":delete"),
        );
        rolePermissions.push(
            ...editorPermissions.map((p) => ({
                role_id: editorRole.id,
                permission_id: p.id,
            })),
        );
    }

    // Client gets only read permissions
    const clientRole = roles.find((r) => r.name === "client");
    if (clientRole) {
        const clientPermissions = permissions.filter((p) => p.name.endsWith(":read"));
        rolePermissions.push(
            ...clientPermissions.map((p) => ({
                role_id: clientRole.id,
                permission_id: p.id,
            })),
        );
    }

    // Insert role-permission mappings
    if (rolePermissions.length > 0) {
        await db.insert(rolePermissionsTable).values(rolePermissions).onConflictDoNothing();
    }
}
```

**Access Matrix**:
| Role | Permissions |
|------|-------------|
| Admin | All permissions |
| Editor | `user:read`, `user:create`, `user:update`, `product:read`, `product:create`, `product:update` |
| Client | `user:read`, `product:read` |

**Features**:

- Dynamic permission assignment based on existing roles and permissions
- Logical permission grouping by role function
- Safe conflict handling

### Users Seeder

**File**: `src/db/seeds/users.seeder.ts`

Creates sample users for development and testing:

```typescript
import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { usersTable } from "@/db/users.schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";
import { Pool } from "pg";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

export async function usersSeeder() {
    await seed(db, { users: usersTable }).refine((f) => ({
        users: {
            columns: {
                email: f.email(),
                password: f.loremIpsum({ sentenceCount: 1 }),
                emailVerified: f.boolean(),
            },
            count: 10,
        },
    }));
}
```

**Creates**:

- 10 sample users with random data
- Random email addresses
- Random passwords (for development only)
- Random email verification status

**Features**:

- Uses Drizzle Seed for realistic fake data
- Configurable count for different environments
- Automatic data generation

### Admin User Seeder

**File**: `src/db/seeds/admin-user.seeder.ts`

Creates a specific admin user with known credentials:

```typescript
import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { rolesTable, userRolesTable } from "@/db/rbac.schema";
import { usersTable } from "@/db/users.schema";
import { hashPassword } from "@/utils/password.util";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

export async function adminUserSeeder() {
    const email = "admin@example.com";
    const password = "admin123456";

    // Check if admin user already exists
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (existingUser.length > 0) {
        console.log("Admin user already exists");
        return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const [adminUser] = await db
        .insert(usersTable)
        .values({
            email,
            password: hashedPassword,
            emailVerified: true,
            emailVerifiedAt: new Date(),
        })
        .returning();

    // Get admin role
    const [adminRole] = await db.select().from(rolesTable).where(eq(rolesTable.name, "admin")).limit(1);

    if (adminRole) {
        // Assign admin role to user
        await db.insert(userRolesTable).values({
            user_id: adminUser.id,
            role_id: adminRole.id,
        });
    }

    console.log(`Admin user created: ${email}`);
}
```

**Creates**:

- Admin user with email: `admin@example.com`
- Admin user with password: `admin123456`
- Email verified status
- Admin role assignment

**Features**:

- Checks for existing admin user
- Uses proper password hashing
- Assigns admin role automatically
- Provides console feedback

## Running Seeders

### Manual Execution

Each seeder can be run individually:

```typescript
import { rolesSeeder } from "@/db/seeds/roles.seeder";
import { permissionsSeeder } from "@/db/seeds/permissions.seeder";

// Run individual seeders
await rolesSeeder();
await permissionsSeeder();
```

### Sequential Execution

Due to foreign key dependencies, seeders must be run in order:

```typescript
// Correct seeding order
await rolesSeeder(); // 1. Create roles first
await permissionsSeeder(); // 2. Create permissions
await rolePermissionsSeeder(); // 3. Map roles to permissions
await usersSeeder(); // 4. Create sample users
await adminUserSeeder(); // 5. Create admin user with role
```

### Master Seeder Script

Create a master seeder for convenience:

```typescript
// src/scripts/seed-database.ts
import { rolesSeeder } from "@/db/seeds/roles.seeder";
import { permissionsSeeder } from "@/db/seeds/permissions.seeder";
import { rolePermissionsSeeder } from "@/db/seeds/role-permissions.seeder";
import { usersSeeder } from "@/db/seeds/users.seeder";
import { adminUserSeeder } from "@/db/seeds/admin-user.seeder";

export async function seedDatabase() {
    console.log("Starting database seeding...");

    try {
        await rolesSeeder();
        console.log("✓ Roles seeded");

        await permissionsSeeder();
        console.log("✓ Permissions seeded");

        await rolePermissionsSeeder();
        console.log("✓ Role permissions mapped");

        await usersSeeder();
        console.log("✓ Sample users created");

        await adminUserSeeder();
        console.log("✓ Admin user created");

        console.log("Database seeding completed successfully!");
    } catch (error) {
        console.error("Error seeding database:", error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedDatabase().then(() => process.exit(0));
}
```

### NPM Scripts

Add seeding scripts to `package.json`:

```json
{
    "scripts": {
        "seed": "tsx src/scripts/seed-database.ts",
        "seed:dev": "NODE_ENV=development npm run seed",
        "seed:test": "NODE_ENV=test npm run seed"
    }
}
```

## Environment-Specific Seeding

### Development Environment

```typescript
if (NODE_ENV === "development") {
    // More sample data for development
    await seed(db, { users: usersTable }).refine((f) => ({
        users: {
            columns: {
                email: f.email(),
                password: f.loremIpsum({ sentenceCount: 1 }),
                emailVerified: f.boolean(),
            },
            count: 50, // More users for development
        },
    }));
}
```

### Test Environment

```typescript
if (NODE_ENV === "test") {
    // Minimal, predictable data for testing
    const testUsers = [
        { email: "test1@example.com", password: "hashedpassword1" },
        { email: "test2@example.com", password: "hashedpassword2" },
    ];

    await db.insert(usersTable).values(testUsers).onConflictDoNothing();
}
```

### Production Environment

```typescript
if (NODE_ENV === "production") {
    // Only essential data for production
    await rolesSeeder();
    await permissionsSeeder();
    await rolePermissionsSeeder();
    await adminUserSeeder(); // Only admin user
    // Skip sample users in production
}
```

## Advanced Seeding Patterns

### Conditional Seeding

```typescript
export async function conditionalSeeder() {
    // Check if data already exists
    const existingRoles = await db.select().from(rolesTable);

    if (existingRoles.length === 0) {
        await rolesSeeder();
        console.log("Roles seeded");
    } else {
        console.log("Roles already exist, skipping");
    }
}
```

### Transactional Seeding

```typescript
export async function transactionalSeeder() {
    await db.transaction(async (tx) => {
        await tx.insert(rolesTable).values(roles);
        await tx.insert(permissionsTable).values(permissions);
        await tx.insert(rolePermissionsTable).values(rolePermissions);
    });
}
```

### Bulk Data Seeding

```typescript
export async function bulkSeeder() {
    const batchSize = 1000;
    const totalUsers = 10000;

    for (let i = 0; i < totalUsers; i += batchSize) {
        const users = Array.from({ length: batchSize }, (_, index) => ({
            email: `user${i + index}@example.com`,
            password: "hashedpassword",
            emailVerified: Math.random() > 0.5,
        }));

        await db.insert(usersTable).values(users);
        console.log(`Seeded ${i + batchSize} users`);
    }
}
```

## Testing Seeders

### Unit Tests

```typescript
describe("Roles Seeder", () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it("should create default roles", async () => {
        await rolesSeeder();

        const roles = await db.select().from(rolesTable);

        expect(roles).toHaveLength(3);
        expect(roles.map((r) => r.name)).toEqual(expect.arrayContaining(["admin", "editor", "client"]));
    });

    it("should be idempotent", async () => {
        await rolesSeeder();
        await rolesSeeder(); // Run twice

        const roles = await db.select().from(rolesTable);
        expect(roles).toHaveLength(3); // Still only 3 roles
    });
});
```

### Integration Tests

```typescript
describe("Full Seeding Process", () => {
    it("should seed database in correct order", async () => {
        await cleanDatabase();

        await rolesSeeder();
        await permissionsSeeder();
        await rolePermissionsSeeder();
        await adminUserSeeder();

        // Verify admin user has admin role and permissions
        const adminUser = await db.select().from(usersTable).where(eq(usersTable.email, "admin@example.com"));

        expect(adminUser).toHaveLength(1);

        const userPermissions = await getUserPermissions(adminUser[0].id);
        expect(userPermissions.length).toBeGreaterThan(0);
    });
});
```

## Performance Considerations

### Batch Inserts

```typescript
// Instead of individual inserts
for (const item of items) {
    await db.insert(table).values(item);
}

// Use batch inserts
await db.insert(table).values(items);
```

### Connection Pooling

```typescript
// Reuse pool across seeders
const pool = new Pool({
    connectionString,
    max: 20, // Connection pool size
});

// Close pool when done
await pool.end();
```

### Memory Management

```typescript
// For large datasets, process in chunks
const chunkSize = 1000;
for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await db.insert(table).values(chunk);
}
```

## Best Practices

### 1. Idempotency

- **Always use `onConflictDoNothing()`** for safe re-runs
- **Check for existing data** before creating
- **Design seeders to be run multiple times** safely

### 2. Environment Awareness

- **Use appropriate database** based on `NODE_ENV`
- **Adapt data volume** to environment needs
- **Skip inappropriate seeders** in production

### 3. Dependency Management

- **Run seeders in correct order** due to foreign keys
- **Handle missing dependencies** gracefully
- **Use transactions** for related data

### 4. Security

- **Hash passwords** properly in seeders
- **Use strong admin passwords** in production
- **Don't commit sensitive data** to version control

### 5. Logging and Feedback

- **Provide clear console output** during seeding
- **Log errors** with context
- **Show progress** for long-running operations

## Common Issues and Solutions

### Foreign Key Violations

```typescript
// Problem: Seeding in wrong order
await userRolesSeeder(); // Tries to reference non-existent roles
await rolesSeeder(); // Creates roles after they're referenced

// Solution: Correct order
await rolesSeeder(); // Create roles first
await userRolesSeeder(); // Then reference them
```

### Duplicate Key Errors

```typescript
// Problem: No conflict handling
await db.insert(rolesTable).values(roles);

// Solution: Handle conflicts
await db.insert(rolesTable).values(roles).onConflictDoNothing();
```

### Memory Issues with Large Datasets

```typescript
// Problem: Loading all data at once
const allUsers = generateUsers(100000);
await db.insert(usersTable).values(allUsers);

// Solution: Batch processing
for (let i = 0; i < 100000; i += 1000) {
    const batch = generateUsers(1000);
    await db.insert(usersTable).values(batch);
}
```

## Related Documentation

- [Database Schema Guide](./schema.guide.md) - Overall schema architecture
- [RBAC Schema Guide](./rbac-schema.guide.md) - Role and permission system
- [Users Schema Guide](./users-schema.guide.md) - User management system
- [Environment Configuration Guide](../config/env.guide.md) - Environment setup
- [Migration Guide](../migration.guide.md) - Database migration procedures
