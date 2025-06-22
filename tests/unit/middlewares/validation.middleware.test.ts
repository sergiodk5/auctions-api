import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import "reflect-metadata";
import { z, ZodObject } from "zod";

describe("ValidationMiddleware", () => {
    let mockValidator: {
        validateSchema: jest.Mock;
        handleError: jest.Mock;
    };
    let middleware: ValidationMiddleware;
    let req: any;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
        mockValidator = {
            validateSchema: jest.fn(),
            handleError: jest.fn(),
        };
        middleware = new ValidationMiddleware(mockValidator as any);
        req = {
            body: {},
            params: {},
            query: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it("parses valid payload, strips extras, sets cleanBody, and calls next()", () => {
        const schema: ZodObject<{ a: import("zod").ZodString }> = z.object({ a: z.string() });
        let capturedArgs: any;
        const parseMock = jest.fn().mockImplementation((args) => {
            capturedArgs = JSON.parse(JSON.stringify(args)); // Deep copy to capture the exact state
            return { a: "foo" };
        });
        mockValidator.validateSchema.mockReturnValue(parseMock);

        // include an extra field
        req.body = { a: "foo", extra: 123 };

        const handler = middleware.validate(schema);
        handler(req, res, next);

        expect(mockValidator.validateSchema).toHaveBeenCalledWith(schema);
        expect(capturedArgs).toEqual({
            body: { a: "foo", extra: 123 },
            params: {},
            query: {},
        });
        expect(req.body.cleanBody).toEqual({ a: "foo" });
        expect(next).toHaveBeenCalled();
        expect(mockValidator.handleError).not.toHaveBeenCalled();
    });

    it("on parse error calls handleError(res, error) and does NOT call next()", () => {
        const schema: ZodObject<{ a: import("zod").ZodString }> = z.object({ a: z.string() });
        const parseError = new Error("Invalid payload");
        const parseMock = jest.fn().mockImplementation(() => {
            throw parseError;
        });
        mockValidator.validateSchema.mockReturnValue(parseMock);

        // invalid payload
        req.body = { a: 123 };

        const handler = middleware.validate(schema);
        handler(req, res, next);

        expect(mockValidator.validateSchema).toHaveBeenCalledWith(schema);
        expect(parseMock).toHaveBeenCalledWith({
            body: req.body,
            params: req.params,
            query: req.query,
        });
        expect(mockValidator.handleError).toHaveBeenCalledWith(res, parseError);
        expect(next).not.toHaveBeenCalled();
    });
});
