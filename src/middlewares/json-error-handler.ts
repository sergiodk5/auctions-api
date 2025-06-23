import container from "@/di/container";
import { TYPES } from "@/di/types";
import type { ILoggerService } from "@/services/logger.service";
import { ErrorRequestHandler } from "express-serve-static-core";

const logger = container.get<ILoggerService>(TYPES.ILoggerService);

const jsonErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    logger.error(`JSON Error Handler - Path: ${req.path}`, {
        error: err,
        method: req.method,
        url: req.url,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
    });
    res.status(500).send({ error: err });
};

export default jsonErrorHandler;
