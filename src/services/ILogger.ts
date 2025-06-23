/**
 * Generic logger interface for logging operations
 * This interface is independent of any specific logging library
 */
export interface ILogger {
    /**
     * Log error messages - for application errors and exceptions
     */
    error(message: string, meta?: Record<string, any>): void;

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
    child(defaultMeta: Record<string, any>): ILogger;
}
