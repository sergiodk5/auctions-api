import {
    shouldCreateUser,
    shouldUpdateUser,
    shouldDeleteUser,
    canUpdateEmail,
    prepareCreateUserData,
    prepareUpdateUserData,
    getUserAccessLevel,
    isUserProfileComplete,
} from "@/domain/user/business-rules";
import { CreateUserDto, UpdateUserDto, User } from "@/types/user";

describe("User Domain Business Rules", () => {
    const mockUser: User = {
        id: 1,
        email: "test@example.com",
        emailVerified: false,
    };

    const mockVerifiedUser: User = {
        id: 2,
        email: "verified@example.com",
        emailVerified: true,
    };

    describe("shouldCreateUser", () => {
        it("should return true when no existing user", () => {
            const result = shouldCreateUser(undefined, { email: "new@test.com", password: "password" });
            expect(result).toBe(true);
        });

        it("should return false when user already exists", () => {
            const result = shouldCreateUser(mockUser, { email: "test@example.com", password: "password" });
            expect(result).toBe(false);
        });
    });

    describe("shouldUpdateUser", () => {
        it("should return true when user exists", () => {
            const result = shouldUpdateUser(mockUser, { email: "updated@test.com" });
            expect(result).toBe(true);
        });

        it("should return false when user does not exist", () => {
            const result = shouldUpdateUser(undefined, { email: "updated@test.com" });
            expect(result).toBe(false);
        });
    });

    describe("shouldDeleteUser", () => {
        it("should return true when user exists", () => {
            const result = shouldDeleteUser(mockUser);
            expect(result).toBe(true);
        });

        it("should return false when user does not exist", () => {
            const result = shouldDeleteUser(undefined);
            expect(result).toBe(false);
        });
    });

    describe("canUpdateEmail", () => {
        it("should return true when no existing user with email", () => {
            const result = canUpdateEmail(undefined, 1);
            expect(result).toBe(true);
        });

        it("should return true when existing user is the same user", () => {
            const result = canUpdateEmail(mockUser, 1);
            expect(result).toBe(true);
        });

        it("should return false when existing user is different", () => {
            const result = canUpdateEmail(mockUser, 2);
            expect(result).toBe(false);
        });
    });

    describe("prepareCreateUserData", () => {
        it("should normalize email to lowercase and trim", () => {
            const data: CreateUserDto = {
                email: "  Test@Example.COM  ",
                password: "password123",
            };

            const result = prepareCreateUserData(data);
            expect(result.email).toBe("test@example.com");
            expect(result.password).toBe("password123");
        });

        it("should preserve other data fields", () => {
            const data: CreateUserDto = {
                email: "test@example.com",
                password: "password123",
            };

            const result = prepareCreateUserData(data);
            expect(result).toEqual({
                email: "test@example.com",
                password: "password123",
            });
        });
    });

    describe("prepareUpdateUserData", () => {
        it("should normalize email when provided", () => {
            const data: UpdateUserDto = {
                email: "  Updated@Example.COM  ",
            };

            const result = prepareUpdateUserData(data);
            expect(result.email).toBe("updated@example.com");
        });

        it("should not modify data when email not provided", () => {
            const data: UpdateUserDto = {
                // other fields could be here
            };

            const result = prepareUpdateUserData(data);
            expect(result).toEqual(data);
        });
    });

    describe("getUserAccessLevel", () => {
        it("should return 'verified' for verified user", () => {
            const result = getUserAccessLevel(mockVerifiedUser);
            expect(result).toBe("verified");
        });

        it("should return 'unverified' for unverified user", () => {
            const result = getUserAccessLevel(mockUser);
            expect(result).toBe("unverified");
        });
    });

    describe("isUserProfileComplete", () => {
        it("should return true for user with email and verified status", () => {
            const result = isUserProfileComplete(mockVerifiedUser);
            expect(result).toBe(true);
        });

        it("should return false for user with email but not verified", () => {
            const result = isUserProfileComplete(mockUser);
            expect(result).toBe(false);
        });

        it("should return false for user without email", () => {
            const userWithoutEmail = { ...mockVerifiedUser, email: "" };
            const result = isUserProfileComplete(userWithoutEmail);
            expect(result).toBe(false);
        });
    });
});