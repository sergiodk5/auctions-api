import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { rolesTable, userRolesTable } from "@/db/rbac.schema";
import { usersTable } from "@/db/users.schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function checkDatabase() {
    console.log("🔍 Checking database state...\n");

    try {
        // Check users
        console.log("Checking users table...");
        const users = await db.select().from(usersTable);
        console.log(`👥 Users table: ${users.length} records`);
        users.forEach((user) => {
            console.log(`  - ID: ${user.id}, Email: ${user.email}, Verified: ${user.emailVerified}`);
        });
    } catch (error) {
        console.error("❌ Error checking users table:", error);
    }

    try {
        // Check roles
        console.log("\nChecking roles table...");
        const roles = await db.select().from(rolesTable);
        console.log(`🎭 Roles table: ${roles.length} records`);
        roles.forEach((role) => {
            console.log(`  - ID: ${role.id}, Name: ${role.name}`);
        });
    } catch (error) {
        console.error("❌ Error checking roles table:", error);
    }

    try {
        // Check user roles
        console.log("\nChecking user roles table...");
        const userRoles = await db.select().from(userRolesTable);
        console.log(`🔗 User roles table: ${userRoles.length} records`);
        userRoles.forEach((ur) => {
            console.log(`  - User ID: ${ur.user_id}, Role ID: ${ur.role_id}`);
        });
    } catch (error) {
        console.error("❌ Error checking user roles table:", error);
    }

    try {
        await pool.end();
        console.log("\n✅ Database connection closed");
    } catch (error) {
        console.error("❌ Error closing connection:", error);
    }
}

void checkDatabase();
