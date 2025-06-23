import { TYPES } from "@/di/types";
import type { ILoggerService } from "@/services/logger.service";
import { Response } from "express";
import { inject, injectable } from "inversify";
import _ from "lodash";
import { ZodError, ZodTypeAny } from "zod";

// Create a more flexible type that accepts any Zod-like schema
type ValidatableSchema =
    | {
          parse: (data: unknown) => unknown;
          shape?: Record<string, unknown>;
      }
    | ZodTypeAny;

export interface IValidationService {
    validateSchema(schema: ValidatableSchema): (payload: unknown) => Record<string, unknown>;
    handleError(res: Response, error: unknown): void;
}

@injectable()
export default class ValidationService {
    constructor(
        @inject(TYPES.ILoggerService)
        private readonly logger: ILoggerService,
    ) {}
    public validateSchema(schema: ValidatableSchema): (payload: unknown) => Record<string, unknown> {
        return (payload: unknown) => {
            const parsed = schema.parse(payload);
            // For ZodObject types, we can extract allowed keys for filtering
            if ("shape" in schema && schema.shape && typeof schema.shape === "object") {
                const allowedKeys = Object.keys(schema.shape);
                return _.pick(parsed as Record<string, unknown>, allowedKeys);
            }
            return parsed as Record<string, unknown>;
        };
    }

    public handleError(res: Response, error: unknown) {
        if (
            error instanceof ZodError ||
            (error &&
                typeof error === "object" &&
                (error.constructor?.name === "ZodError" || ("errors" in error && Array.isArray((error as any).errors))))
        ) {
            // Handle ZodError or ZodError-like objects
            const zodError = error as any;
            const errors = zodError.errors ?? [];
            const messages = errors.map((err: any) => ({
                message: `${err.path?.join?.(".") ?? "field"} is ${err.message}`,
            }));
            res.status(400).json({ success: false, data: null, message: messages });
        } else {
            this.logger.error("Unexpected validation error", { error });
            res.status(500).json({ success: false, data: null, message: "Internal server error" });
        }
    }
}
