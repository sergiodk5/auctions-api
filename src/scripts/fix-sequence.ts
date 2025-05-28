import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

interface SequenceFixOptions {
    tableName: string;
    idColumn?: string;
    sequenceName?: string;
}

/**
 * Fixes PostgreSQL sequence values that get out of sync when inserting records with explicit IDs
 * @param options Configuration object
 * @param options.tableName The name of the table to fix
 * @param options.idColumn The name of the ID column (defaults to 'id')
 * @param options.sequenceName The name of the sequence (defaults to '{tableName}_{idColumn}_seq')
 */
export async function fixSequence(options: SequenceFixOptions): Promise<void> {
    const { tableName, idColumn = "id", sequenceName } = options;
    const defaultSequenceName = sequenceName ?? `${tableName}_${idColumn}_seq`;

    console.log(`🔧 Fixing sequence for table: ${tableName}`);

    try {
        // Get the current max ID from the table
        const maxIdQuery = `SELECT MAX(${idColumn}) as max_id FROM ${tableName}`;
        const result = await pool.query(maxIdQuery);
        const maxId = parseInt(result.rows[0].max_id) || 0;
        console.log(`📊 Current max ${idColumn} in ${tableName}: ${maxId}`);

        // Get current sequence value
        const seqQuery = `SELECT last_value FROM ${defaultSequenceName}`;
        const seqResult = await pool.query(seqQuery);
        const currentSeq = parseInt(seqResult.rows[0].last_value) || 0;
        console.log(`🔢 Current sequence value for ${defaultSequenceName}: ${currentSeq}`);

        if (maxId >= currentSeq) {
            // Reset sequence to max_id + 1
            const newSeq = maxId + 1;
            await pool.query(`SELECT setval('${defaultSequenceName}', ${newSeq})`);
            console.log(`✅ Sequence ${defaultSequenceName} reset to: ${newSeq}`);
        } else {
            console.log(`✅ Sequence ${defaultSequenceName} is already correct`);
        }
    } catch (error: any) {
        if (error.code === "42P01") {
            console.error(`❌ Table '${tableName}' does not exist`);
        } else if (error.code === "42703") {
            console.error(`❌ Column '${idColumn}' does not exist in table '${tableName}'`);
        } else if (error.message.includes("does not exist")) {
            console.error(`❌ Sequence '${defaultSequenceName}' does not exist`);
            console.log(`💡 Available sequences for table ${tableName}:`);
            try {
                const seqListResult = await pool.query(`
                    SELECT sequence_name 
                    FROM information_schema.sequences 
                    WHERE sequence_name LIKE '%${tableName}%'
                `);
                seqListResult.rows.forEach((row) => {
                    console.log(`   - ${row.sequence_name}`);
                });
            } catch (listError) {
                console.log(`   Could not list sequences: ${listError}`);
            }
        } else {
            console.error("❌ Error fixing sequence:", error);
            throw error;
        }
    }
}

/**
 * CLI function to fix sequence from command line arguments
 */
async function fixSequenceFromCLI() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
🔧 PostgreSQL Sequence Fix Utility

Usage: 
  npm run fix-sequence <table-name> [id-column] [sequence-name]
  
Examples:
  npm run fix-sequence users
  npm run fix-sequence users id
  npm run fix-sequence users id users_id_seq
  npm run fix-sequence roles
  npm run fix-sequence permissions

This utility fixes PostgreSQL sequences that get out of sync when records
are inserted with explicit ID values (common after data imports/seeding).
        `);
        process.exit(1);
    }

    const [tableName, idColumn, sequenceName] = args;

    console.log(`🌱 Starting sequence fix for table: ${tableName}`);

    try {
        await fixSequence({
            tableName,
            idColumn,
            sequenceName,
        });
        console.log(`🎉 Sequence fix completed successfully!`);
    } catch (error) {
        console.error(`❌ Sequence fix failed:`, error);
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
    void fixSequenceFromCLI();
}
