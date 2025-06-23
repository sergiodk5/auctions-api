import PermissionController from "@/controllers/permission.controller";
import { ILoggerService } from "@/services/logger.service";
import { IPermissionService } from "@/services/permission.service";
import { Permission } from "@/types/permissions";
import { Request, Response } from "express";
import { createMockLoggerService } from "../../mocks/services/mock-logger.service";

describe("PermissionController", () => {
    let permissionController: PermissionController;
    let mockPermissionService: jest.Mocked<IPermissionService>;
    let mockLogger: jest.Mocked<ILoggerService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    const mockPermission: Permission = {
        id: 1,
        name: "test-permission",
        description: "Test permission description",
        created_at: new Date(),
        updated_at: new Date(),
    };

    beforeEach(() => {
        mockPermissionService = {
            getAllPermissions: jest.fn(),
            getPermissionById: jest.fn(),
            getPermissionByName: jest.fn(),
            createPermission: jest.fn(),
            updatePermission: jest.fn(),
            deletePermission: jest.fn(),
        };

        mockLogger = createMockLoggerService() as jest.Mocked<ILoggerService>;

        permissionController = new PermissionController(mockPermissionService, mockLogger);

        mockRequest = {
            params: {},
            body: {},
            query: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe("getAllPermissions", () => {
        it("should return all permissions successfully", async () => {
            const mockPermissions = [mockPermission];
            mockPermissionService.getAllPermissions.mockResolvedValue(mockPermissions);

            await permissionController.getAllPermissions(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.getAllPermissions).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: "Permissions retrieved successfully",
                data: mockPermissions,
            });
        });

        it("should handle service error", async () => {
            const error = new Error("Service error");
            mockPermissionService.getAllPermissions.mockRejectedValue(error);

            await permissionController.getAllPermissions(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.getAllPermissions).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Failed to retrieve permissions",
                error: "Service error",
            });
        });
    });

    describe("getPermissionById", () => {
        beforeEach(() => {
            mockRequest.params = { id: "1" };
        });

        it("should return permission by id successfully", async () => {
            mockPermissionService.getPermissionById.mockResolvedValue(mockPermission);

            await permissionController.getPermissionById(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.getPermissionById).toHaveBeenCalledWith(1);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: "Permission retrieved successfully",
                data: mockPermission,
            });
        });

        it("should handle permission not found", async () => {
            const error = new Error("PermissionNotFound");
            mockPermissionService.getPermissionById.mockRejectedValue(error);

            await permissionController.getPermissionById(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.getPermissionById).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Permission not found",
            });
        });

        it("should handle invalid id parameter", async () => {
            mockRequest.params = { id: "invalid" };

            await permissionController.getPermissionById(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.getPermissionById).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Invalid permission ID",
            });
        });
    });

    describe("createPermission", () => {
        beforeEach(() => {
            mockRequest.body = {
                name: "test-permission",
                description: "Test permission description",
            };
        });

        it("should create permission successfully", async () => {
            mockPermissionService.createPermission.mockResolvedValue(mockPermission);

            await permissionController.createPermission(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.createPermission).toHaveBeenCalledWith(mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: "Permission created successfully",
                data: mockPermission,
            });
        });

        it("should handle permission name already exists", async () => {
            const error = new Error("PermissionExists");
            mockPermissionService.createPermission.mockRejectedValue(error);

            await permissionController.createPermission(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.createPermission).toHaveBeenCalledWith(mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Permission with this name already exists",
            });
        });

        it("should handle service error", async () => {
            const error = new Error("Service error");
            mockPermissionService.createPermission.mockRejectedValue(error);

            await permissionController.createPermission(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.createPermission).toHaveBeenCalledWith(mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Failed to create permission",
                error: "Service error",
            });
        });
    });

    describe("updatePermission", () => {
        beforeEach(() => {
            mockRequest.params = { id: "1" };
            mockRequest.body = {
                name: "updated-permission",
                description: "Updated description",
            };
        });

        it("should update permission successfully", async () => {
            const updatedPermission = { ...mockPermission, name: "updated-permission" };
            mockPermissionService.updatePermission.mockResolvedValue(updatedPermission);

            await permissionController.updatePermission(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.updatePermission).toHaveBeenCalledWith(1, mockRequest.body);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: "Permission updated successfully",
                data: updatedPermission,
            });
        });

        it("should handle permission not found", async () => {
            const error = new Error("PermissionNotFound");
            mockPermissionService.updatePermission.mockRejectedValue(error);

            await permissionController.updatePermission(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.updatePermission).toHaveBeenCalledWith(1, mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Permission not found",
            });
        });

        it("should handle name already exists for different permission", async () => {
            const error = new Error("PermissionExists");
            mockPermissionService.updatePermission.mockRejectedValue(error);

            await permissionController.updatePermission(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.updatePermission).toHaveBeenCalledWith(1, mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Permission with this name already exists",
            });
        });

        it("should handle invalid id parameter", async () => {
            mockRequest.params = { id: "invalid" };

            await permissionController.updatePermission(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.updatePermission).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Invalid permission ID",
            });
        });
    });

    describe("deletePermission", () => {
        beforeEach(() => {
            mockRequest.params = { id: "1" };
        });

        it("should delete permission successfully", async () => {
            mockPermissionService.deletePermission.mockResolvedValue(undefined);

            await permissionController.deletePermission(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.deletePermission).toHaveBeenCalledWith(1);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: "Permission deleted successfully",
            });
        });

        it("should handle permission not found", async () => {
            const error = new Error("PermissionNotFound");
            mockPermissionService.deletePermission.mockRejectedValue(error);

            await permissionController.deletePermission(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.deletePermission).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Permission not found",
            });
        });

        it("should handle invalid id parameter", async () => {
            mockRequest.params = { id: "invalid" };

            await permissionController.deletePermission(mockRequest as Request, mockResponse as Response);

            expect(mockPermissionService.deletePermission).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Invalid permission ID",
            });
        });
    });
});
