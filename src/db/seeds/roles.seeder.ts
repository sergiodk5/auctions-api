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
