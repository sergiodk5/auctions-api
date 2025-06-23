import container from "@/di/container";
import { TYPES } from "@/di/types";
import "reflect-metadata";
import { createMockLoggerService } from "../../mocks/services/mock-logger.service";

describe("jsonErrorHandler", () => {
    let req: any;
    let res: any;
    let next: jest.Mock;
    let mockLogger: any;
    let jsonErrorHandler: any;
    const err = new Error("Something went wrong");

    beforeEach(() => {
        // Create and bind mock logger before importing the handler
        mockLogger = createMockLoggerService();

        // Clear any existing binding
        if (container.isBound(TYPES.ILoggerService)) {
            void container.unbind(TYPES.ILoggerService);
        }

        container.bind(TYPES.ILoggerService).toConstantValue(mockLogger);

        // Clear the require cache to force re-import with new logger
        const modulePath = require.resolve("@/middlewares/json-error-handler");
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete require.cache[modulePath];

        // Import the handler after binding the mock logger
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        jsonErrorHandler = require("@/middlewares/json-error-handler").default;

        // Mock req with all necessary methods
        req = {
            path: "/test-path",
            method: "GET",
            url: "/test-path",
            ip: "127.0.0.1",
            get: jest.fn().mockReturnValue("test-user-agent"),
        } as any;

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        next = jest.fn();
    });

    afterEach(() => {
        if (container.isBound(TYPES.ILoggerService)) {
            void container.unbind(TYPES.ILoggerService);
        }
        jest.restoreAllMocks();
    });

    it("logs the path and error, and sends a 500 with the error object", async () => {
        // Cast to the ErrorRequestHandler signature
        const handler = jsonErrorHandler;

        await handler(err, req, res, next);

        // Logger should be called with error information
        expect(mockLogger.error).toHaveBeenCalledWith("JSON Error Handler - Path: /test-path", {
            error: err,
            method: "GET",
            url: "/test-path",
            userAgent: "test-user-agent",
            ip: "127.0.0.1",
        });

        // Response status should be 500
        expect(res.status).toHaveBeenCalledWith(500);

        // Response send should include the error object
        expect(res.send).toHaveBeenCalledWith({ error: err });

        // Next should not be called
        expect(next).not.toHaveBeenCalled();
    });
});
