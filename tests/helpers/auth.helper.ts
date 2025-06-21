import jwt from "jsonwebtoken";
import { ACCESS_LIFETIME, JWT_SECRET } from "../../src/config/env";
import { rbacSeeder, type RoleName } from "./rbac-seeder.helper";

export class AuthTestHelper {
    /**
     * Create a JWT token for a user ID that matches the expected format
     * for authentication in the application
     */
    createAuthToken(userId: number): string {
        return jwt.sign(
            {
                sub: userId.toString(), // Subject (user ID)
                jti: `test-${userId}-${Date.now()}`, // JWT ID (unique identifier)
            },
            JWT_SECRET,
            { expiresIn: ACCESS_LIFETIME },
        );
    }

    async createTestUser(email: string, password: string, roleName: string) {
        // Create user with role in database using the imported rbacSeeder instance
        const user = await rbacSeeder.createTestUser(
            { email, password }, // userDto
            roleName as RoleName, // roleName, cast to imported RoleName type
        );

        // Generate JWT token with the same format as expected by AuthenticationGuardMiddleware
        const jti = `test-${user.id}-${Date.now()}`;
        const token = jwt.sign(
            {
                sub: user.id.toString(), // Use 'sub' for user ID as expected by AuthenticationGuardMiddleware
                jti: jti, // Add a unique JWT ID (jti)
            },
            JWT_SECRET,
            { expiresIn: ACCESS_LIFETIME },
        );

        return {
            user,
            token,
        };
    }

    /**
     * Create an admin user (has all permissions)
     */
    async createAdminUser(email = "admin@test.com", password = "admin123") {
        return this.createTestUser(email, password, "admin");
    }

    /**
     * Create an editor user (has product permissions + user:read)
     */
    async createEditorUser(email = "editor@test.com", password = "editor123") {
        return this.createTestUser(email, password, "editor");
    }

    /**
     * Create a client user (has only product permissions)
     */
    async createClientUser(email = "client@test.com", password = "client123") {
        return this.createTestUser(email, password, "client");
    }

    /**
     * Get authorization header for a token
     */
    getAuthHeader(token: string): { Authorization: string } {
        return { Authorization: `Bearer ${token}` };
    }
}

// Export singleton instance
export const authTestHelper = new AuthTestHelper();

// Convenience functions for common test scenarios
// These will now use the modified AuthTestHelper methods
export const createTestAdmin = () => authTestHelper.createAdminUser();
export const createTestEditor = () => authTestHelper.createEditorUser();
export const createTestClient = () => authTestHelper.createClientUser();

// Helper function to get auth headers
export const getAuthHeader = (token: string) => authTestHelper.getAuthHeader(token);

// Helper function to create auth token for user ID
export const createAuthToken = (userId: number) => authTestHelper.createAuthToken(userId);
