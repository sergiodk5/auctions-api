/**
 * Mock Authorization Service for testing
 * Provides controllable authorization behavior for RBAC testing
 */

export interface MockAuthorizationServiceConfig {
    shouldAuthorizeSucceed?: boolean;
    mockUserPermissions?: string[];
    shouldThrowError?: boolean;
    errorMessage?: string;
    allowedPermissions?: Set<string>;
}

export class MockAuthorizationService {
    private config: MockAuthorizationServiceConfig;

    constructor(config: MockAuthorizationServiceConfig = {}) {
        this.config = {
            shouldAuthorizeSucceed: undefined, // Don't override permission logic by default
            mockUserPermissions: [],
            shouldThrowError: false,
            errorMessage: "Mock authorization error",
            allowedPermissions: new Set(),
            ...config,
        };
    }

    /**
     * Update the mock configuration during tests
     */
    updateConfig(newConfig: Partial<MockAuthorizationServiceConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Mock user authorization check
     */
    hasPermission(userId: number, permission: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.config.shouldThrowError) {
                reject(new Error(this.config.errorMessage));
                return;
            }

            if (this.config.shouldAuthorizeSucceed !== undefined) {
                resolve(this.config.shouldAuthorizeSucceed);
                return;
            }

            // Check if permission is in the allowed set
            if (this.config.allowedPermissions?.has(permission)) {
                resolve(true);
                return;
            }

            // Check if permission is in mock user permissions
            resolve(this.config.mockUserPermissions?.includes(permission) ?? false);
        });
    }

    /**
     * Mock multiple permissions check
     */
    async hasAnyPermission(userId: number, permissions: string[]): Promise<boolean> {
        if (this.config.shouldThrowError) {
            throw new Error(this.config.errorMessage);
        }

        for (const permission of permissions) {
            if (await this.hasPermission(userId, permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Mock all permissions check
     */
    async hasAllPermissions(userId: number, permissions: string[]): Promise<boolean> {
        if (this.config.shouldThrowError) {
            throw new Error(this.config.errorMessage);
        }

        for (const permission of permissions) {
            if (!(await this.hasPermission(userId, permission))) {
                return false;
            }
        }
        return true;
    }

    /**
     * Mock user roles retrieval
     */
    getUserRoles(userId: number): Promise<string[]> {
        return new Promise((resolve, reject) => {
            if (this.config.shouldThrowError) {
                reject(new Error(this.config.errorMessage));
                return;
            }

            // Return mock roles based on configuration
            if (this.config.mockUserPermissions?.includes("role:manage")) {
                resolve(["admin"]);
                return;
            }
            if (this.config.mockUserPermissions?.includes("user:update")) {
                resolve(["editor"]);
                return;
            }
            resolve(["client"]);
        });
    }

    /**
     * Set specific permissions for testing
     */
    setUserPermissions(permissions: string[]): void {
        this.config.mockUserPermissions = permissions;
    }

    /**
     * Set allowed permissions for testing
     */
    setAllowedPermissions(permissions: string[]): void {
        this.config.allowedPermissions = new Set(permissions);
    }

    /**
     * Reset to default configuration
     */
    reset(): void {
        this.config = {
            shouldAuthorizeSucceed: undefined,
            mockUserPermissions: [],
            shouldThrowError: false,
            errorMessage: "Mock authorization error",
            allowedPermissions: new Set(),
        };
    }
}
