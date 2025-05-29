import PermissionService, { IPermissionService } from "@/services/permission.service";
import { IPermissionRepository } from "@/repositories/permission.repository";
import { Permission } from "@/types/permissions";
import "reflect-metadata";

describe("PermissionService", () => {
    let mockPermissionRepo: jest.Mocked<IPermissionRepository>;
    let permissionService: IPermissionService;

    beforeEach(() => {
        mockPermissionRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        permissionService = new PermissionService(mockPermissionRepo);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getAllPermissions", () => {
        it("should return all permissions", async () => {
            const permissions: Permission[] = [
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
            mockPermissionRepo.findAll.mockResolvedValue(permissions);

            const result = await permissionService.getAllPermissions();

            expect(mockPermissionRepo.findAll).toHaveBeenCalledWith();
            expect(result).toEqual(permissions);
        });
    });

    describe("getPermissionById", () => {
        it("should return permission when found", async () => {
            const permission: Permission = {
                id: 1,
                name: "users:read",
                description: "Read users",
                created_at: new Date(),
                updated_at: new Date(),
            };
            mockPermissionRepo.findById.mockResolvedValue(permission);

            const result = await permissionService.getPermissionById(1);

            expect(mockPermissionRepo.findById).toHaveBeenCalledWith(1);
            expect(result).toEqual(permission);
        });

        it("should throw error when permission not found", async () => {
            mockPermissionRepo.findById.mockResolvedValue(undefined);

            await expect(permissionService.getPermissionById(999)).rejects.toThrow("PermissionNotFound");

            expect(mockPermissionRepo.findById).toHaveBeenCalledWith(999);
        });
    });

    describe("getPermissionByName", () => {
        it("should return permission when found", async () => {
            const permission: Permission = {
                id: 1,
                name: "users:read",
                description: "Read users",
                created_at: new Date(),
                updated_at: new Date(),
            };
            mockPermissionRepo.findByName.mockResolvedValue(permission);

            const result = await permissionService.getPermissionByName("users:read");

            expect(mockPermissionRepo.findByName).toHaveBeenCalledWith("users:read");
            expect(result).toEqual(permission);
        });

        it("should throw error when permission not found", async () => {
            mockPermissionRepo.findByName.mockResolvedValue(undefined);

            await expect(permissionService.getPermissionByName("nonexistent")).rejects.toThrow("PermissionNotFound");

            expect(mockPermissionRepo.findByName).toHaveBeenCalledWith("nonexistent");
        });
    });

    describe("createPermission", () => {
        it("should create permission when name is unique", async () => {
            const createDto = {
                name: "users:delete",
                description: "Delete users",
            };
            const createdPermission: Permission = {
                id: 3,
                name: "users:delete",
                description: "Delete users",
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockPermissionRepo.findByName.mockResolvedValue(undefined); // No existing permission
            mockPermissionRepo.create.mockResolvedValue(createdPermission);

            const result = await permissionService.createPermission(createDto);

            expect(mockPermissionRepo.findByName).toHaveBeenCalledWith("users:delete");
            expect(mockPermissionRepo.create).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(createdPermission);
        });

        it("should throw error when permission already exists", async () => {
            const createDto = {
                name: "users:read",
                description: "Read users",
            };
            const existingPermission: Permission = {
                id: 1,
                name: "users:read",
                description: "Read users",
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockPermissionRepo.findByName.mockResolvedValue(existingPermission);

            await expect(permissionService.createPermission(createDto)).rejects.toThrow("PermissionExists");

            expect(mockPermissionRepo.findByName).toHaveBeenCalledWith("users:read");
            expect(mockPermissionRepo.create).not.toHaveBeenCalled();
        });
    });

    describe("updatePermission", () => {
        it("should update permission when found", async () => {
            const updateDto = {
                description: "Updated description",
            };
            const updatedPermission: Permission = {
                id: 1,
                name: "users:read",
                description: "Updated description",
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockPermissionRepo.update.mockResolvedValue(updatedPermission);

            const result = await permissionService.updatePermission(1, updateDto);

            expect(mockPermissionRepo.update).toHaveBeenCalledWith(1, updateDto);
            expect(result).toEqual(updatedPermission);
        });

        it("should throw error when permission not found", async () => {
            const updateDto = {
                description: "Updated description",
            };

            mockPermissionRepo.update.mockResolvedValue(undefined);

            await expect(permissionService.updatePermission(999, updateDto)).rejects.toThrow("PermissionNotFound");

            expect(mockPermissionRepo.update).toHaveBeenCalledWith(999, updateDto);
        });
    });

    describe("deletePermission", () => {
        it("should delete permission when found", async () => {
            mockPermissionRepo.delete.mockResolvedValue(true);

            await permissionService.deletePermission(1);

            expect(mockPermissionRepo.delete).toHaveBeenCalledWith(1);
        });

        it("should throw error when permission not found", async () => {
            mockPermissionRepo.delete.mockResolvedValue(false);

            await expect(permissionService.deletePermission(999)).rejects.toThrow("PermissionNotFound");

            expect(mockPermissionRepo.delete).toHaveBeenCalledWith(999);
        });
    });
});
