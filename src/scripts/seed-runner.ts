import path from "path";

// Get the seeder name from command line arguments
const seederName = process.argv[2];

if (!seederName) {
    console.error("❌ Error: Please provide a seeder name");
    console.log("Usage: npm run db:seed <seeder-name>");
    console.log("Example: npm run db:seed users");
    process.exit(1);
}

async function runSeeder() {
    try {
        console.log(`🌱 Starting seeder: ${seederName}`);

        // Construct the path to the seeder file
        const seederPath = path.join(process.cwd(), "src", "db", "seeds", `${seederName}.seeder.ts`);
        console.log(`📂 Loading from: ${seederPath}`);

        // Dynamically import the seeder module
        const seederModule = await import(seederPath);

        // Look for the seeder function (try multiple naming conventions)
        const camelCaseName = seederName.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
        const possibleNames = [
            `${seederName}Seeder`, // usersSeeder
            `${camelCaseName}Seeder`, // rolePermissionsSeeder for role-permissions
            `${seederName.slice(0, -1)}Seeder`, // userSeeder (remove 's' if plural)
            `${seederName}seeder`, // usersseeder (lowercase)
            seederName, // users
            "default", // default export
        ];

        let seederFunction: (() => Promise<void>) | undefined;
        let actualFunctionName: string | undefined;

        for (const functionName of possibleNames) {
            if (seederModule[functionName] && typeof seederModule[functionName] === "function") {
                seederFunction = seederModule[functionName];
                actualFunctionName = functionName;
                break;
            }
        }

        if (!seederFunction || !actualFunctionName) {
            console.error(`❌ Error: No seeder function found in ${seederName}.seeder.ts`);
            console.log(`💡 Tried looking for functions: ${possibleNames.join(", ")}`);
            console.log(`💡 Available exports:`, Object.keys(seederModule));
            console.log(`💡 Make sure your seeder exports one of the expected function names`);
            process.exit(1);
        }

        // Execute the seeder
        console.log(`⚡ Executing ${actualFunctionName}...`);
        await seederFunction();

        console.log(`✅ Seeder '${seederName}' completed successfully!`);
    } catch (error: any) {
        if (error.code === "ERR_MODULE_NOT_FOUND" || error.message.includes("Cannot resolve module")) {
            console.error(`❌ Error: Seeder file '${seederName}.seeder.ts' not found`);
            console.log(`💡 Make sure the seeder file exists at: src/db/seeds/${seederName}.seeder.ts`);
        } else {
            console.error(`❌ Error running seeder '${seederName}':`, error.message);
            if (error.stack) {
                console.error(error.stack);
            }
        }
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error.message);
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});

// Run the seeder
runSeeder().catch((error: unknown) => {
    console.error("❌ Fatal error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
});
