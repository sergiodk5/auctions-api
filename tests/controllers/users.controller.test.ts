import "reflect-metadata";
import UsersController from "@/controllers/users.controller";
import { Request, Response } from "express-serve-static-core";
import { CreateUserDto, UpdateUserDto, User } from "@/types/user";

describe("UsersController", () => {
    let mockUserService: {
        getAllUsers: jest.Mock;
        getUserById: jest.Mock;
        createUser: jest.Mock;
        updateUser: jest.Mock;
        deleteUser: jest.Mock;
    };
    let controller: UsersController;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        mockUserService = {
            getAllUsers: jest.fn(),
            getUserById: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
        };
        controller = new UsersController(mockUserService as any);

        req = { params: {}, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
    });

    describe("getAllUsers", () => {
        it("returns 200 and list of users on success", async () => {
            const users: User[] = [{ id: 1, email: "a@x.com" }];
            mockUserService.getAllUsers.mockResolvedValue(users);

            await controller.getAllUsers(req as Request, res as Response);

            expect(mockUserService.getAllUsers).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: users });
        });

        it("returns 500 on service error", async () => {
            mockUserService.getAllUsers.mockRejectedValue(new Error("fail"));

            await controller.getAllUsers(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Failed to fetch users",
            });
        });
    });

    describe("getUserById", () => {
        it("returns 400 on invalid id", async () => {
            req.params = { id: "abc" };

            await controller.getUserById(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Invalid user ID",
            });
        });

        it("returns 200 and user on success", async () => {
            const user: User = { id: 2, email: "b@x.com" };
            req.params = { id: "2" };
            mockUserService.getUserById.mockResolvedValue(user);

            await controller.getUserById(req as Request, res as Response);

            expect(mockUserService.getUserById).toHaveBeenCalledWith(2);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: user });
        });

        it("returns 404 when user not found", async () => {
            req.params = { id: "3" };
            mockUserService.getUserById.mockRejectedValue(new Error("UserNotFound"));

            await controller.getUserById(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "User not found",
            });
        });
    });

    describe("createUser", () => {
        const dto: CreateUserDto = { email: "c@x.com", password: "pwd" };

        it("returns 201 and new user on success", async () => {
            const created: User = { id: 4, email: dto.email };
            req.body = { cleanBody: dto };
            mockUserService.createUser.mockResolvedValue(created);

            await controller.createUser(req as Request, res as Response);

            expect(mockUserService.createUser).toHaveBeenCalledWith(dto);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: created });
        });

        it("returns 409 when email already exists", async () => {
            req.body = { cleanBody: dto };
            mockUserService.createUser.mockRejectedValue(new Error("UserExists"));

            await controller.createUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Email already exists",
            });
        });

        it("returns 500 on other errors", async () => {
            req.body = { cleanBody: dto };
            mockUserService.createUser.mockRejectedValue(new Error("other"));

            await controller.createUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Failed to create user",
            });
        });
    });

    describe("updateUser", () => {
        // pull email out into its own const so TypeScript knows it's non-null
        const email = "d@x.com";
        const dto: UpdateUserDto = { email };

        it("returns 400 on invalid id", async () => {
            req.params = { id: "xyz" };
            req.body = { cleanBody: dto };

            await controller.updateUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Invalid user ID",
            });
        });

        it("returns 200 and updated user on success", async () => {
            const updated: User = { id: 5, email };
            req.params = { id: "5" };
            req.body = { cleanBody: dto };
            mockUserService.updateUser.mockResolvedValue(updated);

            await controller.updateUser(req as Request, res as Response);

            expect(mockUserService.updateUser).toHaveBeenCalledWith(5, dto);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
        });

        it("returns 404 when user not found", async () => {
            req.params = { id: "6" };
            req.body = { cleanBody: dto };
            mockUserService.updateUser.mockRejectedValue(new Error("UserNotFound"));

            await controller.updateUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "User not found",
            });
        });
    });

    describe("deleteUser", () => {
        it("returns 400 on invalid id", async () => {
            req.params = { id: "bad" };

            await controller.deleteUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Invalid user ID",
            });
        });

        it("returns 200 on successful deletion", async () => {
            req.params = { id: "7" };
            mockUserService.deleteUser.mockResolvedValue(undefined);

            await controller.deleteUser(req as Request, res as Response);

            expect(mockUserService.deleteUser).toHaveBeenCalledWith(7);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "User deleted successfully",
            });
        });

        it("returns 404 when user not found", async () => {
            req.params = { id: "8" };
            mockUserService.deleteUser.mockRejectedValue(new Error("UserNotFound"));

            await controller.deleteUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "User not found",
            });
        });
    });
});
