import { injectable } from "inversify";
import { ZodObject, ZodError, ZodRawShape } from "zod";
import _ from "lodash";

export interface IValidationService {
    validateSchema<T extends ZodRawShape>(
        schema: ZodObject<T>,
    ): (payload: unknown) => Pick<Record<keyof T, any>, keyof T>;
    handleError(res: any, error: unknown): void;
}

@injectable()
export default class ValidationService {
    public validateSchema<T extends ZodRawShape>(
        schema: ZodObject<T>,
    ): (payload: unknown) => Pick<Record<keyof T, any>, keyof T> {
        return (payload: unknown) => {
            const parsed = schema.parse(payload);
            const allowedKeys = Object.keys(schema.shape) as (keyof T)[];
            return _.pick(parsed, allowedKeys) as Pick<Record<keyof T, any>, keyof T>;
        };
    }

    public handleError(res: any, error: unknown) {
        if (error instanceof ZodError) {
            const messages = error.errors.map((err) => ({
                message: `${err.path.join(".")} is ${err.message}`,
            }));
            res.status(400).json({ success: false, data: null, message: messages });
        } else {
            console.error("Unexpected validation error:", error);
            res.status(500).json({ success: false, data: null, message: "Internal server error" });
        }
    }
}
