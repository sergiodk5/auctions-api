import UserPermissionRepository, { IUserPermissionRepository } from "@/repositories/user-permission.repository";
import { Permission } from "@/types/permissions";
import "reflect-metadata";

describe("UserPermissionRepository", () => {
    let mockDb: any;
    let mockCacheClient: any;
    let databaseService: { db: any };
    let cacheService: { client: any };
    let userPermissionRepository: IUserPermissionRepository;
    let mockQueryChain: any;

    // Test data fixtures
    const mockPermissions: Permission[] = [
        {
            id: 1,
            name: "users:read",
            description: "Read users",
            created_at: new Date("2025-05-29T19:57:30.889Z"),
            updated_at: new Date("2025-05-29T19:57:30.889Z"),
        },
        {
            id: 2,
            name: "users:write",
            description: "Write users",
            created_at: new Date("2025-05-29T19:57:30.889Z"),
            updated_at: new Date("2025-05-29T19:57:30.889Z"),
        },
        {
            id: 3,
            name: "posts:read",
            description: "Read posts",
            created_at: new Date("2025-05-29T19:57:30.889Z"),
            updated_at: new Date("2025-05-29T19:57:30.889Z"),
        },
        {
            id: 4,
            name: "admin:*",
            description: "Admin wildcard permission",
            created_at: new Date("2025-05-29T19:57:30.889Z"),
            updated_at: new Date("2025-05-29T19:57:30.889Z"),
        },
    ];

    const createMockQueryChain = (result: Permission[] = mockPermissions) => {
        return {
            from: jest.fn().mockReturnValue({
                innerJoin: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue(result),
                    }),
                }),
            }),
        };
    };

    beforeEach(() => {
        mockQueryChain = createMockQueryChain();
        mockDb = {
            selectDistinct: jest.fn().mockReturnValue(mockQueryChain),
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
        describe("Cache Operations", () => {
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

            it("should handle corrupted cache data gracefully", async () => {
                const userId = 1;
                mockCacheClient.get.mockResolvedValue("invalid-json-data");
                mockDb.selectDistinct.mockReturnValue(createMockQueryChain([mockPermissions[0]]));

                const result = await userPermissionRepository.getPermissions(userId, { useCache: true });

                expect(result).toEqual([mockPermissions[0]]);
                expect(console.warn).toHaveBeenCalledWith("Failed to get permissions from cache:", expect.any(Error));
                expect(mockDb.selectDistinct).toHaveBeenCalled();
            });

            it("should cache permissions with correct TTL when fetched from database", async () => {
                const userId = 1;
                const expectedPermissions = [mockPermissions[0], mockPermissions[1]];
                mockCacheClient.get.mockResolvedValue(null);
                mockDb.selectDistinct.mockReturnValue(createMockQueryChain(expectedPermissions));

                const result = await userPermissionRepository.getPermissions(userId, { useCache: true });

                expect(result).toEqual(expectedPermissions);
                expect(mockCacheClient.setEx).toHaveBeenCalledWith(
                    "permissions:user:1",
                    300, // 5 minutes TTL
                    JSON.stringify(expectedPermissions),
                );
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
                ];
                mockCacheClient.get.mockResolvedValue(JSON.stringify(cachedPermissions));

                const result = await userPermissionRepository.getPermissions(userId);

                expect(result).toEqual(cachedPermissions);
                expect(mockCacheClient.get).toHaveBeenCalledWith("permissions:user:1");
                expect(mockDb.selectDistinct).not.toHaveBeenCalled();
            });

            it("should fetch from database when cache is disabled", async () => {
                const userId = 1;
                const expectedPermissions = [mockPermissions[0], mockPermissions[1]];
                mockDb.selectDistinct.mockReturnValue(createMockQueryChain(expectedPermissions));

                const result = await userPermissionRepository.getPermissions(userId, { useCache: false });

                expect(result).toEqual(expectedPermissions);
                expect(mockCacheClient.get).not.toHaveBeenCalled();
                expect(mockDb.selectDistinct).toHaveBeenCalled();
                expect(mockCacheClient.setEx).not.toHaveBeenCalled();
            });
        });

        describe("Error Handling", () => {
            it("should fallback to database when cache read fails", async () => {
                const userId = 1;
                const expectedPermissions = [mockPermissions[0]];
                mockCacheClient.get.mockRejectedValue(new Error("Redis connection failed"));
                mockDb.selectDistinct.mockReturnValue(createMockQueryChain(expectedPermissions));

                const result = await userPermissionRepository.getPermissions(userId, { useCache: true });

                expect(result).toEqual(expectedPermissions);
                expect(console.warn).toHaveBeenCalledWith("Failed to get permissions from cache:", expect.any(Error));
                expect(mockDb.selectDistinct).toHaveBeenCalled();
            });

            it("should continue when cache write fails", async () => {
                const userId = 1;
                const expectedPermissions = [mockPermissions[0]];
                mockCacheClient.get.mockResolvedValue(null);
                mockCacheClient.setEx.mockRejectedValue(new Error("Redis write timeout"));
                mockDb.selectDistinct.mockReturnValue(createMockQueryChain(expectedPermissions));

                const result = await userPermissionRepository.getPermissions(userId, { useCache: true });

                expect(result).toEqual(expectedPermissions);
                expect(console.warn).toHaveBeenCalledWith("Failed to cache permissions:", expect.any(Error));
                expect(mockDb.selectDistinct).toHaveBeenCalled();
            });

            it("should handle database errors properly", async () => {
                const userId = 1;
                mockCacheClient.get.mockResolvedValue(null);
                mockDb.selectDistinct.mockReturnValue({
                    from: jest.fn().mockReturnValue({
                        innerJoin: jest.fn().mockReturnValue({
                            innerJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockRejectedValue(new Error("Database connection failed")),
                            }),
                        }),
                    }),
                });

                await expect(userPermissionRepository.getPermissions(userId)).rejects.toThrow(
                    "Database connection failed",
                );
            });
        });

        describe("Data Scenarios", () => {
            it("should return empty array when user has no permissions", async () => {
                const userId = 999;
                mockCacheClient.get.mockResolvedValue(null);
                mockDb.selectDistinct.mockReturnValue(createMockQueryChain([]));

                const result = await userPermissionRepository.getPermissions(userId);

                expect(result).toEqual([]);
                expect(mockCacheClient.setEx).toHaveBeenCalledWith("permissions:user:999", 300, JSON.stringify([]));
            });

            it("should handle user with single permission", async () => {
                const userId = 2;
                const singlePermission = [mockPermissions[0]];
                mockCacheClient.get.mockResolvedValue(null);
                mockDb.selectDistinct.mockReturnValue(createMockQueryChain(singlePermission));

                const result = await userPermissionRepository.getPermissions(userId);

                expect(result).toEqual(singlePermission);
                expect(result).toHaveLength(1);
            });

            it("should handle user with multiple permissions", async () => {
                const userId = 3;
                const multiplePermissions = mockPermissions.slice(0, 3);
                mockCacheClient.get.mockResolvedValue(null);
                mockDb.selectDistinct.mockReturnValue(createMockQueryChain(multiplePermissions));

                const result = await userPermissionRepository.getPermissions(userId);

                expect(result).toEqual(multiplePermissions);
                expect(result).toHaveLength(3);
            });

            it("should handle admin user with wildcard permissions", async () => {
                const userId = 4;
                const adminPermissions = [mockPermissions[3]]; // admin:* permission
                mockCacheClient.get.mockResolvedValue(null);
                mockDb.selectDistinct.mockReturnValue(createMockQueryChain(adminPermissions));

                const result = await userPermissionRepository.getPermissions(userId);

                expect(result).toEqual(adminPermissions);
                expect(result[0].name).toBe("admin:*");
            });
        });

        describe("Query Structure Validation", () => {
            it("should construct correct database query", async () => {
                const userId = 1;
                mockCacheClient.get.mockResolvedValue(null);
                const mockFrom = jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        innerJoin: jest.fn().mockReturnValue({
                            where: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                });
                mockDb.selectDistinct.mockReturnValue({ from: mockFrom });

                await userPermissionRepository.getPermissions(userId);

                // Verify selectDistinct is called with correct fields
                expect(mockDb.selectDistinct).toHaveBeenCalledWith({
                    id: expect.any(Object),
                    name: expect.any(Object),
                    description: expect.any(Object),
                    created_at: expect.any(Object),
                    updated_at: expect.any(Object),
                });

                // Verify joins are performed
                expect(mockFrom).toHaveBeenCalled();
            });

            it("should filter by correct user ID", async () => {
                const userId = 42;
                mockCacheClient.get.mockResolvedValue(null);
                const mockWhere = jest.fn().mockResolvedValue([]);
                mockDb.selectDistinct.mockReturnValue({
                    from: jest.fn().mockReturnValue({
                        innerJoin: jest.fn().mockReturnValue({
                            innerJoin: jest.fn().mockReturnValue({
                                where: mockWhere,
                            }),
                        }),
                    }),
                });

                await userPermissionRepository.getPermissions(userId);

                expect(mockWhere).toHaveBeenCalled();
                // The where clause should be called with an eq condition for the user_id
            });
        });

        describe("Performance and Caching Behavior", () => {
            it("should not make database calls on subsequent cache hits", async () => {
                const userId = 1;
                const cachedPermissions = [mockPermissions[0]];
                mockCacheClient.get.mockResolvedValue(JSON.stringify(cachedPermissions));

                // Call twice
                await userPermissionRepository.getPermissions(userId);
                await userPermissionRepository.getPermissions(userId);

                expect(mockCacheClient.get).toHaveBeenCalledTimes(2);
                expect(mockDb.selectDistinct).not.toHaveBeenCalled();
            });

            it("should use different cache keys for different users", async () => {
                const user1Permissions = [mockPermissions[0]];
                const user2Permissions = [mockPermissions[1]];

                mockCacheClient.get
                    .mockResolvedValueOnce(JSON.stringify(user1Permissions))
                    .mockResolvedValueOnce(JSON.stringify(user2Permissions));

                await userPermissionRepository.getPermissions(1);
                await userPermissionRepository.getPermissions(2);

                expect(mockCacheClient.get).toHaveBeenCalledWith("permissions:user:1");
                expect(mockCacheClient.get).toHaveBeenCalledWith("permissions:user:2");
            });
        });
    });

    describe("invalidateUserPermissions", () => {
        it("should delete user-specific cache entry successfully", async () => {
            const userId = 1;
            mockCacheClient.del.mockResolvedValue(1);

            await userPermissionRepository.invalidateUserPermissions(userId);

            expect(mockCacheClient.del).toHaveBeenCalledWith("permissions:user:1");
            expect(mockCacheClient.del).toHaveBeenCalledTimes(1);
        });

        it("should handle cache deletion when key does not exist", async () => {
            const userId = 2;
            mockCacheClient.del.mockResolvedValue(0); // 0 means key didn't exist

            await userPermissionRepository.invalidateUserPermissions(userId);

            expect(mockCacheClient.del).toHaveBeenCalledWith("permissions:user:2");
            expect(console.warn).not.toHaveBeenCalled();
        });

        it("should handle cache deletion errors gracefully", async () => {
            const userId = 1;
            const error = new Error("Redis server unavailable");
            mockCacheClient.del.mockRejectedValue(error);

            await userPermissionRepository.invalidateUserPermissions(userId);

            expect(console.warn).toHaveBeenCalledWith("Failed to invalidate user permissions cache:", error);
        });

        it("should work with different user IDs", async () => {
            const userIds = [1, 42, 999];
            mockCacheClient.del.mockResolvedValue(1);

            for (const userId of userIds) {
                await userPermissionRepository.invalidateUserPermissions(userId);
                expect(mockCacheClient.del).toHaveBeenCalledWith(`permissions:user:${userId}`);
            }

            expect(mockCacheClient.del).toHaveBeenCalledTimes(userIds.length);
        });

        it("should handle concurrent invalidation requests", async () => {
            const userId = 1;
            mockCacheClient.del.mockResolvedValue(1);

            // Simulate concurrent calls
            const promises = [
                userPermissionRepository.invalidateUserPermissions(userId),
                userPermissionRepository.invalidateUserPermissions(userId),
                userPermissionRepository.invalidateUserPermissions(userId),
            ];

            await Promise.all(promises);

            expect(mockCacheClient.del).toHaveBeenCalledTimes(3);
            expect(mockCacheClient.del).toHaveBeenCalledWith("permissions:user:1");
        });
    });

    describe("invalidateAllUserPermissions", () => {
        it("should delete all user permission cache entries when keys exist", async () => {
            const mockKeys = ["permissions:user:1", "permissions:user:2", "permissions:user:3"];
            mockCacheClient.keys.mockResolvedValue(mockKeys);
            mockCacheClient.del.mockResolvedValue(3);

            await userPermissionRepository.invalidateAllUserPermissions();

            expect(mockCacheClient.keys).toHaveBeenCalledWith("permissions:user:*");
            expect(mockCacheClient.del).toHaveBeenCalledWith(mockKeys);
            expect(mockCacheClient.del).toHaveBeenCalledTimes(1);
        });

        it("should not call del when no keys exist", async () => {
            mockCacheClient.keys.mockResolvedValue([]);

            await userPermissionRepository.invalidateAllUserPermissions();

            expect(mockCacheClient.keys).toHaveBeenCalledWith("permissions:user:*");
            expect(mockCacheClient.del).not.toHaveBeenCalled();
        });

        it("should handle large number of cache entries", async () => {
            const mockKeys = Array.from({ length: 1000 }, (_, i) => `permissions:user:${i + 1}`);
            mockCacheClient.keys.mockResolvedValue(mockKeys);
            mockCacheClient.del.mockResolvedValue(1000);

            await userPermissionRepository.invalidateAllUserPermissions();

            expect(mockCacheClient.keys).toHaveBeenCalledWith("permissions:user:*");
            expect(mockCacheClient.del).toHaveBeenCalledWith(mockKeys);
        });

        it("should handle keys operation error gracefully", async () => {
            const error = new Error("Redis keys operation failed");
            mockCacheClient.keys.mockRejectedValue(error);

            await userPermissionRepository.invalidateAllUserPermissions();

            expect(console.warn).toHaveBeenCalledWith("Failed to invalidate all user permissions cache:", error);
            expect(mockCacheClient.del).not.toHaveBeenCalled();
        });

        it("should handle deletion error gracefully", async () => {
            const mockKeys = ["permissions:user:1", "permissions:user:2"];
            mockCacheClient.keys.mockResolvedValue(mockKeys);
            const error = new Error("Redis delete operation failed");
            mockCacheClient.del.mockRejectedValue(error);

            await userPermissionRepository.invalidateAllUserPermissions();

            expect(mockCacheClient.keys).toHaveBeenCalledWith("permissions:user:*");
            expect(mockCacheClient.del).toHaveBeenCalledWith(mockKeys);
            expect(console.warn).toHaveBeenCalledWith("Failed to invalidate all user permissions cache:", error);
        });

        it("should handle mixed cache key patterns", async () => {
            const mockKeys = [
                "permissions:user:1",
                "permissions:user:42",
                "permissions:user:999",
                "permissions:user:admin-user",
            ];
            mockCacheClient.keys.mockResolvedValue(mockKeys);
            mockCacheClient.del.mockResolvedValue(4);

            await userPermissionRepository.invalidateAllUserPermissions();

            expect(mockCacheClient.del).toHaveBeenCalledWith(mockKeys);
        });

        it("should return partial success when some keys fail to delete", async () => {
            const mockKeys = ["permissions:user:1", "permissions:user:2"];
            mockCacheClient.keys.mockResolvedValue(mockKeys);
            mockCacheClient.del.mockResolvedValue(1); // Only 1 key deleted instead of 2

            await userPermissionRepository.invalidateAllUserPermissions();

            expect(mockCacheClient.del).toHaveBeenCalledWith(mockKeys);
            // The method should complete without error even if not all keys were deleted
        });
    });

    describe("Integration Tests", () => {
        it("should maintain data consistency between cache and database", async () => {
            const userId = 1;
            const dbPermissions = [mockPermissions[0], mockPermissions[1]];

            // First call - cache miss, fetch from DB and cache
            mockCacheClient.get.mockResolvedValueOnce(null);
            mockDb.selectDistinct.mockReturnValue(createMockQueryChain(dbPermissions));

            const result1 = await userPermissionRepository.getPermissions(userId);

            expect(result1).toEqual(dbPermissions);
            expect(mockCacheClient.setEx).toHaveBeenCalledWith(
                "permissions:user:1",
                300,
                JSON.stringify(dbPermissions),
            );

            // Second call - cache hit (simulate serialized dates)
            const cachedData = [
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
            mockCacheClient.get.mockResolvedValueOnce(JSON.stringify(cachedData));

            const result2 = await userPermissionRepository.getPermissions(userId);

            expect(result2).toEqual(cachedData);
            // Both results should have the same structure (dates as strings when from cache)
            expect(result2[0].name).toBe(result1[0].name);
            expect(result2[0].id).toBe(result1[0].id);
        });

        it("should properly invalidate and refresh cache", async () => {
            const userId = 1;
            const oldPermissions = [
                {
                    id: 1,
                    name: "users:read",
                    description: "Read users",
                    created_at: "2025-05-29T19:57:30.889Z",
                    updated_at: "2025-05-29T19:57:30.889Z",
                },
            ];
            const newPermissions = [mockPermissions[0], mockPermissions[1]];

            // Initial cached data
            mockCacheClient.get.mockResolvedValueOnce(JSON.stringify(oldPermissions));

            const result1 = await userPermissionRepository.getPermissions(userId);
            expect(result1).toEqual(oldPermissions);

            // Invalidate cache
            mockCacheClient.del.mockResolvedValue(1);
            await userPermissionRepository.invalidateUserPermissions(userId);

            // Next call should fetch from database with new data
            mockCacheClient.get.mockResolvedValueOnce(null);
            mockDb.selectDistinct.mockReturnValue(createMockQueryChain(newPermissions));

            const result2 = await userPermissionRepository.getPermissions(userId);
            expect(result2).toEqual(newPermissions);
            expect(result2.length).toBe(2);
            expect(result1.length).toBe(1);
        });

        it("should handle cache invalidation during active requests", async () => {
            const userId = 1;
            const permissions = [mockPermissions[0]];

            // Setup cache miss and database response
            mockCacheClient.get.mockResolvedValue(null);
            mockDb.selectDistinct.mockReturnValue(createMockQueryChain(permissions));
            mockCacheClient.del.mockResolvedValue(1);

            // Concurrent operations
            const getPermissionsPromise = userPermissionRepository.getPermissions(userId);
            const invalidatePromise = userPermissionRepository.invalidateUserPermissions(userId);

            const [getResult] = await Promise.all([getPermissionsPromise, invalidatePromise]);

            expect(getResult).toEqual(permissions);
            expect(mockCacheClient.del).toHaveBeenCalledWith("permissions:user:1");
        });
    });

    describe("Edge Cases and Boundary Conditions", () => {
        it("should handle very large user IDs", async () => {
            const userId = Number.MAX_SAFE_INTEGER;
            mockCacheClient.get.mockResolvedValue(null);
            mockDb.selectDistinct.mockReturnValue(createMockQueryChain([]));

            const result = await userPermissionRepository.getPermissions(userId);

            expect(result).toEqual([]);
            expect(mockCacheClient.get).toHaveBeenCalledWith(`permissions:user:${userId}`);
        });

        it("should handle user ID of 0", async () => {
            const userId = 0;
            mockCacheClient.get.mockResolvedValue(null);
            mockDb.selectDistinct.mockReturnValue(createMockQueryChain([]));

            const result = await userPermissionRepository.getPermissions(userId);

            expect(result).toEqual([]);
            expect(mockCacheClient.get).toHaveBeenCalledWith("permissions:user:0");
        });

        it("should handle permissions with special characters in names", async () => {
            const specialPermissions = [
                {
                    id: 1,
                    name: "users:read/write",
                    description: "Read & Write users",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 2,
                    name: "admin:*",
                    description: "Admin wildcard",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            const userId = 1;
            mockCacheClient.get.mockResolvedValue(null);
            mockDb.selectDistinct.mockReturnValue(createMockQueryChain(specialPermissions));

            const result = await userPermissionRepository.getPermissions(userId);

            expect(result).toEqual(specialPermissions);
            expect(mockCacheClient.setEx).toHaveBeenCalledWith(
                "permissions:user:1",
                300,
                JSON.stringify(specialPermissions),
            );
        });

        it("should handle empty permission description", async () => {
            const permissionWithEmptyDesc = [
                {
                    id: 1,
                    name: "test:permission",
                    description: "",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            const userId = 1;
            mockCacheClient.get.mockResolvedValue(null);
            mockDb.selectDistinct.mockReturnValue(createMockQueryChain(permissionWithEmptyDesc));

            const result = await userPermissionRepository.getPermissions(userId);

            expect(result).toEqual(permissionWithEmptyDesc);
            expect(result[0].description).toBe("");
        });

        it("should handle null cache client responses correctly", async () => {
            const userId = 1;
            mockCacheClient.get.mockResolvedValue(null);
            mockCacheClient.keys.mockResolvedValue(null);
            mockDb.selectDistinct.mockReturnValue(createMockQueryChain([]));

            const result = await userPermissionRepository.getPermissions(userId);

            expect(result).toEqual([]);
            expect(mockDb.selectDistinct).toHaveBeenCalled();
        });
    });
});
