/**
 * User domain validation rules
 * Pure functions for user-related validation logic
 */

import { CreateUserDto, UpdateUserDto, User } from "@/types/user";

/**
 * Validates if a user already exists with the given email
 */
export function validateUserDoesNotExist(existingUser: User | undefined, email: string): void {
    if (existingUser) {
        throw new Error("UserExists");
    }
}

/**
 * Validates if a user exists by ID
 */
export function validateUserExists(user: User | undefined, userId?: number): User {
    if (!user) {
        throw new Error("UserNotFound");
    }
    return user;
}

/**
 * Validates email uniqueness for user updates
 * Throws error if email is taken by another user
 */
export function validateEmailUniqueForUpdate(
    existingUser: User | undefined,
    currentUserId: number,
    newEmail: string,
): void {
    if (existingUser && existingUser.id !== currentUserId) {
        throw new Error("EmailAlreadyTaken");
    }
}

/**
 * Validates that a user's email is not already verified
 */
export function validateEmailNotAlreadyVerified(user: User): void {
    if (user.emailVerified) {
        throw new Error("EmailAlreadyVerified");
    }
}

/**
 * Validates that a user's email verification status allows verification
 */
export function validateCanVerifyEmail(user: User): void {
    validateEmailNotAlreadyVerified(user);
}

/**
 * Validates create user data for business rules
 */
export function validateCreateUserData(data: CreateUserDto): void {
    // Additional business rule validations can be added here
    if (!data.email || !data.password) {
        throw new Error("InvalidUserData");
    }
}

/**
 * Validates update user data for business rules
 */
export function validateUpdateUserData(data: UpdateUserDto): void {
    // Additional business rule validations can be added here
    if (data.email && !data.email.trim()) {
        throw new Error("InvalidEmailData");
    }
}