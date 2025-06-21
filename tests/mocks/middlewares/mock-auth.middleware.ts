import { NextFunction, Request, Response } from "express";

/**
 * Mock Authentication Middleware for testing
 * Provides controllable authentication behavior
 */

export interface MockAuthMiddlewareConfig {
    shouldAuthenticate?: boolean;
    mockUserId?: number;
    shouldThrowError?: boolean;
    errorMessage?: string;
    statusCode?: number;
}

export class MockAuthMiddleware {
    private config: MockAuthMiddlewareConfig;

    constructor(config: MockAuthMiddlewareConfig = {}) {
        this.config = {
            shouldAuthenticate: true,
            mockUserId: 1,
            shouldThrowError: false,
            errorMessage: "Mock authentication failed",
            statusCode: 401,
            ...config,
        };
    }

    /**
     * Update the mock configuration during tests
     */
    updateConfig(newConfig: Partial<MockAuthMiddlewareConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Mock authentication handler
     */
    handle = (req: Request, res: Response, next: NextFunction): void => {
        if (this.config.shouldThrowError) {
            throw new Error(this.config.errorMessage);
        }

        if (!this.config.shouldAuthenticate) {
            res.status(this.config.statusCode ?? 401).json({
                success: false,
                data: null,
                message: this.config.errorMessage,
            });
            return;
        }

        // Mock successful authentication
        (req as any).user = {
            id: this.config.mockUserId,
            // Add other user properties as needed for tests
        };

        next();
    };

    /**
     * Reset to default configuration
     */
    reset(): void {
        this.config = {
            shouldAuthenticate: true,
            mockUserId: 1,
            shouldThrowError: false,
            errorMessage: "Mock authentication failed",
            statusCode: 401,
        };
    }
}

/**
 * Mock Authorization Middleware for testing
 * Provides controllable authorization behavior
 */

export interface MockAuthorizationMiddlewareConfig {
    shouldAuthorize?: boolean;
    requiredPermissions?: string[];
    shouldThrowError?: boolean;
    errorMessage?: string;
    statusCode?: number;
}

export class MockAuthorizationMiddleware {
    private config: MockAuthorizationMiddlewareConfig;

    constructor(config: MockAuthorizationMiddlewareConfig = {}) {
        this.config = {
            shouldAuthorize: true,
            requiredPermissions: [],
            shouldThrowError: false,
            errorMessage: "Mock authorization failed",
            statusCode: 403,
            ...config,
        };
    }

    /**
     * Update the mock configuration during tests
     */
    updateConfig(newConfig: Partial<MockAuthorizationMiddlewareConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Create authorization middleware for specific permissions
     */
    requirePermissions = (permissions: string[]) => {
        return (req: Request, res: Response, next: NextFunction): void => {
            if (this.config.shouldThrowError) {
                throw new Error(this.config.errorMessage);
            }

            if (!this.config.shouldAuthorize) {
                res.status(this.config.statusCode ?? 403).json({
                    success: false,
                    data: null,
                    message: this.config.errorMessage ?? `Missing required permissions: ${permissions.join(", ")}`,
                });
                return;
            }

            // Mock successful authorization
            next();
        };
    };

    /**
     * Generic authorization handler
     */
    handle = (req: Request, res: Response, next: NextFunction): void => {
        if (this.config.shouldThrowError) {
            throw new Error(this.config.errorMessage);
        }

        if (!this.config.shouldAuthorize) {
            res.status(this.config.statusCode ?? 403).json({
                success: false,
                data: null,
                message: this.config.errorMessage,
            });
            return;
        }

        next();
    };

    /**
     * Reset to default configuration
     */
    reset(): void {
        this.config = {
            shouldAuthorize: true,
            requiredPermissions: [],
            shouldThrowError: false,
            errorMessage: "Mock authorization failed",
            statusCode: 403,
        };
    }
}
