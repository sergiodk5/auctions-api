import AuthorizationMiddleware, { IAuthorizationMiddleware } from "@/middlewares/authorization.middleware";
import { IAuthorizationService } from "@/services/authorization.service";
import { NextFunction, Request, Response } from "express";
import "reflect-metadata";
import { createMockLoggerService } from "../../mocks/services/mock-logger.service";

describe("AuthorizationMiddleware", () => {
    let mockAuthService: jest.Mocked<IAuthorizationService>;
    let mockLogger: any;
    let authorizationMiddleware: IAuthorizationMiddleware;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        // Mock the authorization service
        mockAuthService = {
            hasPermission: jest.fn(),
            hasAnyPermission: jest.fn(),
            hasAllPermissions: jest.fn(),
            hasRole: jest.fn(),
            hasAnyRole: jest.fn(),
            hasAllRoles: jest.fn(),
            can: jest.fn(),
            getUserPermissions: jest.fn(),
            getUserRoles: jest.fn(),
            invalidateUserCache: jest.fn(),
        };

        // Mock the logger service
        mockLogger = createMockLoggerService();

        // Create the middleware instance
        authorizationMiddleware = new AuthorizationMiddleware(mockAuthService, mockLogger);

        // Mock Express request, response, and next
        mockRequest = {
            body: {
                user: { id: 1, jti: "test-jti" },
            },
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("requirePermissions", () => {
        it("should call next() when user has required permission", async () => {
            // Arrange
            mockAuthService.hasAnyPermission.mockResolvedValue(true);
            const middleware = authorizationMiddleware.requirePermissions(["user:read"]);

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockAuthService.hasAnyPermission).toHaveBeenCalledWith(1, ["user:read"]);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it("should return 403 when user lacks required permission", async () => {
            // Arrange
            mockAuthService.hasAnyPermission.mockResolvedValue(false);
            const middleware = authorizationMiddleware.requirePermissions(["user:create"]);

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockAuthService.hasAnyPermission).toHaveBeenCalledWith(1, ["user:create"]);
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                data: null,
                message: "Insufficient permissions",
            });
        });

        it("should return 401 when user is not authenticated", async () => {
            // Arrange
            mockRequest.body = {}; // No user in body
            const middleware = authorizationMiddleware.requirePermissions(["user:read"]);

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockAuthService.hasAnyPermission).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                data: null,
                message: "Authentication required",
            });
        });

        it("should check all permissions when requireAll is true", async () => {
            // Arrange
            mockAuthService.hasAllPermissions.mockResolvedValue(false);
            const middleware = authorizationMiddleware.requirePermissions(["user:read", "user:update"], true);

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockAuthService.hasAllPermissions).toHaveBeenCalledWith(1, ["user:read", "user:update"]);
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });

        it("should pass when user has any required permission (requireAll is false)", async () => {
            // Arrange
            mockAuthService.hasAnyPermission.mockResolvedValue(true);
            const middleware = authorizationMiddleware.requirePermissions(["user:create", "user:read"], false);

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockAuthService.hasAnyPermission).toHaveBeenCalledWith(1, ["user:create", "user:read"]);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });

    describe("requireRoles", () => {
        it("should call next() when user has required role", async () => {
            // Arrange
            mockAuthService.hasAnyRole.mockResolvedValue(true);
            const middleware = authorizationMiddleware.requireRoles(["admin"]);

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockAuthService.hasAnyRole).toHaveBeenCalledWith(1, ["admin"]);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it("should return 403 when user lacks required role", async () => {
            // Arrange
            mockAuthService.hasAnyRole.mockResolvedValue(false);
            const middleware = authorizationMiddleware.requireRoles(["admin"]);

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockAuthService.hasAnyRole).toHaveBeenCalledWith(1, ["admin"]);
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                data: null,
                message: "Insufficient role privileges",
            });
        });
    });

    describe("requireAction", () => {
        it("should call next() when user can perform action", async () => {
            // Arrange
            mockAuthService.can.mockResolvedValue(true);
            const middleware = authorizationMiddleware.requireAction("read", "user");

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockAuthService.can).toHaveBeenCalledWith(1, "read", "user");
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it("should return 403 when user cannot perform action", async () => {
            // Arrange
            mockAuthService.can.mockResolvedValue(false);
            const middleware = authorizationMiddleware.requireAction("delete", "user");

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockAuthService.can).toHaveBeenCalledWith(1, "delete", "user");
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                data: null,
                message: "Not authorized to delete user",
            });
        });
    });

    describe("createWithOptions", () => {
        it("should pass when user meets all requirements", async () => {
            // Arrange
            mockAuthService.can.mockResolvedValue(true);

            const middleware = authorizationMiddleware.createWithOptions({
                permissions: ["user:read"],
                roles: ["admin"],
                action: "read",
                resource: "user",
                requireAll: true,
            });

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            // When action is specified, it takes priority over permissions and roles
            expect(mockAuthService.can).toHaveBeenCalledWith(1, "read", "user");
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it("should fail when user lacks permissions", async () => {
            // Arrange
            mockAuthService.hasAllPermissions.mockResolvedValue(false);

            const middleware = authorizationMiddleware.createWithOptions({
                permissions: ["user:delete"],
                requireAll: true,
            });

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockAuthService.hasAllPermissions).toHaveBeenCalledWith(1, ["user:delete"]);
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                data: null,
                message: "Access denied",
            });
        });

        it("should check all permissions when requireAll is true", async () => {
            // Arrange
            mockAuthService.hasAllPermissions.mockResolvedValue(true);

            const middleware = authorizationMiddleware.createWithOptions({
                permissions: ["user:read", "user:update"],
                requireAll: true,
            });

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockAuthService.hasAllPermissions).toHaveBeenCalledWith(1, ["user:read", "user:update"]);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it("should handle errors gracefully", async () => {
            // Arrange
            const error = new Error("Database connection failed");
            mockAuthService.hasAnyPermission.mockRejectedValue(error);

            const middleware = authorizationMiddleware.createWithOptions({
                permissions: ["user:read"],
            });

            // Act
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                data: null,
                message: "Authorization check failed",
            });
        });
    });

    describe("handle method", () => {
        it("should return 403 for basic handle method", () => {
            // Act
            void authorizationMiddleware.handle(mockRequest as Request, mockResponse as Response, mockNext);

            // Assert
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                data: null,
                message: "Authorization method not specified",
            });
        });
    });
});
