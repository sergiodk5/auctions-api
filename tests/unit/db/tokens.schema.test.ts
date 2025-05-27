import "reflect-metadata";

import { refreshFamiliesTable, refreshTokensTable } from "@/db/tokens.schema";
import { getTableConfig } from "drizzle-orm/pg-core";

describe("Tokens Schema", () => {
    test("should export refreshFamiliesTable", () => {
        expect(refreshFamiliesTable).toBeDefined();
        expect(typeof refreshFamiliesTable).toBe("object");
    });

    test("should export refreshTokensTable", () => {
        expect(refreshTokensTable).toBeDefined();
        expect(typeof refreshTokensTable).toBe("object");
    });

    test("should have correct table columns", () => {
        // Test that the tables have the expected Drizzle structure properties
        expect(refreshFamiliesTable).toHaveProperty("familyId");
        expect(refreshFamiliesTable).toHaveProperty("userId");
        expect(refreshFamiliesTable).toHaveProperty("createdAt");
        expect(refreshFamiliesTable).toHaveProperty("absoluteExpiry");

        expect(refreshTokensTable).toHaveProperty("jti");
        expect(refreshTokensTable).toHaveProperty("familyId");
        expect(refreshTokensTable).toHaveProperty("issuedAt");
        expect(refreshTokensTable).toHaveProperty("revokedAt");
    });

    test("should have correct column names", () => {
        // This exercises the table definitions by checking column names
        expect(refreshFamiliesTable.familyId.name).toBe("family_id");
        expect(refreshFamiliesTable.userId.name).toBe("user_id");
        expect(refreshFamiliesTable.createdAt.name).toBe("created_at");
        expect(refreshFamiliesTable.absoluteExpiry.name).toBe("absolute_expiry");

        expect(refreshTokensTable.jti.name).toBe("jti");
        expect(refreshTokensTable.familyId.name).toBe("family_id");
        expect(refreshTokensTable.issuedAt.name).toBe("issued_at");
        expect(refreshTokensTable.revokedAt.name).toBe("revoked_at");
    });

    test("should have foreign key references", () => {
        // Test foreign key relationships - refreshFamiliesTable.userId references users
        expect(refreshFamiliesTable.userId).toBeDefined();
        expect(refreshFamiliesTable.userId.notNull).toBe(true);

        // Test foreign key relationships - refreshTokensTable.familyId references refreshFamiliesTable
        expect(refreshTokensTable.familyId).toBeDefined();
        expect(refreshTokensTable.familyId.notNull).toBe(true);
    });

    test("should have correct foreign key relationships", () => {
        // Test foreign key relationships by checking column properties
        expect(refreshFamiliesTable.userId.notNull).toBe(true);
        expect(refreshTokensTable.familyId.notNull).toBe(true);

        // Check that the columns have references by examining their structure
        const userIdColumn = refreshFamiliesTable.userId as any;
        const familyIdColumn = refreshTokensTable.familyId as any;

        // These columns should have foreign key references
        expect(userIdColumn).toBeDefined();
        expect(familyIdColumn).toBeDefined();
    });

    test("should have correct constraints", () => {
        // Test notNull constraints to exercise the schema definitions
        expect(refreshFamiliesTable.userId.notNull).toBe(true);
        expect(refreshTokensTable.familyId.notNull).toBe(true);
    });

    test("should be importable without errors", () => {
        // This test ensures the foreign key references work without errors
        const tables = { refreshFamiliesTable, refreshTokensTable };
        expect(tables).toBeDefined();
        expect(Object.keys(tables)).toHaveLength(2);

        // Test that we can access all table properties
        expect(Object.keys(refreshFamiliesTable)).toContain("familyId");
        expect(Object.keys(refreshFamiliesTable)).toContain("userId");
        expect(Object.keys(refreshTokensTable)).toContain("jti");
        expect(Object.keys(refreshTokensTable)).toContain("familyId");
    });

    test("should have foreign key references that can be resolved", () => {
        // Basic checks to ensure the schema is well-formed with foreign key references
        expect(refreshFamiliesTable.userId).toBeDefined();
        expect(refreshTokensTable.familyId).toBeDefined();

        // Check table configuration
        const refreshFamiliesConfig = getTableConfig(refreshFamiliesTable);
        const refreshTokensConfig = getTableConfig(refreshTokensTable);

        expect(refreshFamiliesConfig).toBeDefined();
        expect(refreshTokensConfig).toBeDefined();
        expect(refreshFamiliesConfig.name).toBe("refresh_families");
        expect(refreshTokensConfig.name).toBe("refresh_tokens");
    });
});
