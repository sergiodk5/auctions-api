import {
    validateUserDoesNotExist,
    validateUserExists,
    validateEmailUniqueForUpdate,
    validateEmailNotAlreadyVerified,
    validateCanVerifyEmail,
    validateCreateUserData,
    validateUpdateUserData,
} from "@/domain/user/validation";
import { CreateUserDto, UpdateUserDto, User } from "@/types/user";

describe("User Domain Validation", () => {
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

    describe("validateUserDoesNotExist", () => {
        it("should not throw when user does not exist", () => {
            expect(() => {
                validateUserDoesNotExist(undefined, "test@example.com");
            }).not.toThrow();
        });

        it("should throw UserExists when user exists", () => {
            expect(() => {
                validateUserDoesNotExist(mockUser, "test@example.com");
            }).toThrow("UserExists");
        });
    });

    describe("validateUserExists", () => {
        it("should return user when user exists", () => {
            const result = validateUserExists(mockUser, 1);
            expect(result).toBe(mockUser);
        });

        it("should throw UserNotFound when user does not exist", () => {
            expect(() => {
                validateUserExists(undefined, 1);
            }).toThrow("UserNotFound");
        });
    });

    describe("validateEmailUniqueForUpdate", () => {
        it("should not throw when email is not taken", () => {
            expect(() => {
                validateEmailUniqueForUpdate(undefined, 1, "new@example.com");
            }).not.toThrow();
        });

        it("should not throw when email belongs to same user", () => {
            expect(() => {
                validateEmailUniqueForUpdate(mockUser, 1, "test@example.com");
            }).not.toThrow();
        });

        it("should throw EmailAlreadyTaken when email belongs to different user", () => {
            expect(() => {
                validateEmailUniqueForUpdate(mockUser, 2, "test@example.com");
            }).toThrow("EmailAlreadyTaken");
        });
    });

    describe("validateEmailNotAlreadyVerified", () => {
        it("should not throw when email is not verified", () => {
            expect(() => {
                validateEmailNotAlreadyVerified(mockUser);
            }).not.toThrow();
        });

        it("should throw EmailAlreadyVerified when email is already verified", () => {
            expect(() => {
                validateEmailNotAlreadyVerified(mockVerifiedUser);
            }).toThrow("EmailAlreadyVerified");
        });
    });

    describe("validateCanVerifyEmail", () => {
        it("should not throw when email can be verified", () => {
            expect(() => {
                validateCanVerifyEmail(mockUser);
            }).not.toThrow();
        });

        it("should throw EmailAlreadyVerified when email is already verified", () => {
            expect(() => {
                validateCanVerifyEmail(mockVerifiedUser);
            }).toThrow("EmailAlreadyVerified");
        });
    });

    describe("validateCreateUserData", () => {
        it("should not throw for valid create user data", () => {
            const data: CreateUserDto = {
                email: "test@example.com",
                password: "password123",
            };

            expect(() => {
                validateCreateUserData(data);
            }).not.toThrow();
        });

        it("should throw InvalidUserData when email is missing", () => {
            const data = {
                email: "",
                password: "password123",
            } as CreateUserDto;

            expect(() => {
                validateCreateUserData(data);
            }).toThrow("InvalidUserData");
        });

        it("should throw InvalidUserData when password is missing", () => {
            const data = {
                email: "test@example.com",
                password: "",
            } as CreateUserDto;

            expect(() => {
                validateCreateUserData(data);
            }).toThrow("InvalidUserData");
        });
    });

    describe("validateUpdateUserData", () => {
        it("should not throw for valid update user data", () => {
            const data: UpdateUserDto = {
                email: "updated@example.com",
            };

            expect(() => {
                validateUpdateUserData(data);
            }).not.toThrow();
        });

        it("should not throw for empty update data", () => {
            const data: UpdateUserDto = {};

            expect(() => {
                validateUpdateUserData(data);
            }).not.toThrow();
        });

        it("should throw InvalidEmailData when email is empty string", () => {
            const data: UpdateUserDto = {
                email: "   ",
            };

            expect(() => {
                validateUpdateUserData(data);
            }).toThrow("InvalidEmailData");
        });
    });
});