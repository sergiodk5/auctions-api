import { IDatabaseService } from "@/services/database.service";
import { injectable } from "inversify";

/**
 * Mock database service configuration for testing
 */
export interface MockDatabaseServiceConfig {
    shouldConnectSucceed?: boolean;
    shouldQuerySucceed?: boolean;
    shouldThrowError?: boolean;
    errorMessage?: string;
    mockQueryResult?: any;
}

/**
 * Mock database service for unit tests
 * Returns predictable data and tracks method calls
 */
@injectable()
export class MockDatabaseService implements IDatabaseService {
    public db: any;
    public callLog: { method: string; args: any[] }[] = [];
    private config: MockDatabaseServiceConfig;

    constructor(config: MockDatabaseServiceConfig = {}) {
        this.config = {
            shouldConnectSucceed: true,
            shouldQuerySucceed: true,
            shouldThrowError: false,
            errorMessage: "Mock database error",
            mockQueryResult: null,
            ...config,
        };

        // Create a mock database object with commonly used methods
        this.db = {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn(),
            query: jest.fn(),
            // Add transaction support
            transaction: jest.fn().mockImplementation((callback: (db: any) => any) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return callback(this.db);
            }),
        };
    }

    /**
     * Update the mock configuration during tests
     */
    updateConfig(newConfig: Partial<MockDatabaseServiceConfig>): void {
        this.config = { ...this.config, ...newConfig };

        // Update mock behavior based on new config
        if (this.config.shouldQuerySucceed) {
            this.db.execute.mockResolvedValue(this.config.mockQueryResult);
            this.db.query.mockResolvedValue(this.config.mockQueryResult);
        } else {
            this.db.execute.mockRejectedValue(new Error(this.config.errorMessage));
            this.db.query.mockRejectedValue(new Error(this.config.errorMessage));
        }
    }

    /**
     * Configure the mock to return specific data for queries
     */
    public mockQueryResult(result: any): void {
        this.db.execute.mockResolvedValue(result);
        this.db.query.mockResolvedValue(result);
    }

    /**
     * Clear all mock call history
     */
    public clearMocks(): void {
        this.callLog = [];
        jest.clearAllMocks();
    }

    /**
     * Get the number of times a specific method was called
     */
    public getCallCount(method: string): number {
        return this.callLog.filter((call) => call.method === method).length;
    }

    /**
     * Reset to default configuration
     */
    reset(): void {
        this.config = {
            shouldConnectSucceed: true,
            shouldQuerySucceed: true,
            shouldThrowError: false,
            errorMessage: "Mock database error",
            mockQueryResult: null,
        };
        this.clearMocks();
    }
}
