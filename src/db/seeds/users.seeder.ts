import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { usersTable } from "@/db/users.schema";
import { hashPassword } from "@/utils/password.util";
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";
import { Pool } from "pg";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

export async function userSeeder() {
    const password = await hashPassword("password123");
    await seed(db, { users: usersTable }).refine((f) => ({
        users: {
            columns: {
                password: f.valuesFromArray({
                    values: [password],
                }),
            },
            count: 20,
        },
    }));
}
