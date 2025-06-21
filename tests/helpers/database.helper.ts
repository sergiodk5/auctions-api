import container from "@/di/container";
import { TYPES } from "@/di/types";
import { IDatabaseService } from "@/services/database.service";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { resetGlobalSeedingState } from "./rbac-seeder.helper";

let db: ReturnType<typeof drizzle> | null = null;

/**
 * Reset a PostgreSQL sequence to start from 1
 */
const resetSequence = async (sequenceName: string) => {
    if (!db) return;

    try {
        // Check if sequence exists
        const sequenceExistsResult = await db.execute(
            sql.raw(`
            SELECT EXISTS (
                SELECT FROM information_schema.sequences 
                WHERE sequence_schema = 'public' 
                AND sequence_name = '${sequenceName}'
            ) as exists
        `),
        );

        const sequenceExists = (sequenceExistsResult as any)[0]?.exists;
        if (sequenceExists) {
            // Reset sequence to start from 1 (false means next value will be 1)
            await db.execute(sql.raw(`SELECT setval('${sequenceName}', 1, false)`));
        }
    } catch (error) {
        console.log(
            `Sequence reset failed for ${sequenceName}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
    }
};

export const setupTestDatabase = () => {
    if (!db) {
        // Get the database service from the DI container
        // This ensures we use the same database connection as the app
        console.log("🔧 Getting database from DI container");
        const databaseService = container.get<IDatabaseService>(TYPES.IDatabaseService);
        db = databaseService.db;
        console.log("🔧 Using shared database connection from DI container");
    }
    return db;
};

export const cleanupTestDatabase = async () => {
    if (!db) {
        console.warn("Database not initialized, skipping cleanup");
        return;
    }

    try {
        // Reset RBAC seeding state when cleaning database
        resetGlobalSeedingState();

        // Tables to clean up in order (respecting foreign key constraints)
        const tablesToClean = [
            "email_verification",
            "refresh_tokens",
            "refresh_families",
            "user_roles",
            "role_permissions",
            "users",
            "permissions",
            "roles",
            "products", // Add products table to ensure complete cleanup
        ];

        // First, disable all triggers
        await db.execute(sql.raw('SET session_replication_role = "replica";'));

        // Clean up tables only if they exist
        for (const table of tablesToClean) {
            try {
                // Check if the table exists
                const tableExistsResult = await db.execute(
                    sql.raw(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = '${table}'
                    ) as exists
                `),
                );

                // Attempt to handle if tableExistsResult is the array of rows directly, or an object with a .rows property.
                const tableExists = (tableExistsResult as any)?.[0]?.exists ?? tableExistsResult.rows?.[0]?.exists;

                // Only log true values to reduce noise in the test output
                if (tableExists) {
                    console.log(`🧹 Cleaning up table: ${table}`);
                    // Use TRUNCATE ... RESTART IDENTITY CASCADE to ensure proper cleanup
                    await db.execute(sql.raw(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`));

                    // Reset the sequence for this table if it exists
                    const sequenceName = `${table}_id_seq`;
                    await resetSequence(sequenceName);
                } else {
                    console.log(`⏭️ Skipped cleanup for non-existent table: ${table}`);
                }
            } catch (tableError) {
                // Log but don't fail on individual table cleanup errors
                console.log(
                    `Error during cleanup for table ${table}: ${tableError instanceof Error ? tableError.message : "Unknown error"}`,
                );
            }
        }

        // Re-enable triggers
        await db.execute(sql.raw('SET session_replication_role = "origin";'));

        // Explicitly reset known sequences
        const sequences = [
            "users_id_seq",
            "roles_id_seq",
            "permissions_id_seq",
            "email_verification_id_seq",
            "products_id_seq",
        ];

        for (const seq of sequences) {
            await resetSequence(seq);
        }
    } catch (error) {
        console.error("Failed to cleanup test database:", error);
        // Don't throw on cleanup errors - just log them
        console.warn("Continuing with tests despite cleanup errors...");
    }
};

export const closeTestDatabase = () => {
    // Since we're using the shared database connection from DI container,
    // we don't need to close it manually - it will be managed by the container
    if (db) {
        db = null;
    }
};

export const getTestDatabase = () => {
    if (!db) {
        throw new Error("Test database not initialized. Call setupTestDatabase() first.");
    }
    return db;
};
