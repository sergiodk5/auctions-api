import container from "@/di/container";
import { TYPES } from "@/di/types";
import { NODE_ENV } from "@/config/env";
import type { ILoggerService } from "@/services/logger.service";
import { ErrorRequestHandler } from "express-serve-static-core";

const logger = container.get<ILoggerService>(TYPES.ILoggerService);

interface SafeError {
    message: string;
    code?: string;
    statusCode?: number;
}

const sanitizeError = (err: any): SafeError => {
    // Handle known safe error types
    if (err.name === 'ValidationError' || err.name === 'ZodError') {
        return {
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            statusCode: 400
        };
    }
    
    if (err.name === 'UnauthorizedError') {
        return {
            message: "Unauthorized",
            code: "UNAUTHORIZED",
            statusCode: 401
        };
    }
    
    // Production: Only show generic errors
    if (NODE_ENV === 'production') {
        return {
            message: "Internal server error",
            code: "INTERNAL_ERROR",
            statusCode: 500
        };
    }
    
    // Development: Show more details but still sanitized
    return {
        message: err.message ?? "Internal server error",
        code: err.code ?? "INTERNAL_ERROR",
        statusCode: err.statusCode ?? 500
    };
};

const jsonErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    // Log full error details for debugging (server-side only)
    logger.error(`Error Handler - ${req.method} ${req.path}`, {
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
        },
        request: {
            method: req.method,
            url: req.url,
            userAgent: req.get("User-Agent"),
            ip: req.ip,
        },
    });
    
    // Send only safe error details to client
    const safeError = sanitizeError(err);
    res.status(safeError.statusCode ?? 500).json({
        success: false,
        error: {
            message: safeError.message,
            code: safeError.code,
        },
        data: null,
    });
};

export default jsonErrorHandler;
