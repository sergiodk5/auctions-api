import "reflect-metadata";
import UserService from "@/services/user.service";
import { IUserRepository } from "@/repositories/UserRepository";
import { CreateUserDto, UpdateUserDto, User } from "@/types/user";

describe("UserService", () => {
    let mockRepo: jest.Mocked<IUserRepository>;
    let svc: UserService;

    beforeEach(() => {
        mockRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        svc = new UserService(mockRepo);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("getAllUsers", () => {
        it("returns array from repository", async () => {
            const users: User[] = [{ id: 1, email: "a@x.com" }];
            mockRepo.findAll.mockResolvedValue(users);

            await expect(svc.getAllUsers()).resolves.toBe(users);
            expect(mockRepo.findAll).toHaveBeenCalled();
        });
    });

    describe("getUserById", () => {
        it("returns user when found", async () => {
            const user: User = { id: 2, email: "b@x.com" };
            mockRepo.findById.mockResolvedValue(user);

            await expect(svc.getUserById(2)).resolves.toBe(user);
            expect(mockRepo.findById).toHaveBeenCalledWith(2);
        });

        it("throws when not found", async () => {
            mockRepo.findById.mockResolvedValue(undefined);

            await expect(svc.getUserById(42)).rejects.toThrow("UserNotFound");
            expect(mockRepo.findById).toHaveBeenCalledWith(42);
        });
    });

    describe("createUser", () => {
        const dto: CreateUserDto = { email: "c@x.com", password: "pwd" };

        it("throws if email exists", async () => {
            mockRepo.findByEmail.mockResolvedValue({ id: 3, email: dto.email } as any);

            await expect(svc.createUser(dto)).rejects.toThrow("UserExists");
            expect(mockRepo.findByEmail).toHaveBeenCalledWith(dto.email);
        });

        it("creates and returns new user", async () => {
            mockRepo.findByEmail.mockResolvedValue(undefined);
            const newUser: User = { id: 4, email: dto.email };
            mockRepo.create.mockResolvedValue(newUser);

            await expect(svc.createUser(dto)).resolves.toBe(newUser);
            expect(mockRepo.findByEmail).toHaveBeenCalledWith(dto.email);
            expect(mockRepo.create).toHaveBeenCalledWith(dto);
        });
    });

    describe("updateUser", () => {
        const update: UpdateUserDto = { email: "d@x.com" };

        it("throws when user not found", async () => {
            mockRepo.update.mockResolvedValue(undefined);

            await expect(svc.updateUser(5, update)).rejects.toThrow("UserNotFound");
            expect(mockRepo.update).toHaveBeenCalledWith(5, update);
        });

        it("updates and returns user", async () => {
            const updateDto: UpdateUserDto = { email: "d@x.com" };
            const updated: User = { id: 5, email: "d@x.com" };
            mockRepo.update.mockResolvedValue(updated);

            await expect(svc.updateUser(5, update)).resolves.toBe(updated);
            expect(mockRepo.update).toHaveBeenCalledWith(5, update);
        });
    });

    describe("deleteUser", () => {
        it("throws when user not found", async () => {
            mockRepo.delete.mockResolvedValue(false);

            await expect(svc.deleteUser(6)).rejects.toThrow("UserNotFound");
            expect(mockRepo.delete).toHaveBeenCalledWith(6);
        });

        it("resolves void when deleted", async () => {
            mockRepo.delete.mockResolvedValue(true);

            await expect(svc.deleteUser(6)).resolves.toBeUndefined();
            expect(mockRepo.delete).toHaveBeenCalledWith(6);
        });
    });
});
