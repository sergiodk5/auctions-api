import { TYPES } from "@/di/types";
import { type IValidationService } from "@/services/validation.service";
import { NextFunction, Request, Response } from "express-serve-static-core";
import { inject, injectable } from "inversify";
import { ZodTypeAny } from "zod";

// Create a more flexible type that accepts any Zod-like schema
type ValidatableSchema =
    | {
          parse: (data: unknown) => unknown;
          shape?: Record<string, unknown>;
      }
    | ZodTypeAny;

// Type-safe request extension
interface ValidatedRequest extends Request {
    body: {
        cleanBody: Record<string, unknown>;
    } & Record<string, unknown>;
}

export interface IValidationMiddleware {
    validate(schema: ValidatableSchema): (req: Request, res: Response, next: NextFunction) => void;
}

@injectable()
export class ValidationMiddleware {
    constructor(@inject(TYPES.IValidationService) private validator: IValidationService) {}

    public validate(schema: ValidatableSchema) {
        const parse = this.validator.validateSchema(schema);

        return (req: Request, res: Response, next: NextFunction) => {
            try {
                const clean = parse(req.body);
                // Type-safe assignment using proper interface extension
                (req as ValidatedRequest).body.cleanBody = clean;
                next();
            } catch (err) {
                this.validator.handleError(res, err);
                return;
            }
        };
    }
}
