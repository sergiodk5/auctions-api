import { Request, Response, NextFunction } from "express-serve-static-core";
import { ZodObject, ZodRawShape } from "zod";
import _ from "lodash";
import { inject, injectable } from "inversify";
import { TYPES } from "@/di/types";
import { type IValidationService } from "@/services/validation.service";

export interface IValidationMiddleware {
    validate<T extends ZodRawShape>(schema: ZodObject<T>): (req: Request, res: Response, next: NextFunction) => void;
}

@injectable()
export class ValidationMiddleware {
    constructor(@inject(TYPES.IValidationService) private validator: IValidationService) {}

    public validate<T extends ZodRawShape>(schema: ZodObject<T>) {
        const parse = this.validator.validateSchema(schema);

        return (req: Request, res: Response, next: NextFunction) => {
            try {
                const clean = parse(req.body);
                (req as any).body.cleanBody = clean;
                next();
            } catch (err) {
                this.validator.handleError(res, err);
                return;
            }
        };
    }
}
