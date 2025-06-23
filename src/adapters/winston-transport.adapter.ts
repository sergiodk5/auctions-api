import { LOG_LEVEL, NODE_ENV } from "@/config/env";
import type { ILoggerTransport } from "@/services/logger.service";
import winston, { Logger } from "winston";

/**
 * Winston adapter that implements the generic ILoggerTransport interface
 * This adapter encapsulates all Winston-specific configuration and behavior
 * Similar to how nodemailer's Transporter works in the mailer service
 */
export class WinstonTransportAdapter implements ILoggerTransport {
    private readonly logger: Logger;

    constructor() {
        this.logger = this.createLogger();
    }

    /**
     * Create and configure Winston logger
     */
    private createLogger(): Logger {
        const isProduction = NODE_ENV === "production";
        const isTest = NODE_ENV === "test";

        // Create log format based on environment
        const baseFormats = [
            winston.format.timestamp({
                format: isProduction ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD HH:mm:ss.SSS",
            }),
            winston.format.errors({ stack: true }), // Include stack traces for errors
        ];

        let logFormat;
        if (isTest) {
            // Simple format for tests to reduce noise
            logFormat = winston.format.combine(...baseFormats, winston.format.simple());
        } else if (isProduction) {
            // Structured JSON logging for production
            logFormat = winston.format.combine(...baseFormats, winston.format.json());
        } else {
            // Human-readable format for development
            logFormat = winston.format.combine(
                ...baseFormats,
                winston.format.colorize({ all: true }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
                    return `[${timestamp}] ${level}: ${message}${metaStr}`;
                }),
            );
        }

        // Create transports based on environment
        const transports: winston.transport[] = [];

        if (isTest) {
            // Silent console transport for tests to reduce noise
            transports.push(
                new winston.transports.Console({
                    silent: true,
                }),
            );
        } else {
            // Console transport for development and production
            transports.push(new winston.transports.Console());

            if (isProduction) {
                // File transports for production
                transports.push(
                    new winston.transports.File({
                        filename: "logs/error.log",
                        level: "error",
                    }),
                    new winston.transports.File({
                        filename: "logs/combined.log",
                    }),
                );
            }
        }

        return winston.createLogger({
            level: LOG_LEVEL,
            format: logFormat,
            transports: transports,
            exitOnError: false,
            handleExceptions: true,
            handleRejections: true,
            exceptionHandlers: isTest ? [] : [new winston.transports.File({ filename: "logs/exceptions.log" })],
            rejectionHandlers: isTest ? [] : [new winston.transports.File({ filename: "logs/rejections.log" })],
        });
    }

    // Implement ILoggerTransport interface
    public error(message: string, meta?: Record<string, any>): void {
        this.logger.error(message, meta);
    }

    public warn(message: string, meta?: Record<string, any>): void {
        this.logger.warn(message, meta);
    }

    public info(message: string, meta?: Record<string, any>): void {
        this.logger.info(message, meta);
    }

    public http(message: string, meta?: Record<string, any>): void {
        this.logger.http(message, meta);
    }

    public verbose(message: string, meta?: Record<string, any>): void {
        this.logger.verbose(message, meta);
    }

    public debug(message: string, meta?: Record<string, any>): void {
        this.logger.debug(message, meta);
    }

    public silly(message: string, meta?: Record<string, any>): void {
        this.logger.silly(message, meta);
    }

    public child(meta: Record<string, any>): ILoggerTransport {
        const childLogger = this.logger.child(meta);

        // Create a new adapter instance with the child logger
        const adapter = Object.create(WinstonTransportAdapter.prototype);
        adapter.logger = childLogger;

        return adapter as ILoggerTransport;
    }
}
