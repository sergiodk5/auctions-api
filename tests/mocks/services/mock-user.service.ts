/**
 * Mock User Service for testing
 * Provides controllable user operations without needing real database operations
 */

export interface MockUser {
    id: number;
    email: string;
    password?: string;
    isVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MockUserServiceConfig {
    shouldOperationSucceed?: boolean;
    shouldThrowError?: boolean;
    errorMessage?: string;
    mockUsers?: Map<number, MockUser>;
    nextUserId?: number;
}

export class MockUserService {
    private config: MockUserServiceConfig;

    constructor(config: MockUserServiceConfig = {}) {
        this.config = {
            shouldOperationSucceed: true,
            shouldThrowError: false,
            errorMessage: "Mock user service error",
            mockUsers: new Map(),
            nextUserId: 1,
            ...config,
        };
    }

    /**
     * Update the mock configuration during tests
     */
    updateConfig(newConfig: Partial<MockUserServiceConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Mock user creation
     */
    createUser(userData: Omit<MockUser, "id">): Promise<MockUser> {
        return new Promise((resolve, reject) => {
            if (this.config.shouldThrowError) {
                reject(new Error(this.config.errorMessage));
                return;
            }

            if (!this.config.shouldOperationSucceed) {
                reject(new Error("User creation failed"));
                return;
            }

            const newUser: MockUser = {
                id: this.config.nextUserId ?? 1,
                ...userData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            this.config.mockUsers?.set(newUser.id, newUser);
            this.config.nextUserId = (this.config.nextUserId ?? 1) + 1;

            resolve(newUser);
        });
    }

    /**
     * Mock user retrieval by ID
     */
    getUserById(userId: number): Promise<MockUser | null> {
        return new Promise((resolve, reject) => {
            if (this.config.shouldThrowError) {
                reject(new Error(this.config.errorMessage));
                return;
            }

            const user = this.config.mockUsers?.get(userId) ?? null;
            resolve(user);
        });
    }

    /**
     * Mock user retrieval by email
     */
    getUserByEmail(email: string): Promise<MockUser | null> {
        return new Promise((resolve, reject) => {
            if (this.config.shouldThrowError) {
                reject(new Error(this.config.errorMessage));
                return;
            }

            const user = Array.from(this.config.mockUsers?.values() ?? []).find((u) => u.email === email) ?? null;
            resolve(user);
        });
    }

    /**
     * Mock user update
     */
    updateUser(userId: number, updateData: Partial<Omit<MockUser, "id">>): Promise<MockUser> {
        return new Promise((resolve, reject) => {
            if (this.config.shouldThrowError) {
                reject(new Error(this.config.errorMessage));
                return;
            }

            if (!this.config.shouldOperationSucceed) {
                reject(new Error("User update failed"));
                return;
            }

            const existingUser = this.config.mockUsers?.get(userId);
            if (!existingUser) {
                reject(new Error("User not found"));
                return;
            }

            const updatedUser: MockUser = {
                ...existingUser,
                ...updateData,
                updatedAt: new Date(),
            };

            this.config.mockUsers?.set(userId, updatedUser);
            resolve(updatedUser);
        });
    }

    /**
     * Mock user deletion
     */
    deleteUser(userId: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.config.shouldThrowError) {
                reject(new Error(this.config.errorMessage));
                return;
            }

            if (!this.config.shouldOperationSucceed) {
                reject(new Error("User deletion failed"));
                return;
            }

            const deleted = this.config.mockUsers?.delete(userId) ?? false;
            resolve(deleted);
        });
    }

    /**
     * Mock getting all users
     */
    getAllUsers(): Promise<MockUser[]> {
        return new Promise((resolve, reject) => {
            if (this.config.shouldThrowError) {
                reject(new Error(this.config.errorMessage));
                return;
            }

            const users = Array.from(this.config.mockUsers?.values() ?? []);
            resolve(users);
        });
    }

    /**
     * Add a predefined user for testing
     */
    addMockUser(user: MockUser): void {
        this.config.mockUsers?.set(user.id, user);
        if (user.id >= (this.config.nextUserId ?? 1)) {
            this.config.nextUserId = user.id + 1;
        }
    }

    /**
     * Clear all mock users
     */
    clearMockUsers(): void {
        this.config.mockUsers?.clear();
        this.config.nextUserId = 1;
    }

    /**
     * Reset to default configuration
     */
    reset(): void {
        this.config = {
            shouldOperationSucceed: true,
            shouldThrowError: false,
            errorMessage: "Mock user service error",
            mockUsers: new Map(),
            nextUserId: 1,
        };
    }
}
