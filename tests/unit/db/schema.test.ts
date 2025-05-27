import "reflect-metadata";

import schema from "@/db/schema";

describe("Database Schema", () => {
    test("should export a default schema object", () => {
        expect(schema).toBeDefined();
        expect(typeof schema).toBe("object");
    });

    test("should include usersTable", () => {
        expect(schema.usersTable).toBeDefined();
    });

    test("should include refreshFamiliesTable", () => {
        expect(schema.refreshFamiliesTable).toBeDefined();
    });

    test("should include emailVerificationTable", () => {
        expect(schema.emailVerificationTable).toBeDefined();
    });

    test("should have correct number of tables", () => {
        const schemaKeys = Object.keys(schema);
        expect(schemaKeys.length).toBeGreaterThanOrEqual(3);
    });
});
