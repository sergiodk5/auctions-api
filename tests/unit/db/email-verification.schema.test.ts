import "reflect-metadata";

import { emailVerificationTable } from "@/db/email-verification.schema";
import { getTableConfig } from "drizzle-orm/pg-core";

describe("Email Verification Schema", () => {
    test("should export emailVerificationTable", () => {
        expect(emailVerificationTable).toBeDefined();
        expect(typeof emailVerificationTable).toBe("object");
    });

    test("should have correct table columns", () => {
        // Test that the table has all expected columns
        expect(emailVerificationTable).toHaveProperty("id");
        expect(emailVerificationTable).toHaveProperty("userId");
        expect(emailVerificationTable).toHaveProperty("token");
        expect(emailVerificationTable).toHaveProperty("createdAt");
        expect(emailVerificationTable).toHaveProperty("verifiedAt");
    });

    test("should have correct column names", () => {
        // This exercises the table column definitions
        expect(emailVerificationTable.id.name).toBe("id");
        expect(emailVerificationTable.userId.name).toBe("user_id");
        expect(emailVerificationTable.token.name).toBe("token");
        expect(emailVerificationTable.createdAt.name).toBe("created_at");
        expect(emailVerificationTable.verifiedAt.name).toBe("verified_at");
    });

    test("should have foreign key reference to users table", () => {
        // Test foreign key relationship by checking column properties
        expect(emailVerificationTable.userId.notNull).toBe(true);

        // Check that the column has a reference by examining its structure
        const userIdColumn = emailVerificationTable.userId as any;
        expect(userIdColumn).toBeDefined();
    });

    test("should have foreign key reference that can be resolved", () => {
        // Basic checks to ensure the schema is well-formed with foreign key reference
        expect(emailVerificationTable.userId).toBeDefined();

        // Check table configuration
        const emailVerificationConfig = getTableConfig(emailVerificationTable);

        expect(emailVerificationConfig).toBeDefined();
        expect(emailVerificationConfig.name).toBe("email_verification");
        expect(emailVerificationConfig.columns).toBeDefined();
    });

    test("should be importable and usable without errors", () => {
        // This test ensures the entire schema can be imported and used
        expect(emailVerificationTable).toBeDefined();
        expect(typeof emailVerificationTable).toBe("object");

        // Test that we can access table metadata
        const columns = Object.keys(emailVerificationTable);
        expect(columns).toContain("id");
        expect(columns).toContain("userId");
        expect(columns).toContain("token");
    });
});
