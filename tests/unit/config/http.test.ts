import "reflect-metadata";

import {
    BAD_REQUEST,
    CONFLICT,
    CREATED,
    FORBIDDEN,
    GATEWAY_TIMEOUT,
    INTERNAL_SERVER_ERROR,
    NO_CONTENT,
    NOT_FOUND,
    OK,
    SERVICE_UNAVAILABLE,
    TOO_MANY_REQUESTS,
    UNAUTHORIZED,
    UNPROCESSABLE_CONTENT,
} from "@/config/http";

describe("HTTP Status Code Constants", () => {
    describe("Success Status Codes (2xx)", () => {
        test("should export OK with correct value", () => {
            expect(OK).toBe(200);
            expect(typeof OK).toBe("number");
        });

        test("should export CREATED with correct value", () => {
            expect(CREATED).toBe(201);
            expect(typeof CREATED).toBe("number");
        });

        test("should export NO_CONTENT with correct value", () => {
            expect(NO_CONTENT).toBe(204);
            expect(typeof NO_CONTENT).toBe("number");
        });
    });

    describe("Client Error Status Codes (4xx)", () => {
        test("should export BAD_REQUEST with correct value", () => {
            expect(BAD_REQUEST).toBe(400);
            expect(typeof BAD_REQUEST).toBe("number");
        });

        test("should export UNAUTHORIZED with correct value", () => {
            expect(UNAUTHORIZED).toBe(401);
            expect(typeof UNAUTHORIZED).toBe("number");
        });

        test("should export FORBIDDEN with correct value", () => {
            expect(FORBIDDEN).toBe(403);
            expect(typeof FORBIDDEN).toBe("number");
        });

        test("should export NOT_FOUND with correct value", () => {
            expect(NOT_FOUND).toBe(404);
            expect(typeof NOT_FOUND).toBe("number");
        });

        test("should export CONFLICT with correct value", () => {
            expect(CONFLICT).toBe(409);
            expect(typeof CONFLICT).toBe("number");
        });

        test("should export UNPROCESSABLE_CONTENT with correct value", () => {
            expect(UNPROCESSABLE_CONTENT).toBe(422);
            expect(typeof UNPROCESSABLE_CONTENT).toBe("number");
        });

        test("should export TOO_MANY_REQUESTS with correct value", () => {
            expect(TOO_MANY_REQUESTS).toBe(429);
            expect(typeof TOO_MANY_REQUESTS).toBe("number");
        });
    });

    describe("Server Error Status Codes (5xx)", () => {
        test("should export INTERNAL_SERVER_ERROR with correct value", () => {
            expect(INTERNAL_SERVER_ERROR).toBe(500);
            expect(typeof INTERNAL_SERVER_ERROR).toBe("number");
        });

        test("should export SERVICE_UNAVAILABLE with correct value", () => {
            expect(SERVICE_UNAVAILABLE).toBe(503);
            expect(typeof SERVICE_UNAVAILABLE).toBe("number");
        });

        test("should export GATEWAY_TIMEOUT with correct value", () => {
            expect(GATEWAY_TIMEOUT).toBe(504);
            expect(typeof GATEWAY_TIMEOUT).toBe("number");
        });
    });

    describe("Status Code Categories", () => {
        test("should have all success status codes in 2xx range", () => {
            const successCodes = [OK, CREATED, NO_CONTENT];

            successCodes.forEach((code) => {
                expect(code).toBeGreaterThanOrEqual(200);
                expect(code).toBeLessThan(300);
            });
        });

        test("should have all client error status codes in 4xx range", () => {
            const clientErrorCodes = [
                BAD_REQUEST,
                UNAUTHORIZED,
                FORBIDDEN,
                NOT_FOUND,
                CONFLICT,
                UNPROCESSABLE_CONTENT,
                TOO_MANY_REQUESTS,
            ];

            clientErrorCodes.forEach((code) => {
                expect(code).toBeGreaterThanOrEqual(400);
                expect(code).toBeLessThan(500);
            });
        });

        test("should have all server error status codes in 5xx range", () => {
            const serverErrorCodes = [INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, GATEWAY_TIMEOUT];

            serverErrorCodes.forEach((code) => {
                expect(code).toBeGreaterThanOrEqual(500);
                expect(code).toBeLessThan(600);
            });
        });
    });

    describe("Status Code Uniqueness", () => {
        test("should have all unique status code values", () => {
            const allCodes = [
                OK,
                CREATED,
                NO_CONTENT,
                BAD_REQUEST,
                UNAUTHORIZED,
                FORBIDDEN,
                NOT_FOUND,
                CONFLICT,
                UNPROCESSABLE_CONTENT,
                TOO_MANY_REQUESTS,
                INTERNAL_SERVER_ERROR,
                SERVICE_UNAVAILABLE,
                GATEWAY_TIMEOUT,
            ];

            const uniqueCodes = new Set(allCodes);
            expect(uniqueCodes.size).toBe(allCodes.length);
        });
    });
});
