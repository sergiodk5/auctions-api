import { IRoleRepository } from "@/repositories/role.repository";
import { IUserPermissionRepository } from "@/repositories/user-permission.repository";
import { IUserRoleRepository } from "@/repositories/user-role.repository";
import AuthorizationService, { IAuthorizationService } from "@/services/authorization.service";
import { Permission, Role } from "@/types/permissions";
import "reflect-metadata";

describe("AuthorizationService", () => {
    let mockUserPermissionRepo: jest.Mocked<IUserPermissionRepository>;
    let mockUserRoleRepo: jest.Mocked<IUserRoleRepository>;
    let mockRoleRepo: jest.Mocked<IRoleRepository>;
    let authorizationService: IAuthorizationService;

    const mockPermissions: Permission[] = [
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
        {
            id: 3,
            name: "admin:*",
            description: "Admin wildcard permission",
            created_at: new Date(),
            updated_at: new Date(),
        },
    ];

    const mockRoles: Role[] = [
        {
            id: 1,
            name: "user",
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: 2,
            name: "admin",
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: 3,
            name: "moderator",
            created_at: new Date(),
            updated_at: new Date(),
        },
    ];

    beforeEach(() => {
        mockUserPermissionRepo = {
            getPermissions: jest.fn(),
            invalidateUserPermissions: jest.fn(),
            invalidateAllUserPermissions: jest.fn(),
        };

        mockUserRoleRepo = {
            assignRoles: jest.fn(),
            removeRoles: jest.fn(),
            getRoles: jest.fn(),
        };

        mockRoleRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            findByIds: jest.fn(),
            findByIdWithPermissions: jest.fn(),
            findAllWithPermissions: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            assignPermission: jest.fn(),
            removePermission: jest.fn(),
            hasPermission: jest.fn(),
            setPermissions: jest.fn(),
            getPermissions: jest.fn(),
        };

        authorizationService = new AuthorizationService(mockUserPermissionRepo, mockUserRoleRepo, mockRoleRepo);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("hasPermission", () => {
        it("should return true when user has the specific permission", async () => {
            const userId = 1;
            const permissionName = "users:read";
            mockUserPermissionRepo.getPermissions.mockResolvedValue([mockPermissions[0]]);

            const result = await authorizationService.hasPermission(userId, permissionName);

            expect(mockUserPermissionRepo.getPermissions).toHaveBeenCalledWith(userId, undefined);
            expect(result).toBe(true);
        });

        it("should return false when user does not have the specific permission", async () => {
            const userId = 1;
            const permissionName = "users:delete";
            mockUserPermissionRepo.getPermissions.mockResolvedValue([mockPermissions[0]]);

            const result = await authorizationService.hasPermission(userId, permissionName);

            expect(mockUserPermissionRepo.getPermissions).toHaveBeenCalledWith(userId, undefined);
            expect(result).toBe(false);
        });

        it("should return false when user has no permissions", async () => {
            const userId = 1;
            const permissionName = "users:read";
            mockUserPermissionRepo.getPermissions.mockResolvedValue([]);

            const result = await authorizationService.hasPermission(userId, permissionName);

            expect(mockUserPermissionRepo.getPermissions).toHaveBeenCalledWith(userId, undefined);
            expect(result).toBe(false);
        });
    });

    describe("hasAnyPermission", () => {
        it("should return true when user has at least one of the specified permissions", async () => {
            const userId = 1;
            const permissionNames = ["users:read", "users:delete"];
            mockUserPermissionRepo.getPermissions.mockResolvedValue([mockPermissions[0]]);

            const result = await authorizationService.hasAnyPermission(userId, permissionNames);

            expect(mockUserPermissionRepo.getPermissions).toHaveBeenCalledWith(userId, undefined);
            expect(result).toBe(true);
        });

        it("should return false when user has none of the specified permissions", async () => {
            const userId = 1;
            const permissionNames = ["users:delete", "posts:read"];
            mockUserPermissionRepo.getPermissions.mockResolvedValue([mockPermissions[0]]);

            const result = await authorizationService.hasAnyPermission(userId, permissionNames);

            expect(mockUserPermissionRepo.getPermissions).toHaveBeenCalledWith(userId, undefined);
            expect(result).toBe(false);
        });

        it("should return false when permission names array is empty", async () => {
            const userId = 1;
            const permissionNames: string[] = [];
            mockUserPermissionRepo.getPermissions.mockResolvedValue([mockPermissions[0]]);

            const result = await authorizationService.hasAnyPermission(userId, permissionNames);

            expect(mockUserPermissionRepo.getPermissions).toHaveBeenCalledWith(userId, undefined);
            expect(result).toBe(false);
        });
    });

    describe("hasAllPermissions", () => {
        it("should return true when user has all specified permissions", async () => {
            const userId = 1;
            const permissionNames = ["users:read", "users:write"];
            mockUserPermissionRepo.getPermissions.mockResolvedValue([mockPermissions[0], mockPermissions[1]]);

            const result = await authorizationService.hasAllPermissions(userId, permissionNames);

            expect(mockUserPermissionRepo.getPermissions).toHaveBeenCalledWith(userId, undefined);
            expect(result).toBe(true);
        });

        it("should return false when user is missing some of the specified permissions", async () => {
            const userId = 1;
            const permissionNames = ["users:read", "users:delete"];
            mockUserPermissionRepo.getPermissions.mockResolvedValue([mockPermissions[0]]);

            const result = await authorizationService.hasAllPermissions(userId, permissionNames);

            expect(mockUserPermissionRepo.getPermissions).toHaveBeenCalledWith(userId, undefined);
            expect(result).toBe(false);
        });

        it("should return true when permission names array is empty", async () => {
            const userId = 1;
            const permissionNames: string[] = [];
            mockUserPermissionRepo.getPermissions.mockResolvedValue([mockPermissions[0]]);

            const result = await authorizationService.hasAllPermissions(userId, permissionNames);

            expect(mockUserPermissionRepo.getPermissions).toHaveBeenCalledWith(userId, undefined);
            expect(result).toBe(true);
        });
    });

    describe("hasRole", () => {
        it("should return true when user has the specific role", async () => {
            const userId = 1;
            const roleName = "admin";
            mockUserRoleRepo.getRoles.mockResolvedValue([mockRoles[1]]);

            const result = await authorizationService.hasRole(userId, roleName);

            expect(mockUserRoleRepo.getRoles).toHaveBeenCalledWith(userId);
            expect(result).toBe(true);
        });

        it("should return false when user does not have the specific role", async () => {
            const userId = 1;
            const roleName = "admin";
            mockUserRoleRepo.getRoles.mockResolvedValue([mockRoles[0]]);

            const result = await authorizationService.hasRole(userId, roleName);

            expect(mockUserRoleRepo.getRoles).toHaveBeenCalledWith(userId);
            expect(result).toBe(false);
        });

        it("should return false when user has no roles", async () => {
            const userId = 1;
            const roleName = "admin";
            mockUserRoleRepo.getRoles.mockResolvedValue([]);

            const result = await authorizationService.hasRole(userId, roleName);

            expect(mockUserRoleRepo.getRoles).toHaveBeenCalledWith(userId);
            expect(result).toBe(false);
        });
    });

    describe("hasAnyRole", () => {
        it("should return true when user has at least one of the specified roles", async () => {
            const userId = 1;
            const roleNames = ["admin", "moderator"];
            mockUserRoleRepo.getRoles.mockResolvedValue([mockRoles[0], mockRoles[1]]);

            const result = await authorizationService.hasAnyRole(userId, roleNames);

            expect(mockUserRoleRepo.getRoles).toHaveBeenCalledWith(userId);
            expect(result).toBe(true);
        });

        it("should return false when user has none of the specified roles", async () => {
            const userId = 1;
            const roleNames = ["admin", "moderator"];
            mockUserRoleRepo.getRoles.mockResolvedValue([mockRoles[0]]);

            const result = await authorizationService.hasAnyRole(userId, roleNames);

            expect(mockUserRoleRepo.getRoles).toHaveBeenCalledWith(userId);
            expect(result).toBe(false);
        });

        it("should return false when role names array is empty", async () => {
            const userId = 1;
            const roleNames: string[] = [];
            mockUserRoleRepo.getRoles.mockResolvedValue([mockRoles[0]]);

            const result = await authorizationService.hasAnyRole(userId, roleNames);

            expect(mockUserRoleRepo.getRoles).toHaveBeenCalledWith(userId);
            expect(result).toBe(false);
        });
    });

    describe("hasAllRoles", () => {
        it("should return true when user has all specified roles", async () => {
            const userId = 1;
            const roleNames = ["user", "admin"];
            mockUserRoleRepo.getRoles.mockResolvedValue([mockRoles[0], mockRoles[1]]);

            const result = await authorizationService.hasAllRoles(userId, roleNames);

            expect(mockUserRoleRepo.getRoles).toHaveBeenCalledWith(userId);
            expect(result).toBe(true);
        });

        it("should return false when user is missing some of the specified roles", async () => {
            const userId = 1;
            const roleNames = ["user", "admin"];
            mockUserRoleRepo.getRoles.mockResolvedValue([mockRoles[0]]);

            const result = await authorizationService.hasAllRoles(userId, roleNames);

            expect(mockUserRoleRepo.getRoles).toHaveBeenCalledWith(userId);
            expect(result).toBe(false);
        });

        it("should return true when role names array is empty", async () => {
            const userId = 1;
            const roleNames: string[] = [];
            mockUserRoleRepo.getRoles.mockResolvedValue([mockRoles[0]]);

            const result = await authorizationService.hasAllRoles(userId, roleNames);

            expect(mockUserRoleRepo.getRoles).toHaveBeenCalledWith(userId);
            expect(result).toBe(true);
        });
    });

    describe("getUserPermissions", () => {
        it("should return user permissions from repository", async () => {
            const userId = 1;
            const expectedPermissions = [mockPermissions[0], mockPermissions[1]];
            mockUserPermissionRepo.getPermissions.mockResolvedValue(expectedPermissions);

            const result = await authorizationService.getUserPermissions(userId);

            expect(mockUserPermissionRepo.getPermissions).toHaveBeenCalledWith(userId, undefined);
            expect(result).toEqual(expectedPermissions);
        });

        it("should pass cache options to repository", async () => {
            const userId = 1;
            const options = { useCache: false };
            const expectedPermissions = [mockPermissions[0]];
            mockUserPermissionRepo.getPermissions.mockResolvedValue(expectedPermissions);

            const result = await authorizationService.getUserPermissions(userId, options);

            expect(mockUserPermissionRepo.getPermissions).toHaveBeenCalledWith(userId, options);
            expect(result).toEqual(expectedPermissions);
        });
    });

    describe("getUserRoles", () => {
        it("should return user role names", async () => {
            const userId = 1;
            const expectedRoles = [mockRoles[0], mockRoles[1]];
            mockUserRoleRepo.getRoles.mockResolvedValue(expectedRoles);

            const result = await authorizationService.getUserRoles(userId);

            expect(mockUserRoleRepo.getRoles).toHaveBeenCalledWith(userId);
            expect(result).toEqual(["user", "admin"]);
        });

        it("should return empty array when user has no roles", async () => {
            const userId = 1;
            mockUserRoleRepo.getRoles.mockResolvedValue([]);

            const result = await authorizationService.getUserRoles(userId);

            expect(mockUserRoleRepo.getRoles).toHaveBeenCalledWith(userId);
            expect(result).toEqual([]);
        });
    });

    describe("can", () => {
        beforeEach(() => {
            // Reset mocks for each test in this describe block
            jest.clearAllMocks();
        });

        it("should return true when user has specific permission", async () => {
            const userId = 1;
            const action = "read";
            const resource = "users";
            mockUserPermissionRepo.getPermissions.mockResolvedValue([
                {
                    id: 1,
                    name: "read:users",
                    description: "Read users permission",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ]);

            const result = await authorizationService.can(userId, action, resource);

            expect(result).toBe(true);
        });

        it("should return true when user has wildcard permission", async () => {
            const userId = 1;
            const action = "read";
            const resource = "users";

            // First call for specific permission (read:users) - not found
            // Second call for wildcard permission (read:*) - found
            mockUserPermissionRepo.getPermissions
                .mockResolvedValueOnce([]) // No specific permission
                .mockResolvedValueOnce([
                    {
                        id: 1,
                        name: "read:*",
                        description: "Read wildcard permission",
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                ]);

            const result = await authorizationService.can(userId, action, resource);

            expect(result).toBe(true);
        });

        it("should return true when user has admin role", async () => {
            const userId = 1;
            const action = "delete";
            const resource = "users";

            // No specific permissions, no wildcard, but has admin role
            mockUserPermissionRepo.getPermissions
                .mockResolvedValueOnce([]) // No specific permission
                .mockResolvedValueOnce([]); // No wildcard permission

            mockUserRoleRepo.getRoles.mockResolvedValue([
                {
                    id: 2,
                    name: "admin",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ]);

            const result = await authorizationService.can(userId, action, resource);

            expect(result).toBe(true);
        });

        it("should work with action only (no resource)", async () => {
            const userId = 1;
            const action = "login";
            mockUserPermissionRepo.getPermissions.mockResolvedValue([
                {
                    id: 1,
                    name: "login",
                    description: "Login permission",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ]);

            const result = await authorizationService.can(userId, action);

            expect(result).toBe(true);
        });

        it("should return false when user has no relevant permissions or roles", async () => {
            const userId = 1;
            const action = "delete";
            const resource = "users";

            mockUserPermissionRepo.getPermissions
                .mockResolvedValueOnce([]) // No specific permission
                .mockResolvedValueOnce([]); // No wildcard permission

            mockUserRoleRepo.getRoles.mockResolvedValue([
                {
                    id: 1,
                    name: "user",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ]);

            const result = await authorizationService.can(userId, action, resource);

            expect(result).toBe(false);
        });
    });

    describe("invalidateUserCache", () => {
        it("should call repository invalidateUserPermissions method", async () => {
            const userId = 1;
            mockUserPermissionRepo.invalidateUserPermissions.mockResolvedValue();

            await authorizationService.invalidateUserCache(userId);

            expect(mockUserPermissionRepo.invalidateUserPermissions).toHaveBeenCalledWith(userId);
        });
    });

    describe("integration scenarios", () => {
        it("should handle complex authorization scenarios", async () => {
            const userId = 1;

            // Setup user with multiple permissions and roles
            const userPermissions = [
                {
                    id: 1,
                    name: "users:read",
                    description: "Read users",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 2,
                    name: "posts:*",
                    description: "All posts permissions",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            const userRoles = [
                {
                    id: 1,
                    name: "editor",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 2,
                    name: "moderator",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            mockUserPermissionRepo.getPermissions.mockResolvedValue(userPermissions);
            mockUserRoleRepo.getRoles.mockResolvedValue(userRoles);

            // Test multiple authorization checks
            expect(await authorizationService.hasPermission(userId, "users:read")).toBe(true);
            expect(await authorizationService.hasPermission(userId, "users:write")).toBe(false);
            expect(await authorizationService.hasAnyPermission(userId, ["users:read", "users:write"])).toBe(true);
            expect(await authorizationService.hasAllPermissions(userId, ["users:read", "posts:*"])).toBe(true);
            expect(await authorizationService.hasRole(userId, "editor")).toBe(true);
            expect(await authorizationService.hasRole(userId, "admin")).toBe(false);
            expect(await authorizationService.hasAnyRole(userId, ["admin", "moderator"])).toBe(true);
        });
    });
});
