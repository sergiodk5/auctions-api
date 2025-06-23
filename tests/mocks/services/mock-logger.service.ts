import { ILoggerService } from "@/services/logger.service";

export const createMockLoggerService = (): ILoggerService => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
    child: jest.fn().mockReturnValue({
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        http: jest.fn(),
        verbose: jest.fn(),
        debug: jest.fn(),
        silly: jest.fn(),
        child: jest.fn(),
    }),
});
