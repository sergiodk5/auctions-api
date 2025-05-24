import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./src/config/env";

dotenv.config({ path: ".env" });

export default defineConfig({
    out: "./migrations",
    schema: ["./src/db/users.schema.ts", "./src/db/tokens.schema.ts", "./src/db/email-verification.schema.ts"],
    dialect: "postgresql",
    dbCredentials: {
        url: DATABASE_URL,
    },
    verbose: true,
    strict: true,
});
