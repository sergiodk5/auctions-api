import UserPermissionRepository, { IUserPermissionRepository } from "@/repositories/user-permission.repository";
import "reflect-metadata";

describe("UserPermissionRepository", () => {
    let mockDb: any;
    let mockCacheClient: any;
    let databaseService: { db: any };
    let cacheService: { client: any };
    let userPermissionRepository: IUserPermissionRepository;

    beforeEach(() => {
        mockDb = {
            selectDistinct: jest.fn(),
        };
        mockCacheClient = {
            get: jest.fn(),
            setEx: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
        };
        databaseService = { db: mockDb };
        cacheService = { client: mockCacheClient };
        userPermissionRepository = new UserPermissionRepository(databaseService as any, cacheService as any);

        // Mock console methods to avoid noise in tests
        jest.spyOn(console, "warn").mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getPermissions", () => {
        const mockPermissions = [
            {
                id: 1,
                name: "users:read",
                description: "Read users",
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                name: "users:write",
                description: "Write users",
                created_at: new Date(),
                updated_at: new Date(),
            },
        ];

        it("should return cached permissions when cache is enabled and data exists", async () => {
            const userId = 1;
            const cachedPermissions = [
                {
                    id: 1,
                    name: "users:read",
                    description: "Read users",
                    created_at: "2025-05-29T19:57:30.889Z",
                    updated_at: "2025-05-29T19:57:30.889Z",
                },
                {
                    id: 2,
                    name: "users:write",
                    description: "Write users",
                    created_at: "2025-05-29T19:57:30.889Z",
                    updated_at: "2025-05-29T19:57:30.889Z",
                },
            ];
            mockCacheClient.get.mockResolvedValue(JSON.stringify(cachedPermissions));

            const result = await userPermissionRepository.getPermissions(userId, { useCache: true });

            expect(result).toEqual(cachedPermissions);
            expect(mockCacheClient.get).toHaveBeenCalledWith("permissions:user:1");
            expect(mockDb.selectDistinct).not.toHaveBeenCalled();
        });

        it("should fetch from database when cache is enabled but no cached data exists", async () => {
            const userId = 1;
            mockCacheClient.get.mockResolvedValue(null);

            // Mock database query chain
            mockDb.selectDistinct.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        innerJoin: jest.fn().mockReturnValue({
                            where: jest.fn().mockResolvedValue(mockPermissions),
                        }),
                    }),
                }),
            });

            const result = await userPermissionRepository.getPermissions(userId, { useCache: true });

            expect(result).toEqual(mockPermissions);
            expect(mockCacheClient.get).toHaveBeenCalledWith("permissions:user:1");
            expect(mockDb.selectDistinct).toHaveBeenCalled();
            expect(mockCacheClient.setEx).toHaveBeenCalledWith(
                "permissions:user:1",
                300,
                JSON.stringify(mockPermissions),
            );
        });

        it("should fetch from database when cache is disabled", async () => {
            const userId = 1;

            // Mock database query chain
            mockDb.selectDistinct.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        innerJoin: jest.fn().mockReturnValue({
                            where: jest.fn().mockResolvedValue(mockPermissions),
                        }),
                    }),
                }),
            });

            const result = await userPermissionRepository.getPermissions(userId, { useCache: false });

            expect(result).toEqual(mockPermissions);
            expect(mockCacheClient.get).not.toHaveBeenCalled();
            expect(mockDb.selectDistinct).toHaveBeenCalled();
            expect(mockCacheClient.setEx).not.toHaveBeenCalled();
        });

        it("should default to using cache when no options are provided", async () => {
            const userId = 1;
            const cachedPermissions = [
                {
                    id: 1,
                    name: "users:read",
                    description: "Read users",
                    created_at: "2025-05-29T19:57:30.889Z",
                    updated_at: "2025-05-29T19:57:30.889Z",
                },
                {
                    id: 2,
                    name: "users:write",
                    description: "Write users",
                    created_at: "2025-05-29T19:57:30.889Z",
                    updated_at: "2025-05-29T19:57:30.889Z",
                },
            ];
            mockCacheClient.get.mockResolvedValue(JSON.stringify(cachedPermissions));

            const result = await userPermissionRepository.getPermissions(userId);

            expect(result).toEqual(cachedPermissions);
            expect(mockCacheClient.get).toHaveBeenCalledWith("permissions:user:1");
        });

        it("should fallback to database when cache read fails", async () => {
            const userId = 1;
            mockCacheClient.get.mockRejectedValue(new Error("Cache error"));

            // Mock database query chain
            mockDb.selectDistinct.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        innerJoin: jest.fn().mockReturnValue({
                            where: jest.fn().mockResolvedValue(mockPermissions),
                        }),
                    }),
                }),
            });

            const result = await userPermissionRepository.getPermissions(userId, { useCache: true });

            expect(result).toEqual(mockPermissions);
            expect(console.warn).toHaveBeenCalledWith("Failed to get permissions from cache:", expect.any(Error));
            expect(mockDb.selectDistinct).toHaveBeenCalled();
        });

        it("should continue when cache write fails", async () => {
            const userId = 1;
            mockCacheClient.get.mockResolvedValue(null);
            mockCacheClient.setEx.mockRejectedValue(new Error("Cache write error"));

            // Mock database query chain
            mockDb.selectDistinct.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        innerJoin: jest.fn().mockReturnValue({
                            where: jest.fn().mockResolvedValue(mockPermissions),
                        }),
                    }),
                }),
            });

            const result = await userPermissionRepository.getPermissions(userId, { useCache: true });

            expect(result).toEqual(mockPermissions);
            expect(console.warn).toHaveBeenCalledWith("Failed to cache permissions:", expect.any(Error));
        });

        it("should return empty array when user has no permissions", async () => {
            const userId = 1;
            mockCacheClient.get.mockResolvedValue(null);

            // Mock database query chain
            mockDb.selectDistinct.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        innerJoin: jest.fn().mockReturnValue({
                            where: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                }),
            });

            const result = await userPermissionRepository.getPermissions(userId);

            expect(result).toEqual([]);
        });
    });

    describe("invalidateUserPermissions", () => {
        it("should delete user-specific cache entry", async () => {
            const userId = 1;
            mockCacheClient.del.mockResolvedValue(1);

            await userPermissionRepository.invalidateUserPermissions(userId);

            expect(mockCacheClient.del).toHaveBeenCalledWith("permissions:user:1");
        });

        it("should handle cache deletion errors gracefully", async () => {
            const userId = 1;
            mockCacheClient.del.mockRejectedValue(new Error("Cache delete error"));

            await userPermissionRepository.invalidateUserPermissions(userId);

            expect(console.warn).toHaveBeenCalledWith(
                "Failed to invalidate user permissions cache:",
                expect.any(Error),
            );
        });
    });

    describe("invalidateAllUserPermissions", () => {
        it("should delete all user permission cache entries", async () => {
            const mockKeys = ["permissions:user:1", "permissions:user:2", "permissions:user:3"];
            mockCacheClient.keys.mockResolvedValue(mockKeys);
            mockCacheClient.del.mockResolvedValue(3);

            await userPermissionRepository.invalidateAllUserPermissions();

            expect(mockCacheClient.keys).toHaveBeenCalledWith("permissions:user:*");
            expect(mockCacheClient.del).toHaveBeenCalledWith(mockKeys);
        });

        it("should not call del when no keys exist", async () => {
            mockCacheClient.keys.mockResolvedValue([]);

            await userPermissionRepository.invalidateAllUserPermissions();

            expect(mockCacheClient.keys).toHaveBeenCalledWith("permissions:user:*");
            expect(mockCacheClient.del).not.toHaveBeenCalled();
        });

        it("should handle cache operations errors gracefully", async () => {
            mockCacheClient.keys.mockRejectedValue(new Error("Cache keys error"));

            await userPermissionRepository.invalidateAllUserPermissions();

            expect(console.warn).toHaveBeenCalledWith(
                "Failed to invalidate all user permissions cache:",
                expect.any(Error),
            );
        });
    });
});
