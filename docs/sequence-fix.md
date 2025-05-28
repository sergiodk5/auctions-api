# PostgreSQL Sequence Fix Utility

## Overview

This utility fixes PostgreSQL sequence values that get out of sync when inserting records with explicit ID values. This commonly happens after data imports, seeding operations, or when using libraries like `drizzle-seed` that insert data with specific IDs.

## The Problem

PostgreSQL handles auto-incrementing differently than MySQL:

1. When you create a `SERIAL` field, PostgreSQL creates a sequence that tracks the next ID to use
2. The sequence starts with a value of 1
3. When inserting without specifying an ID, PostgreSQL uses the sequence value and increments it
4. When inserting WITH a specific ID, the sequence is NOT updated
5. This leads to unique constraint violations when the sequence tries to reuse existing IDs

## Example Scenario

```sql
-- After seeding 20 users with IDs 1-20, your sequence is still at 1
-- Trying to insert a new user without ID will fail:
INSERT INTO users (email, password) VALUES ('new@user.com', 'hash'); -- ERROR: duplicate key value violates unique constraint "users_pkey"
```

## Usage

### Command Line Interface

```bash
# Basic usage - fix sequence for a table (assumes 'id' column and standard sequence name)
npm run db:fix-sequence users

# Specify custom ID column
npm run db:fix-sequence users user_id

# Specify custom sequence name
npm run db:fix-sequence users id custom_users_sequence

# Help
npm run db:fix-sequence
```

### Programmatic Usage

```typescript
import { fixSequence } from "@/scripts/fix-sequence";

// Basic usage
await fixSequence({ tableName: "users" });

// With custom ID column
await fixSequence({
    tableName: "products",
    idColumn: "product_id",
});

// With custom sequence name
await fixSequence({
    tableName: "orders",
    idColumn: "id",
    sequenceName: "custom_orders_seq",
});
```

### Integration in Seeders

```typescript
// In a seeder file
export async function userSeeder() {
    // ... insert users with explicit IDs

    // Fix sequence after seeding
    await fixSequence({ tableName: "users" });
}
```

## Examples

### Fix Common Tables

```bash
# Users table
npm run db:fix-sequence users

# Roles table
npm run db:fix-sequence roles

# Permissions table
npm run db:fix-sequence permissions

# Products table
npm run db:fix-sequence products
```

### Error Handling

The utility includes comprehensive error handling:

- **Table doesn't exist**: Shows clear error message
- **Column doesn't exist**: Indicates the column name issue
- **Sequence doesn't exist**: Lists available sequences for the table
- **Database connection issues**: Proper error reporting

## Features

- ✅ **Smart Detection**: Automatically detects if sequence needs fixing
- ✅ **Safe Operation**: Only updates sequence if it's behind the max ID
- ✅ **Error Handling**: Comprehensive error messages with helpful suggestions
- ✅ **Flexible**: Works with custom table names, ID columns, and sequence names
- ✅ **CLI & Programmatic**: Use from command line or import in your code
- ✅ **Logging**: Clear progress and result reporting

## Common Use Cases

1. **After Data Import**: When importing existing data with IDs
2. **After Seeding**: When using seeding libraries that set explicit IDs
3. **Database Migration**: When moving from other database systems
4. **Testing Setup**: When creating test data with specific IDs
5. **Development**: When manually inserting records with IDs

## Integration with Package Scripts

The utility is integrated with your database management scripts:

```json
{
    "scripts": {
        "db:generate": "drizzle-kit generate",
        "db:migrate": "drizzle-kit migrate",
        "db:push": "drizzle-kit push",
        "db:seed": "tsx src/scripts/seed-runner.ts",
        "db:fix-sequence": "tsx src/scripts/fix-sequence.ts"
    }
}
```

This makes it easy to fix sequences as part of your development workflow alongside other database operations.
