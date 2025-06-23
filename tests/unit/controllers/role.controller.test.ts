import RoleController from "@/controllers/role.controller";
import { ILoggerService } from "@/services/logger.service";
import { IRoleService } from "@/services/role.service";
import { CreateRoleDto, Role, RoleWithPermissions, UpdateRoleDto } from "@/types/permissions";
import { Request, Response } from "express";
import { createMockLoggerService } from "../../mocks/services/mock-logger.service";

describe("RoleController", () => {
    let roleController: RoleController;
    let mockRoleService: jest.Mocked<IRoleService>;
    let mockLogger: jest.Mocked<ILoggerService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let statusSpy: jest.SpyInstance;
    let jsonSpy: jest.SpyInstance;

    const mockRole: Role = {
        id: 1,
        name: "test-role",
        created_at: new Date(),
        updated_at: new Date(),
    };

    const mockRoleWithPermissions: RoleWithPermissions = {
        ...mockRole,
        permissions: [
            { id: 1, name: "read_users", description: "Read users", created_at: new Date(), updated_at: new Date() },
        ],
    };

    beforeEach(() => {
        mockRoleService = {
            getAllRoles: jest.fn(),
            getAllRolesWithPermissions: jest.fn(),
            getRoleById: jest.fn(),
            getRoleByIdWithPermissions: jest.fn(),
            getRoleByName: jest.fn(),
            createRole: jest.fn(),
            updateRole: jest.fn(),
            deleteRole: jest.fn(),
            assignPermissionToRole: jest.fn(),
            removePermissionFromRole: jest.fn(),
            setRolePermissions: jest.fn(),
        };

        mockLogger = createMockLoggerService() as jest.Mocked<ILoggerService>;

        roleController = new RoleController(mockRoleService, mockLogger);

        mockRequest = {
            params: {},
            body: {},
            query: {},
        };

        statusSpy = jest.fn().mockReturnThis();
        jsonSpy = jest.fn().mockReturnThis();
        mockResponse = {
            status: statusSpy as any,
            json: jsonSpy as any,
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getAllRoles", () => {
        it("should return all roles successfully without permissions", async () => {
            const mockRoles = [mockRole];
            mockRoleService.getAllRoles.mockResolvedValue(mockRoles);

            await roleController.getAllRoles(mockRequest as Request, mockResponse as Response);

            expect(mockRoleService.getAllRoles).toHaveBeenCalled();
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                message: "Roles retrieved successfully",
                data: mockRoles,
            });
        });

        it("should return all roles with permissions when query param is set", async () => {
            const mockRoles = [mockRoleWithPermissions];
            mockRequest.query = { include_permissions: "true" };
            mockRoleService.getAllRolesWithPermissions.mockResolvedValue(mockRoles);

            await roleController.getAllRoles(mockRequest as Request, mockResponse as Response);

            expect(mockRoleService.getAllRolesWithPermissions).toHaveBeenCalled();
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                message: "Roles retrieved successfully",
                data: mockRoles,
            });
        });

        it("should handle service error", async () => {
            const error = new Error("Service error");
            mockRoleService.getAllRoles.mockRejectedValue(error);

            await roleController.getAllRoles(mockRequest as Request, mockResponse as Response);

            expect(mockRoleService.getAllRoles).toHaveBeenCalled();
            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Failed to retrieve roles",
                error: "Service error",
            });
        });
    });

    describe("getRoleById", () => {
        beforeEach(() => {
            mockRequest.params = { id: "1" };
        });

        it("should return role by id successfully", async () => {
            mockRoleService.getRoleById.mockResolvedValue(mockRole);

            await roleController.getRoleById(mockRequest as Request, mockResponse as Response);

            expect(mockRoleService.getRoleById).toHaveBeenCalledWith(1);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                message: "Role retrieved successfully",
                data: mockRole,
            });
        });

        it("should return role with permissions when query param is set", async () => {
            mockRequest.query = { include_permissions: "true" };
            mockRoleService.getRoleByIdWithPermissions.mockResolvedValue(mockRoleWithPermissions);

            await roleController.getRoleById(mockRequest as Request, mockResponse as Response);

            expect(mockRoleService.getRoleByIdWithPermissions).toHaveBeenCalledWith(1);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                message: "Role retrieved successfully",
                data: mockRoleWithPermissions,
            });
        });

        it("should handle invalid id parameter", async () => {
            mockRequest.params = { id: "invalid" };

            await roleController.getRoleById(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Invalid role ID",
            });
        });

        it("should handle role not found error", async () => {
            const error = new Error("RoleNotFound");
            mockRoleService.getRoleById.mockRejectedValue(error);

            await roleController.getRoleById(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Role not found",
            });
        });

        it("should handle general service error", async () => {
            const error = new Error("Database error");
            mockRoleService.getRoleById.mockRejectedValue(error);

            await roleController.getRoleById(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Failed to retrieve role",
                error: "Database error",
            });
        });
    });

    describe("createRole", () => {
        const createRoleDto: CreateRoleDto = {
            name: "new-role",
        };

        beforeEach(() => {
            mockRequest.body = createRoleDto;
        });

        it("should create role successfully", async () => {
            const createdRole = { ...mockRole, name: "new-role" };
            mockRoleService.createRole.mockResolvedValue(createdRole);

            await roleController.createRole(mockRequest as Request, mockResponse as Response);

            expect(mockRoleService.createRole).toHaveBeenCalledWith(createRoleDto);
            expect(statusSpy).toHaveBeenCalledWith(201);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                message: "Role created successfully",
                data: createdRole,
            });
        });

        it("should handle role already exists error", async () => {
            const error = new Error("RoleExists");
            mockRoleService.createRole.mockRejectedValue(error);

            await roleController.createRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(409);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Role with this name already exists",
            });
        });

        it("should handle general service error", async () => {
            const error = new Error("Database error");
            mockRoleService.createRole.mockRejectedValue(error);

            await roleController.createRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Failed to create role",
                error: "Database error",
            });
        });
    });

    describe("updateRole", () => {
        const updateRoleDto: UpdateRoleDto = {
            name: "updated-role",
        };

        beforeEach(() => {
            mockRequest.params = { id: "1" };
            mockRequest.body = updateRoleDto;
        });

        it("should update role successfully", async () => {
            const updatedRole = { ...mockRole, ...updateRoleDto };
            mockRoleService.updateRole.mockResolvedValue(updatedRole);

            await roleController.updateRole(mockRequest as Request, mockResponse as Response);

            expect(mockRoleService.updateRole).toHaveBeenCalledWith(1, updateRoleDto);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                message: "Role updated successfully",
                data: updatedRole,
            });
        });

        it("should handle invalid id parameter", async () => {
            mockRequest.params = { id: "invalid" };

            await roleController.updateRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Invalid role ID",
            });
        });

        it("should handle role not found error", async () => {
            const error = new Error("RoleNotFound");
            mockRoleService.updateRole.mockRejectedValue(error);

            await roleController.updateRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Role not found",
            });
        });

        it("should handle role already exists error", async () => {
            const error = new Error("RoleExists");
            mockRoleService.updateRole.mockRejectedValue(error);

            await roleController.updateRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(409);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Role with this name already exists",
            });
        });

        it("should handle general service error", async () => {
            const error = new Error("Database error");
            mockRoleService.updateRole.mockRejectedValue(error);

            await roleController.updateRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Failed to update role",
                error: "Database error",
            });
        });
    });

    describe("deleteRole", () => {
        beforeEach(() => {
            mockRequest.params = { id: "1" };
        });

        it("should delete role successfully", async () => {
            mockRoleService.deleteRole.mockResolvedValue();

            await roleController.deleteRole(mockRequest as Request, mockResponse as Response);

            expect(mockRoleService.deleteRole).toHaveBeenCalledWith(1);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                message: "Role deleted successfully",
            });
        });

        it("should handle invalid id parameter", async () => {
            mockRequest.params = { id: "invalid" };

            await roleController.deleteRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Invalid role ID",
            });
        });

        it("should handle role not found error", async () => {
            const error = new Error("RoleNotFound");
            mockRoleService.deleteRole.mockRejectedValue(error);

            await roleController.deleteRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Role not found",
            });
        });

        it("should handle general service error", async () => {
            const error = new Error("Database error");
            mockRoleService.deleteRole.mockRejectedValue(error);

            await roleController.deleteRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Failed to delete role",
                error: "Database error",
            });
        });
    });

    describe("assignPermissionToRole", () => {
        beforeEach(() => {
            mockRequest.params = { id: "1" };
            mockRequest.body = { permission_id: "1" };
        });

        it("should assign permission to role successfully", async () => {
            mockRoleService.assignPermissionToRole.mockResolvedValue();

            await roleController.assignPermissionToRole(mockRequest as Request, mockResponse as Response);

            expect(mockRoleService.assignPermissionToRole).toHaveBeenCalledWith({
                role_id: 1,
                permission_id: 1,
            });
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                message: "Permission assigned to role successfully",
            });
        });

        it("should handle invalid role id", async () => {
            mockRequest.params = { id: "invalid" };

            await roleController.assignPermissionToRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Invalid role ID or permission ID",
            });
        });

        it("should handle missing permission id", async () => {
            mockRequest.body = {};

            await roleController.assignPermissionToRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Invalid role ID or permission ID",
            });
        });

        it("should handle service error", async () => {
            const error = new Error("Role or permission not found");
            mockRoleService.assignPermissionToRole.mockRejectedValue(error);

            await roleController.assignPermissionToRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Failed to assign permission to role",
                error: "Role or permission not found",
            });
        });

        it("should handle role not found error", async () => {
            const error = new Error("RoleNotFound");
            mockRoleService.assignPermissionToRole.mockRejectedValue(error);

            await roleController.assignPermissionToRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Role not found",
            });
        });
    });

    describe("removePermissionFromRole", () => {
        beforeEach(() => {
            mockRequest.params = { id: "1", permissionId: "1" };
        });

        it("should remove permission from role successfully", async () => {
            mockRoleService.removePermissionFromRole.mockResolvedValue();

            await roleController.removePermissionFromRole(mockRequest as Request, mockResponse as Response);

            expect(mockRoleService.removePermissionFromRole).toHaveBeenCalledWith(1, 1);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                message: "Permission removed from role successfully",
            });
        });

        it("should handle invalid role id", async () => {
            mockRequest.params = { id: "invalid", permissionId: "1" };

            await roleController.removePermissionFromRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Invalid role ID or permission ID",
            });
        });

        it("should handle invalid permission id", async () => {
            mockRequest.params = { id: "1", permissionId: "invalid" };

            await roleController.removePermissionFromRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Invalid role ID or permission ID",
            });
        });

        it("should handle role permission not found error", async () => {
            const error = new Error("RolePermissionNotFound");
            mockRoleService.removePermissionFromRole.mockRejectedValue(error);

            await roleController.removePermissionFromRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(404);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Role permission association not found",
            });
        });

        it("should handle general service error", async () => {
            const error = new Error("Database error");
            mockRoleService.removePermissionFromRole.mockRejectedValue(error);

            await roleController.removePermissionFromRole(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: false,
                message: "Failed to remove permission from role",
                error: "Database error",
            });
        });
    });
});
