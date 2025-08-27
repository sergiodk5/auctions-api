import { TYPES } from "@/di/types";
import type { IUserRepository } from "@/repositories/user.repository";
import { CreateUserDto, UpdateUserDto, User } from "@/types/user";
import { inject, injectable } from "inversify";
import {
    validateUserDoesNotExist,
    validateUserExists,
    validateEmailUniqueForUpdate,
    validateCreateUserData,
    validateUpdateUserData,
} from "@/domain/user/validation";
import {
    prepareCreateUserData,
    prepareUpdateUserData,
    shouldCreateUser,
    shouldUpdateUser,
    shouldDeleteUser,
    canUpdateEmail,
} from "@/domain/user/business-rules";

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
        return validateUserExists(user, id);
    }

    async createUser(data: CreateUserDto): Promise<User> {
        // Validate input data
        validateCreateUserData(data);

        // Prepare data according to business rules
        const preparedData = prepareCreateUserData(data);

        // Check if user already exists
        const existing = await this.userRepo.findByEmail(preparedData.email);
        validateUserDoesNotExist(existing, preparedData.email);

        // Apply business rule
        if (!shouldCreateUser(existing, preparedData)) {
            throw new Error("UserExists");
        }

        return this.userRepo.create(preparedData);
    }

    async updateUser(id: number, data: UpdateUserDto): Promise<User> {
        // Validate input data
        validateUpdateUserData(data);

        // Prepare data according to business rules
        const preparedData = prepareUpdateUserData(data);

        // If email is being updated, check uniqueness
        if (preparedData.email) {
            const existingUserWithEmail = await this.userRepo.findByEmail(preparedData.email);
            
            // Only validate if there's actually a conflict
            if (existingUserWithEmail && existingUserWithEmail.id !== id) {
                validateEmailUniqueForUpdate(existingUserWithEmail, id, preparedData.email);
            }
        }

        const user = await this.userRepo.update(id, preparedData);
        return validateUserExists(user, id);
    }

    async deleteUser(id: number): Promise<void> {
        const deleted = await this.userRepo.delete(id);
        if (!deleted) throw new Error("UserNotFound");
    }
}
