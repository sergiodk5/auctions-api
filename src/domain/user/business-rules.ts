/**
 * User domain business rules
 * Pure functions for user-related business logic
 */

import { CreateUserDto, UpdateUserDto, User } from "@/types/user";

/**
 * Business rule for user creation
 * Encapsulates the logic for creating a new user
 */
export function shouldCreateUser(existingUser: User | undefined, data: CreateUserDto): boolean {
    return existingUser === undefined;
}

/**
 * Business rule for user updates
 * Determines if user update should proceed
 */
export function shouldUpdateUser(user: User | undefined, data: UpdateUserDto): boolean {
    return user !== undefined;
}

/**
 * Business rule for user deletion  
 * Determines if user deletion should proceed
 */
export function shouldDeleteUser(user: User | undefined): boolean {
    return user !== undefined;
}

/**
 * Business rule for email update
 * Determines if email can be updated for a user
 */
export function canUpdateEmail(existingUserWithEmail: User | undefined, currentUserId: number): boolean {
    return !existingUserWithEmail || existingUserWithEmail.id === currentUserId;
}

/**
 * Prepares user data for creation
 * Applies business rules to user creation data
 */
export function prepareCreateUserData(data: CreateUserDto): CreateUserDto {
    return {
        ...data,
        email: data.email.toLowerCase().trim(),
    };
}

/**
 * Prepares user data for updates
 * Applies business rules to user update data
 */
export function prepareUpdateUserData(data: UpdateUserDto): UpdateUserDto {
    const prepared: UpdateUserDto = { ...data };
    
    if (prepared.email) {
        prepared.email = prepared.email.toLowerCase().trim();
    }
    
    return prepared;
}

/**
 * Business rule for determining user access level
 */
export function getUserAccessLevel(user: User): 'verified' | 'unverified' {
    return user.emailVerified ? 'verified' : 'unverified';
}

/**
 * Business rule for user profile completeness
 */
export function isUserProfileComplete(user: User): boolean {
    return Boolean(user.email && user.emailVerified);
}