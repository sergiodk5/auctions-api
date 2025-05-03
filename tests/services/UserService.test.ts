import UserService from "@/services/user.service";
import { IUserRepository } from "@/repositories/UserRepository";
import { CreateUserDto, UpdateUserDto, User } from "@/types/user";

describe("UserService Unit Tests", () => {
    const mockRepo: jest.Mocked<IUserRepository> = {
        findAll: jest.fn(),
        findById: jest.fn(),
        findByEmail: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };
    const userService = new UserService(mockRepo);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getAllUsers", () => {
        it("should return all users", async () => {
            const users: User[] = [{ id: 1, email: "a@x.com" }];
            mockRepo.findAll.mockResolvedValue(users);
            await expect(userService.getAllUsers()).resolves.toEqual(users);
            expect(mockRepo.findAll).toHaveBeenCalled();
        });
    });

    describe("getUserById", () => {
        it("should return user when found", async () => {
            const user: User = { id: 2, email: "b@y.com" };
            mockRepo.findById.mockResolvedValue(user);
            await expect(userService.getUserById(2)).resolves.toEqual(user);
            expect(mockRepo.findById).toHaveBeenCalledWith(2);
        });

        it("should throw when user not found", async () => {
            mockRepo.findById.mockResolvedValue(undefined);
            await expect(userService.getUserById(99)).rejects.toThrow("UserNotFound");
            expect(mockRepo.findById).toHaveBeenCalledWith(99);
        });
    });

    describe("createUser", () => {
        const dto: CreateUserDto = { email: "c@z.com", password: "pwd" };
        it("should create new user when email not taken", async () => {
            const newUser: User = { id: 3, email: "c@z.com" };
            mockRepo.findByEmail.mockResolvedValue(undefined);
            mockRepo.create.mockResolvedValue(newUser);
            await expect(userService.createUser(dto)).resolves.toEqual(newUser);
            expect(mockRepo.findByEmail).toHaveBeenCalledWith("c@z.com");
            expect(mockRepo.create).toHaveBeenCalledWith(dto);
        });

        it("should throw when email already exists", async () => {
            mockRepo.findByEmail.mockResolvedValue({ id: 4, email: "c@z.com" });
            await expect(userService.createUser(dto)).rejects.toThrow("UserExists");
            expect(mockRepo.findByEmail).toHaveBeenCalledWith("c@z.com");
            expect(mockRepo.create).not.toHaveBeenCalled();
        });
    });

    describe("updateUser", () => {
        const data: UpdateUserDto = { email: "d@w.com" };
        it("should update and return user when exists", async () => {
            const updated: User = { id: 5, email: "d@w.com" };
            mockRepo.update.mockResolvedValue(updated);
            await expect(userService.updateUser(5, data)).resolves.toEqual(updated);
            expect(mockRepo.update).toHaveBeenCalledWith(5, data);
        });

        it("should throw when user not found", async () => {
            mockRepo.update.mockResolvedValue(undefined);
            await expect(userService.updateUser(6, data)).rejects.toThrow("UserNotFound");
            expect(mockRepo.update).toHaveBeenCalledWith(6, data);
        });
    });

    describe("deleteUser", () => {
        it("should resolve when delete succeeds", async () => {
            mockRepo.delete.mockResolvedValue(true);
            await expect(userService.deleteUser(7)).resolves.toBeUndefined();
            expect(mockRepo.delete).toHaveBeenCalledWith(7);
        });

        it("should throw when user not found", async () => {
            mockRepo.delete.mockResolvedValue(false);
            await expect(userService.deleteUser(8)).rejects.toThrow("UserNotFound");
            expect(mockRepo.delete).toHaveBeenCalledWith(8);
        });
    });
});
