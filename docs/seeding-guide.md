# Database Seeding & RBAC Setup Guide

This guide covers the complete database seeding system and Role-Based Access Control (RBAC) implementation for the auctions API.

## 🚀 Quick Start

```bash
# Run all seeders in order
npm run db:seed roles
npm run db:seed permissions
npm run db:seed role-permissions
npm run db:seed admin-user

# Or use individual seeders
npm run db:seed users          # Create sample users
npm run db:seed <seeder-name>  # Run any specific seeder

# Fix PostgreSQL sequences after seeding
npm run db:fix-sequence users
npm run db:fix-all-sequences   # Fix all sequences at once
```

## 📋 Available Seeders

### Core RBAC Seeders

| Seeder             | Description               | Creates                                          |
| ------------------ | ------------------------- | ------------------------------------------------ |
| `roles`            | Creates role system       | `admin`, `editor`, `client` roles                |
| `permissions`      | Creates permission system | CRUD permissions for `user:*` and `product:*`    |
| `role-permissions` | Maps permissions to roles | Role-permission assignments                      |
| `admin-user`       | Creates admin user        | Admin user with `admin@example.com` / `password` |

### Data Seeders

| Seeder  | Description  | Creates                                               |
| ------- | ------------ | ----------------------------------------------------- |
| `users` | Sample users | 20 random users with varied email verification status |

## 🎭 RBAC System Overview

### Roles & Permissions

**Admin Role** (All permissions):

- `user:create`, `user:read`, `user:update`, `user:delete`
- `product:create`, `product:read`, `product:update`, `product:delete`

**Editor Role** (Product management + user read):

- `user:read`
- `product:create`, `product:read`, `product:update`, `product:delete`

**Client Role** (Product view only):

- `product:create`, `product:read`, `product:update`, `product:delete`

### Admin User

- **Email**: `admin@example.com`
- **Password**: `password`
- **Role**: `admin`
- **Verified**: `true`

## 🔧 Sequence Fix Utilities

### Why You Need This

PostgreSQL sequences can get out of sync when inserting records with explicit IDs (common during seeding). This causes unique constraint violations when trying to insert new records.

### Usage

```bash
# Fix specific table
npm run db:fix-sequence users
npm run db:fix-sequence roles
npm run db:fix-sequence permissions

# Fix all tables at once
npm run db:fix-all-sequences

# With custom parameters
npm run db:fix-sequence users user_id custom_sequence_name
```

### Programmatic Usage

```typescript
import { fixSequence } from "@/scripts/fix-sequence";

// In a seeder
export async function mySeeder() {
    // ... insert data with explicit IDs

    // Fix sequence after seeding
    await fixSequence({ tableName: "users" });
}
```

## 🗂️ Database Schema

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMP
);
```

### RBAC Tables

```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    permission_id INTEGER NOT NULL REFERENCES permissions(id)
);

CREATE TABLE user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id),
    role_id INTEGER NOT NULL REFERENCES roles(id)
);
```

## 📦 Package Scripts

```json
{
    "scripts": {
        "db:generate": "drizzle-kit generate",
        "db:migrate": "drizzle-kit migrate",
        "db:push": "drizzle-kit push",
        "db:seed": "tsx src/scripts/seed-runner.ts",
        "db:fix-sequence": "tsx src/scripts/fix-sequence.ts",
        "db:fix-all-sequences": "tsx src/scripts/fix-all-sequences.ts"
    }
}
```

## 🛠️ Development Workflow

### Setting Up a Fresh Database

1. **Run Migrations**:

    ```bash
    npm run db:migrate
    ```

2. **Seed Core RBAC System**:

    ```bash
    npm run db:seed roles
    npm run db:seed permissions
    npm run db:seed role-permissions
    npm run db:seed admin-user
    ```

3. **Add Sample Data** (optional):

    ```bash
    npm run db:seed users
    ```

4. **Fix Sequences** (if needed):
    ```bash
    npm run db:fix-all-sequences
    ```

### Creating New Seeders

1. Create seeder file in `src/db/seeds/`:

    ```typescript
    // my-seeder.seeder.ts
    export async function mySeeder() {
        // Seeding logic here
    }
    ```

2. Run with the seed runner:
    ```bash
    npm run db:seed my-seeder
    ```

The seed runner automatically:

- Converts kebab-case to camelCase (`my-seeder` → `mySeeder`)
- Handles multiple naming conventions
- Provides helpful error messages
- Shows execution progress

## 🔍 Troubleshooting

### Common Issues

**Unique Constraint Violations**:

```bash
# Fix sequence issues
npm run db:fix-sequence <table-name>
```

**Seeder Not Found**:

```bash
# Check file naming - should be: <name>.seeder.ts
# Export function should be: <name>Seeder
```

**Role/Permission Dependencies**:

```bash
# Run seeders in order:
# 1. roles
# 2. permissions
# 3. role-permissions
# 4. admin-user
```

### Verification

Check your database state:

```bash
npx tsx src/scripts/check-db.ts
```

## 📚 Additional Resources

- [Sequence Fix Documentation](./sequence-fix.md)
- [Testing Guide](./testing.md)
- [Integration Testing](./integration-testing.md)

## 🎯 Summary

This seeding system provides:

✅ **Complete RBAC Implementation**: Roles, permissions, and user assignments
✅ **Flexible Seeder System**: Dynamic seeder execution by name
✅ **PostgreSQL Sequence Management**: Automated sequence fixing utilities
✅ **Admin User Setup**: Ready-to-use admin account
✅ **Development Tools**: Database state checking and bulk operations
✅ **Error Handling**: Comprehensive error reporting and recovery
✅ **Documentation**: Complete guides and examples

The system is designed to be maintainable, extensible, and production-ready for your auctions API.
