import { IRoleRepository } from "@/repositories/role.repository";
import RoleService, { IRoleService } from "@/services/role.service";
import { AssignRolePermissionDto, CreateRoleDto, Permission, Role, UpdateRoleDto } from "@/types/permissions";

describe("RoleService", () => {
    let roleService: IRoleService;
    let mockRoleRepository: jest.Mocked<IRoleRepository>;

    const mockRole: Role = {
        id: 1,
        name: "test-role",
        created_at: new Date(),
        updated_at: new Date(),
    };

    const mockPermission: Permission = {
        id: 1,
        name: "test-permission",
        description: "Test permission description",
        created_at: new Date(),
        updated_at: new Date(),
    };

    beforeEach(() => {
        mockRoleRepository = {
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

        roleService = new RoleService(mockRoleRepository);
    });

    describe("createRole", () => {
        it("should create a role successfully", async () => {
            const createRoleData: CreateRoleDto = {
                name: "test-role",
            };

            mockRoleRepository.findByName.mockResolvedValue(undefined);
            mockRoleRepository.create.mockResolvedValue(mockRole);

            const result = await roleService.createRole(createRoleData);

            expect(mockRoleRepository.findByName).toHaveBeenCalledWith("test-role");
            expect(mockRoleRepository.create).toHaveBeenCalledWith(createRoleData);
            expect(result).toEqual(mockRole);
        });

        it("should throw error if role name already exists", async () => {
            const createRoleData: CreateRoleDto = {
                name: "test-role",
            };

            mockRoleRepository.findByName.mockResolvedValue(mockRole);

            await expect(roleService.createRole(createRoleData)).rejects.toThrow("RoleExists");

            expect(mockRoleRepository.findByName).toHaveBeenCalledWith("test-role");
            expect(mockRoleRepository.create).not.toHaveBeenCalled();
        });
    });

    describe("getRoleById", () => {
        it("should return role when found", async () => {
            mockRoleRepository.findById.mockResolvedValue(mockRole);

            const result = await roleService.getRoleById(1);

            expect(mockRoleRepository.findById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockRole);
        });

        it("should throw error when role not found", async () => {
            mockRoleRepository.findById.mockResolvedValue(undefined);

            await expect(roleService.getRoleById(1)).rejects.toThrow("RoleNotFound");

            expect(mockRoleRepository.findById).toHaveBeenCalledWith(1);
        });
    });

    describe("getAllRoles", () => {
        it("should return all roles", async () => {
            const mockRoles = [mockRole];
            mockRoleRepository.findAll.mockResolvedValue(mockRoles);

            const result = await roleService.getAllRoles();

            expect(mockRoleRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockRoles);
        });
    });

    describe("updateRole", () => {
        it("should update role successfully", async () => {
            const updateData: UpdateRoleDto = {
                name: "updated-role",
            };
            const updatedRole = { ...mockRole, ...updateData };

            mockRoleRepository.findById.mockResolvedValue(mockRole);
            mockRoleRepository.findByName.mockResolvedValue(undefined);
            mockRoleRepository.update.mockResolvedValue(updatedRole);

            const result = await roleService.updateRole(1, updateData);

            expect(mockRoleRepository.findById).toHaveBeenCalledWith(1);
            expect(mockRoleRepository.findByName).toHaveBeenCalledWith("updated-role");
            expect(mockRoleRepository.update).toHaveBeenCalledWith(1, updateData);
            expect(result).toEqual(updatedRole);
        });

        it("should throw error if role not found", async () => {
            mockRoleRepository.findById.mockResolvedValue(undefined);

            await expect(roleService.updateRole(1, { name: "updated-role" })).rejects.toThrow("RoleNotFound");

            expect(mockRoleRepository.findById).toHaveBeenCalledWith(1);
            expect(mockRoleRepository.update).not.toHaveBeenCalled();
        });

        it("should throw error if new name already exists", async () => {
            const anotherRole = { ...mockRole, id: 2, name: "existing-role" };

            mockRoleRepository.findById.mockResolvedValue(mockRole);
            mockRoleRepository.findByName.mockResolvedValue(anotherRole);

            await expect(roleService.updateRole(1, { name: "existing-role" })).rejects.toThrow("RoleExists");

            expect(mockRoleRepository.findById).toHaveBeenCalledWith(1);
            expect(mockRoleRepository.findByName).toHaveBeenCalledWith("existing-role");
            expect(mockRoleRepository.update).not.toHaveBeenCalled();
        });
    });

    describe("deleteRole", () => {
        it("should delete role successfully", async () => {
            mockRoleRepository.delete.mockResolvedValue(true);

            await roleService.deleteRole(1);

            expect(mockRoleRepository.delete).toHaveBeenCalledWith(1);
        });

        it("should throw error if role not found", async () => {
            mockRoleRepository.delete.mockResolvedValue(false);

            await expect(roleService.deleteRole(1)).rejects.toThrow("RoleNotFound");

            expect(mockRoleRepository.delete).toHaveBeenCalledWith(1);
        });
    });

    describe("assignPermissionToRole", () => {
        it("should assign permission to role successfully", async () => {
            const assignData: AssignRolePermissionDto = {
                role_id: 1,
                permission_id: 1,
            };

            mockRoleRepository.findById.mockResolvedValue(mockRole);
            mockRoleRepository.assignPermission.mockResolvedValue(undefined);

            await roleService.assignPermissionToRole(assignData);

            expect(mockRoleRepository.findById).toHaveBeenCalledWith(1);
            expect(mockRoleRepository.assignPermission).toHaveBeenCalledWith(assignData);
        });

        it("should throw error if role not found", async () => {
            const assignData: AssignRolePermissionDto = {
                role_id: 1,
                permission_id: 1,
            };

            mockRoleRepository.findById.mockResolvedValue(undefined);

            await expect(roleService.assignPermissionToRole(assignData)).rejects.toThrow("RoleNotFound");

            expect(mockRoleRepository.findById).toHaveBeenCalledWith(1);
            expect(mockRoleRepository.assignPermission).not.toHaveBeenCalled();
        });
    });

    describe("removePermissionFromRole", () => {
        it("should remove permission from role successfully", async () => {
            mockRoleRepository.removePermission.mockResolvedValue(true);

            await roleService.removePermissionFromRole(1, 1);

            expect(mockRoleRepository.removePermission).toHaveBeenCalledWith(1, 1);
        });

        it("should throw error if permission removal fails", async () => {
            mockRoleRepository.removePermission.mockResolvedValue(false);

            await expect(roleService.removePermissionFromRole(1, 1)).rejects.toThrow("RolePermissionNotFound");

            expect(mockRoleRepository.removePermission).toHaveBeenCalledWith(1, 1);
        });
    });
});
