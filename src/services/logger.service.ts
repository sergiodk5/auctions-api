import { TYPES } from "@/di/types";
import { inject, injectable } from "inversify";

/**
 * Generic logger interface - independent of any specific logging library
 * This is like the Transporter interface in the mailer service
 */
export interface ILoggerTransport {
    error(message: string, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    info(message: string, meta?: Record<string, any>): void;
    http(message: string, meta?: Record<string, any>): void;
    verbose(message: string, meta?: Record<string, any>): void;
    debug(message: string, meta?: Record<string, any>): void;
    silly(message: string, meta?: Record<string, any>): void;
    child(meta: Record<string, any>): ILoggerTransport;
}

/**
 * Logger service interface defining all logging methods
 */
export interface ILoggerService {
    /**
     * Log error messages - for application errors and exceptions
     */
    error(message: string | Error, meta?: Record<string, any>): void;

    /**
     * Log warning messages - for potentially harmful situations
     */
    warn(message: string, meta?: Record<string, any>): void;

    /**
     * Log info messages - for general application flow information
     */
    info(message: string, meta?: Record<string, any>): void;

    /**
     * Log HTTP requests and responses
     */
    http(message: string, meta?: Record<string, any>): void;

    /**
     * Log verbose messages - for detailed information
     */
    verbose(message: string, meta?: Record<string, any>): void;

    /**
     * Log debug messages - for debugging information
     */
    debug(message: string, meta?: Record<string, any>): void;

    /**
     * Log silly messages - for very detailed debugging
     */
    silly(message: string, meta?: Record<string, any>): void;

    /**
     * Create a child logger with default metadata
     */
    child(defaultMeta: Record<string, any>): ILoggerService;
}

/**
 * Logger service implementation that's independent of any specific logging library
 * Uses dependency injection to receive a configured logger instance (like MailerService uses Transporter)
 */
@injectable()
export default class LoggerService implements ILoggerService {
    constructor(
        @inject(TYPES.LoggerTransport)
        private readonly logger: ILoggerTransport,
    ) {}

    /**
     * Log error messages
     */
    public error(message: string | Error, meta?: Record<string, any>): void {
        if (message instanceof Error) {
            this.logger.error(message.message, { ...meta, error: message, stack: message.stack });
        } else {
            this.logger.error(message, meta);
        }
    }

    /**
     * Log warning messages
     */
    public warn(message: string, meta?: Record<string, any>): void {
        this.logger.warn(message, meta);
    }

    /**
     * Log info messages
     */
    public info(message: string, meta?: Record<string, any>): void {
        this.logger.info(message, meta);
    }

    /**
     * Log HTTP requests and responses
     */
    public http(message: string, meta?: Record<string, any>): void {
        this.logger.http(message, meta);
    }

    /**
     * Log verbose messages
     */
    public verbose(message: string, meta?: Record<string, any>): void {
        this.logger.verbose(message, meta);
    }

    /**
     * Log debug messages
     */
    public debug(message: string, meta?: Record<string, any>): void {
        this.logger.debug(message, meta);
    }

    /**
     * Log silly messages
     */
    public silly(message: string, meta?: Record<string, any>): void {
        this.logger.silly(message, meta);
    }

    /**
     * Create child logger with default metadata
     */
    public child(defaultMeta: Record<string, any>): ILoggerService {
        const childLogger = this.logger.child(defaultMeta);

        // Create a new LoggerService instance with the child logger
        const childService = Object.create(LoggerService.prototype);
        childService.logger = childLogger;

        return childService as ILoggerService;
    }
}
