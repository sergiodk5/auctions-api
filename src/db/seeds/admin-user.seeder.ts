import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { rolesTable, userRolesTable } from "@/db/roles-permissions.schema";
import { usersTable } from "@/db/users.schema";
import { fixSequence } from "@/scripts/fix-sequence";
import { hashPassword } from "@/utils/password.util";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

export async function adminUserSeeder() {
    console.log("🔍 Checking for existing admin user...");

    // Hash the password
    const hashedPassword = await hashPassword("password");

    // Check if admin user already exists
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, "admin@example.com")).limit(1);

    let adminUser;
    if (existingUser.length > 0) {
        // Update existing user
        [adminUser] = await db
            .update(usersTable)
            .set({
                password: hashedPassword,
                emailVerified: true,
            })
            .where(eq(usersTable.email, "admin@example.com"))
            .returning();
        console.log("🔄 Updated existing admin user");
    } else {
        // Create new admin user
        console.log("➕ Creating new admin user...");
        const adminUserData = {
            email: "admin@example.com",
            password: hashedPassword,
            emailVerified: true,
        };

        try {
            const [user] = await db.insert(usersTable).values(adminUserData).returning({
                id: usersTable.id,
                email: usersTable.email,
                emailVerified: usersTable.emailVerified,
                emailVerifiedAt: usersTable.emailVerifiedAt,
            });
            adminUser = user;
            console.log("✅ Created new admin user");

            // Fix sequence after creating a new user
            await fixSequence({ tableName: "users" });
        } catch (error) {
            console.error("❌ Failed to create admin user:", error);
            throw error;
        }
    }

    console.log("🔍 Looking for admin role...");
    // Get the admin role
    const adminRole = await db.select().from(rolesTable).where(eq(rolesTable.name, "admin")).limit(1);

    if (adminRole.length === 0) {
        throw new Error("Admin role not found. Please run the roles seeder first.");
    }

    console.log("🔗 Assigning admin role to user...");
    // Check if role assignment already exists
    const existingRoleAssignment = await db
        .select()
        .from(userRolesTable)
        .where(and(eq(userRolesTable.user_id, adminUser.id), eq(userRolesTable.role_id, adminRole[0].id)))
        .limit(1);

    console.log(`Found ${existingRoleAssignment.length} existing role assignments for user ID ${adminUser.id}`);

    if (existingRoleAssignment.length === 0) {
        // Assign admin role to admin user
        await db.insert(userRolesTable).values({
            user_id: adminUser.id,
            role_id: adminRole[0].id,
        });
        console.log("✅ Assigned admin role to user");
    } else {
        console.log("🔄 Admin role already assigned to user");
    }

    console.log(`✅ Admin user created/updated with email: ${adminUser.email}`);
}
