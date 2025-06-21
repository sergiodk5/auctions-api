import { setupSwagger } from "@/config/swagger";
import jsonErrorHandler from "@/middlewares/json-error-handler";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { Container } from "inversify";
import "reflect-metadata";
import { getTestContainer } from "./test-container.helper";

// Import routes - these will use the test container via dependency injection
import authenticationRoute from "@/routes/authentication.route";
import productRoute from "@/routes/product.route";
import statusRoute from "@/routes/status.route";
import userRoute from "@/routes/user.route";

/**
 * Create an Express app with test configuration
 * @param container Optional test container to use instead of the default test container
 */
export function createTestApp(container?: Container): express.Application {
    console.log("🔧 Creating test app with test container");

    // Ensure we're in test mode
    process.env.NODE_ENV = "test";

    // Initialize the test container (this will be used by routes via DI)
    if (!container) {
        getTestContainer();
    }

    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cors({ credentials: true }));
    app.use(cookieParser());

    // Setup Swagger documentation (optional for tests)
    setupSwagger(app);

    // Use the standard routes - they will get dependencies from the test container
    app.use("/status", statusRoute);
    app.use("/auth", authenticationRoute);
    app.use("/products", productRoute);
    app.use("/users", userRoute);

    app.use(jsonErrorHandler);

    console.log("🔧 Test app created successfully");
    return app;
}

/**
 * Cached test app instance
 */
let testApp: express.Application | null = null;

/**
 * Get or create the test app
 */
export function getTestApp(): express.Application {
    testApp ??= createTestApp();
    return testApp;
}

/**
 * Reset the test app (useful for cleanup)
 */
export function resetTestApp(): void {
    testApp = null;
}
