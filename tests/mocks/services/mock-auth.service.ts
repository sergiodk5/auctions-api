/**
 * Mock Authentication Service for testing
 * Provides controllable authentication behavior without needing real JWT operations
 */

export interface MockAuthServiceConfig {
    shouldVerifyTokenSucceed?: boolean;
    mockUserId?: number;
    mockPermissions?: string[];
    shouldThrowError?: boolean;
    errorMessage?: string;
}

export class MockAuthService {
    private config: MockAuthServiceConfig;

    constructor(config: MockAuthServiceConfig = {}) {
        this.config = {
            shouldVerifyTokenSucceed: true,
            mockUserId: 1,
            mockPermissions: [],
            shouldThrowError: false,
            errorMessage: "Mock auth error",
            ...config,
        };
    }

    /**
     * Update the mock configuration during tests
     */
    updateConfig(newConfig: Partial<MockAuthServiceConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Mock token verification
     */
    verifyToken(token: string): Promise<{ userId: number; permissions: string[] }> {
        return new Promise((resolve, reject) => {
            if (this.config.shouldThrowError) {
                reject(new Error(this.config.errorMessage));
                return;
            }

            if (!this.config.shouldVerifyTokenSucceed) {
                reject(new Error("Invalid token"));
                return;
            }

            resolve({
                userId: this.config.mockUserId ?? 1,
                permissions: this.config.mockPermissions ?? [],
            });
        });
    }

    /**
     * Mock token generation
     */
    generateToken(userId: number): string {
        if (this.config.shouldThrowError) {
            throw new Error(this.config.errorMessage);
        }
        return `mock-token-${userId}`;
    }

    /**
     * Mock refresh token generation
     */
    generateRefreshToken(userId: number): string {
        if (this.config.shouldThrowError) {
            throw new Error(this.config.errorMessage);
        }
        return `mock-refresh-token-${userId}`;
    }

    /**
     * Reset to default configuration
     */
    reset(): void {
        this.config = {
            shouldVerifyTokenSucceed: true,
            mockUserId: 1,
            mockPermissions: [],
            shouldThrowError: false,
            errorMessage: "Mock auth error",
        };
    }
}
