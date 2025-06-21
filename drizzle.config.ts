import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "./src/config/env";

dotenv.config({ path: ".env" }); // This loads the default .env file

// Determine the correct database URL based on NODE_ENV
const currentDbUrl = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;

export default defineConfig({
    out: "./migrations",
    schema: [
        "./src/db/users.schema.ts",
        "./src/db/tokens.schema.ts",
        "./src/db/email-verification.schema.ts",
        "./src/db/rbac.schema.ts",
    ],
    dialect: "postgresql",
    dbCredentials: {
        url: currentDbUrl, // Use the conditionally set URL
    },
    verbose: true,
    strict: true,
});
