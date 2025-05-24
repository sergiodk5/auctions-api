import { IUserRepository } from "@/repositories/user.repository";
import UserService from "@/services/user.service";
import { CreateUserDto, UpdateUserDto, User } from "@/types/user";
import "reflect-metadata";

describe("UserService", () => {
    let mockRepo: jest.Mocked<IUserRepository>;
    let userService: UserService;

    beforeEach(() => {
        mockRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            markEmailAsVerified: jest.fn(),
        };
        userService = new UserService(mockRepo);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getAllUsers", () => {
        it("should return all users from repository", async () => {
            const users: User[] = [
                { id: 1, email: "a@x.com", emailVerified: false },
                { id: 2, email: "b@y.com", emailVerified: true },
            ];
            mockRepo.findAll.mockResolvedValue(users);

            await expect(userService.getAllUsers()).resolves.toEqual(users);
            expect(mockRepo.findAll).toHaveBeenCalled();
        });

        it("should return empty array when no users", async () => {
            mockRepo.findAll.mockResolvedValue([]);

            await expect(userService.getAllUsers()).resolves.toEqual([]);
            expect(mockRepo.findAll).toHaveBeenCalled();
        });
    });

    describe("getUserById", () => {
        it("should return user when found", async () => {
            const user: User = { id: 2, email: "b@y.com", emailVerified: false };
            mockRepo.findById.mockResolvedValue(user);

            await expect(userService.getUserById(2)).resolves.toEqual(user);
            expect(mockRepo.findById).toHaveBeenCalledWith(2);
        });

        it("should throw UserNotFound when user not found", async () => {
            mockRepo.findById.mockResolvedValue(undefined);

            await expect(userService.getUserById(99)).rejects.toThrow("UserNotFound");
            expect(mockRepo.findById).toHaveBeenCalledWith(99);
        });

        it("should throw UserNotFound for invalid id", async () => {
            mockRepo.findById.mockResolvedValue(undefined);

            await expect(userService.getUserById(42)).rejects.toThrow("UserNotFound");
            expect(mockRepo.findById).toHaveBeenCalledWith(42);
        });
    });

    describe("createUser", () => {
        const dto: CreateUserDto = { email: "c@z.com", password: "pwd" };

        it("should create new user when email not taken", async () => {
            const newUser: User = { id: 3, email: "c@z.com", emailVerified: false };
            mockRepo.findByEmail.mockResolvedValue(undefined);
            mockRepo.create.mockResolvedValue(newUser);

            await expect(userService.createUser(dto)).resolves.toEqual(newUser);
            expect(mockRepo.findByEmail).toHaveBeenCalledWith("c@z.com");
            expect(mockRepo.create).toHaveBeenCalledWith(dto);
        });

        it("should throw UserExists when email already exists", async () => {
            mockRepo.findByEmail.mockResolvedValue({ id: 4, email: "c@z.com", emailVerified: false });

            await expect(userService.createUser(dto)).rejects.toThrow("UserExists");
            expect(mockRepo.findByEmail).toHaveBeenCalledWith("c@z.com");
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it("should throw UserExists for different email case", async () => {
            const existingUser: User = { id: 3, email: dto.email, emailVerified: false };
            mockRepo.findByEmail.mockResolvedValue(existingUser);

            await expect(userService.createUser(dto)).rejects.toThrow("UserExists");
            expect(mockRepo.findByEmail).toHaveBeenCalledWith(dto.email);
            expect(mockRepo.create).not.toHaveBeenCalled();
        });
    });

    describe("updateUser", () => {
        const updateData: UpdateUserDto = { email: "d@w.com" };

        it("should update and return user when exists", async () => {
            const updated: User = { id: 5, email: "d@w.com", emailVerified: false };
            mockRepo.update.mockResolvedValue(updated);

            await expect(userService.updateUser(5, updateData)).resolves.toEqual(updated);
            expect(mockRepo.update).toHaveBeenCalledWith(5, updateData);
        });

        it("should throw UserNotFound when user not found", async () => {
            mockRepo.update.mockResolvedValue(undefined);

            await expect(userService.updateUser(6, updateData)).rejects.toThrow("UserNotFound");
            expect(mockRepo.update).toHaveBeenCalledWith(6, updateData);
        });

        it("should throw UserNotFound for invalid id", async () => {
            mockRepo.update.mockResolvedValue(undefined);

            await expect(userService.updateUser(999, updateData)).rejects.toThrow("UserNotFound");
            expect(mockRepo.update).toHaveBeenCalledWith(999, updateData);
        });
    });

    describe("deleteUser", () => {
        it("should resolve when delete succeeds", async () => {
            mockRepo.delete.mockResolvedValue(true);

            await expect(userService.deleteUser(7)).resolves.toBeUndefined();
            expect(mockRepo.delete).toHaveBeenCalledWith(7);
        });

        it("should throw UserNotFound when user not found", async () => {
            mockRepo.delete.mockResolvedValue(false);

            await expect(userService.deleteUser(8)).rejects.toThrow("UserNotFound");
            expect(mockRepo.delete).toHaveBeenCalledWith(8);
        });

        it("should throw UserNotFound for invalid id", async () => {
            mockRepo.delete.mockResolvedValue(false);

            await expect(userService.deleteUser(999)).rejects.toThrow("UserNotFound");
            expect(mockRepo.delete).toHaveBeenCalledWith(999);
        });
    });
});
