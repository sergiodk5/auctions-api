import { comparePassword, hashPassword } from "@/utils/password.util";
import bcrypt from "bcryptjs";

jest.mock("bcryptjs", () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

// Mock the env module to allow changing NODE_ENV
let mockNodeEnv = "test";
jest.mock("@/config/env", () => ({
    get NODE_ENV() {
        return mockNodeEnv;
    },
}));

describe("Password Utility Functions", () => {
    it("should hash a password", async () => {
        const password = "myPassword";
        const hashedPassword = "hashedPassword";

        (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

        const result = await hashPassword(password);

        expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
        expect(result).toBe(hashedPassword);
    });

    it("should throw an error if hashing fails", async () => {
        const password = "myPassword";
        const errorMessage = "Hashing error";

        (bcrypt.hash as jest.Mock).mockRejectedValue(new Error(errorMessage));

        await expect(hashPassword(password)).rejects.toThrow("Failed to hash password");
    });

    it("should compare a password with a hashed password", async () => {
        const password = "myPassword";
        const hashedPassword = "hashedPassword";

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const result = await comparePassword(password, hashedPassword);

        expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        expect(result).toBe(true);
    });

    it("should return false if passwords do not match", async () => {
        const password = "myPassword";
        const hashedPassword = "hashedPassword";

        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        const result = await comparePassword(password, hashedPassword);

        expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        expect(result).toBe(false);
    });

    it("should throw an error if comparison fails", async () => {
        const password = "myPassword";
        const hashedPassword = "hashedPassword";
        const errorMessage = "Comparison error";

        (bcrypt.compare as jest.Mock).mockRejectedValue(new Error(errorMessage));

        await expect(comparePassword(password, hashedPassword)).rejects.toThrow(errorMessage);
    });

    it("should log error in non-test environment when hashing fails", async () => {
        const password = "myPassword";
        const errorMessage = "Hashing error";

        // Change mock to production environment
        mockNodeEnv = "production";

        // Mock console.error
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        (bcrypt.hash as jest.Mock).mockRejectedValue(new Error(errorMessage));

        await expect(hashPassword(password)).rejects.toThrow("Failed to hash password");

        expect(consoleSpy).toHaveBeenCalledWith("Error hashing password:", expect.any(Error));

        // Restore console and environment
        consoleSpy.mockRestore();
        mockNodeEnv = "test";
    });
});
