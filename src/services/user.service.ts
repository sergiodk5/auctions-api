import { TYPES } from "@/di/types";
import type { IUserRepository } from "@/repositories/user.repository";
import { CreateUserDto, UpdateUserDto, User } from "@/types/user";
import { inject, injectable } from "inversify";

export interface IUserService {
    getAllUsers(): Promise<User[]>;
    getUserById(id: number): Promise<User>;
    createUser(data: CreateUserDto): Promise<User>;
    updateUser(id: number, data: UpdateUserDto): Promise<User>;
    deleteUser(id: number): Promise<void>;
}

@injectable()
export default class UserService implements IUserService {
    constructor(@inject(TYPES.IUserRepository) private readonly userRepo: IUserRepository) {}

    async getAllUsers(): Promise<User[]> {
        return this.userRepo.findAll();
    }

    async getUserById(id: number): Promise<User> {
        const user = await this.userRepo.findById(id);
        if (!user) throw new Error("UserNotFound");
        return user;
    }

    async createUser(data: CreateUserDto): Promise<User> {
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) throw new Error("UserExists");
        return this.userRepo.create(data);
    }

    async updateUser(id: number, data: UpdateUserDto): Promise<User> {
        const user = await this.userRepo.update(id, data);
        if (!user) throw new Error("UserNotFound");
        return user;
    }

    async deleteUser(id: number): Promise<void> {
        const deleted = await this.userRepo.delete(id);
        if (!deleted) throw new Error("UserNotFound");
    }
}
