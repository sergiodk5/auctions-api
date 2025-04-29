import { IUserRepository } from "@/repositories/IUserRepository";
import { CreateUserDto, UpdateUserDto, User } from "@/types/user";

export class UserService {
    constructor(private userRepo: IUserRepository) {}

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
