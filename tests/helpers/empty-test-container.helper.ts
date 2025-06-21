import { Container } from "inversify";

/**
 * Create a clean test container with no bindings
 * Tests can selectively bind what they need (real services or mocks)
 */
export function createEmptyTestContainer(): Container {
    return new Container({ defaultScope: "Singleton" });
}

/**
 * Create a test container with basic infrastructure services
 * (database, cache, mailer) but no business logic services
 */
export function createBaseTestContainer(): Container {
    const container = new Container({ defaultScope: "Singleton" });

    // Only bind the most basic infrastructure services that tests commonly need
    // Tests can override these with mocks if needed

    return container;
}

/**
 * Reset and return a fresh empty container
 */
export function getFreshTestContainer(): Container {
    return createEmptyTestContainer();
}
