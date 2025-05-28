import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { permissionsTable } from "@/db/roles-permissions.schema";
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
