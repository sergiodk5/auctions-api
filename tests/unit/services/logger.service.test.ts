import "reflect-metadata";

// Mock environment variables
jest.mock("@/config/env", () => ({
    NODE_ENV: "test",
    LOG_LEVEL: "debug",
}));

import LoggerService, { ILoggerService, ILoggerTransport } from "@/services/logger.service";

describe("LoggerService", () => {
    let loggerService: LoggerService;
    let mockLoggerTransport: jest.Mocked<ILoggerTransport>;

    beforeEach(() => {
        // Create mock logger transport (like how we mock Transporter in mailer tests)
        mockLoggerTransport = {
            error: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            http: jest.fn(),
            verbose: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
            child: jest.fn(),
        };

        loggerService = new LoggerService(mockLoggerTransport);
    });

    describe("constructor", () => {
        it("should accept a logger transport instance through dependency injection", () => {
            const service = new LoggerService(mockLoggerTransport);

            expect(service).toBeInstanceOf(LoggerService);
            expect(service).toBeDefined();
        });
    });

    describe("log methods", () => {
        it("should implement error logging", () => {
            const message = "Test error message";
            const meta = { userId: "123", action: "test" };

            loggerService.error(message, meta);

            expect(mockLoggerTransport.error).toHaveBeenCalledWith(message, meta);
        });

        it("should implement warn logging", () => {
            const message = "Test warning message";
            const meta = { component: "auth" };

            loggerService.warn(message, meta);

            expect(mockLoggerTransport.warn).toHaveBeenCalledWith(message, meta);
        });

        it("should implement info logging", () => {
            const message = "Test info message";

            loggerService.info(message);

            expect(mockLoggerTransport.info).toHaveBeenCalledWith(message, undefined);
        });

        it("should implement http logging", () => {
            const message = "Test http message";
            const meta = { method: "GET", url: "/api/test" };

            loggerService.http(message, meta);

            expect(mockLoggerTransport.http).toHaveBeenCalledWith(message, meta);
        });

        it("should implement verbose logging", () => {
            const message = "Test verbose message";

            loggerService.verbose(message);

            expect(mockLoggerTransport.verbose).toHaveBeenCalledWith(message, undefined);
        });

        it("should implement debug logging", () => {
            const message = "Test debug message";
            const meta = { step: "validation" };

            loggerService.debug(message, meta);

            expect(mockLoggerTransport.debug).toHaveBeenCalledWith(message, meta);
        });

        it("should implement silly logging", () => {
            const message = "Test silly message";

            loggerService.silly(message);

            expect(mockLoggerTransport.silly).toHaveBeenCalledWith(message, undefined);
        });
    });

    describe("child logger", () => {
        it("should create child logger with default metadata", () => {
            const defaultMeta = { service: "user-service", requestId: "req-123" };
            mockLoggerTransport.child.mockReturnValue(mockLoggerTransport);

            const childLogger = loggerService.child(defaultMeta);

            expect(mockLoggerTransport.child).toHaveBeenCalledWith(defaultMeta);
            expect(childLogger).toBeDefined();
        });

        it("should return child logger that implements ILoggerService", () => {
            const defaultMeta = { service: "test-service" };
            const mockChildTransport: jest.Mocked<ILoggerTransport> = {
                error: jest.fn(),
                warn: jest.fn(),
                info: jest.fn(),
                http: jest.fn(),
                verbose: jest.fn(),
                debug: jest.fn(),
                silly: jest.fn(),
                child: jest.fn(),
            };

            mockLoggerTransport.child.mockReturnValue(mockChildTransport);

            const childLogger = loggerService.child(defaultMeta);

            // Test that the child logger implements all required methods
            expect(typeof childLogger.error).toBe("function");
            expect(typeof childLogger.warn).toBe("function");
            expect(typeof childLogger.info).toBe("function");
            expect(typeof childLogger.http).toBe("function");
            expect(typeof childLogger.verbose).toBe("function");
            expect(typeof childLogger.debug).toBe("function");
            expect(typeof childLogger.silly).toBe("function");
            expect(typeof childLogger.child).toBe("function");

            // Test that methods are callable
            childLogger.info("test message");
            expect(mockChildTransport.info).toHaveBeenCalledWith("test message", undefined);
        });
    });

    describe("error object handling", () => {
        it("should handle Error objects properly", () => {
            const error = new Error("Test error");
            error.stack = "Error stack trace";

            loggerService.error("Error occurred", { error });

            expect(mockLoggerTransport.error).toHaveBeenCalledWith("Error occurred", { error });
        });

        it("should log Error objects directly", () => {
            const error = new Error("Direct error");
            error.stack = "Error stack trace";

            loggerService.error(error);

            expect(mockLoggerTransport.error).toHaveBeenCalledWith(error.message, {
                error,
                stack: error.stack,
            });
        });
    });

    describe("interface compliance", () => {
        it("should implement ILoggerService interface", () => {
            // Type check - this will cause compilation error if interface is not implemented
            const service: ILoggerService = loggerService;

            expect(service).toBeDefined();
            expect(typeof service.error).toBe("function");
            expect(typeof service.warn).toBe("function");
            expect(typeof service.info).toBe("function");
            expect(typeof service.http).toBe("function");
            expect(typeof service.verbose).toBe("function");
            expect(typeof service.debug).toBe("function");
            expect(typeof service.silly).toBe("function");
            expect(typeof service.child).toBe("function");
        });
    });
});
