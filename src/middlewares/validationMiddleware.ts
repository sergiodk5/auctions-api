import { Request, Response, NextFunction } from "express-serve-static-core";
import { z, ZodError } from "zod";
import _ from "lodash";

export function validateData(schema: z.ZodObject<any, any>) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            const cleanBody = _.pick(req.body, Object.keys(schema.shape));
            req.body.cleanBody = cleanBody;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map((issue: any) => ({
                    message: `${issue.path.join(".")} is ${issue.message}`,
                }));

                res.status(400).json({
                    success: false,
                    data: null,
                    message: errorMessages,
                });

                return;
            }

            console.error("Unexpected error during validation:", error);
            res.status(500).json({
                success: false,
                data: null,
                message: "Internal server error",
            });
        }
    };
}
