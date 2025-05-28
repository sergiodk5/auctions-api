import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { Pool } from "pg";
import { fixSequence } from "./fix-sequence";

// Create a pool for this script
const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });

/**
 * Fix sequences for all common tables in the application
 * This is useful to run after a full database seed or import
 */
export async function fixAllSequences(): Promise<void> {
    console.log("🔧 Fixing all sequences...");

    // Tables with auto-incrementing ID columns
    const tablesWithSequences = [
        "users",
        "roles",
        "permissions",
        "role_permissions",
        // Note: user_roles is a junction table without an ID column
        // Add more tables as your application grows
    ];

    const results = [];

    for (const table of tablesWithSequences) {
        try {
            console.log(`\n📋 Processing ${table}...`);
            await fixSequence({ tableName: table });
            results.push({ table, status: "success" });
        } catch (error: any) {
            console.error(`❌ Failed to fix sequence for ${table}:`, error.message);
            results.push({ table, status: "failed", error: error.message });
        }
    }

    console.log("\n📊 Summary:");
    results.forEach(({ table, status, error }) => {
        if (status === "success") {
            console.log(`  ✅ ${table}: Fixed`);
        } else {
            console.log(`  ❌ ${table}: Failed - ${error}`);
        }
    });

    const successCount = results.filter((r) => r.status === "success").length;
    const failCount = results.filter((r) => r.status === "failed").length;

    console.log(`\n🎯 Results: ${successCount} successful, ${failCount} failed`);
}

/**
 * CLI function to fix all sequences
 */
async function fixAllSequencesFromCLI() {
    console.log("🌱 Starting bulk sequence fix...");

    try {
        await fixAllSequences();
        console.log("🎉 Bulk sequence fix completed!");
    } catch (error) {
        console.error("❌ Bulk sequence fix failed:", error);
        process.exit(1);
    } finally {
        try {
            await pool.end();
            console.log("🔌 Database connection closed");
        } catch (closeError) {
            console.error("❌ Error closing connection:", closeError);
        }
    }
}

// Run CLI if this file is executed directly
if (require.main === module) {
    fixAllSequencesFromCLI().catch((error: unknown) => {
        console.error("❌ Unhandled error:", error);
        process.exit(1);
    });
}
