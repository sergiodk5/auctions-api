import "reflect-metadata";
import { z, ZodError } from "zod";
import ValidationService from "@/services/validation.service";

describe("ValidationService", () => {
    describe("validateSchema", () => {
        let svc: ValidationService;

        beforeEach(() => {
            svc = new ValidationService();
        });

        it("parses valid input and strips extra keys", () => {
            const schema = z.object({ a: z.string(), b: z.number() });
            const parse = svc.validateSchema(schema);

            const payload = { a: "foo", b: 42, c: true };
            const clean = parse(payload);

            expect(clean).toEqual({ a: "foo", b: 42 });
            expect((clean as any).c).toBeUndefined();
        });

        it("throws ZodError on invalid input", () => {
            const schema = z.object({ a: z.string(), b: z.number() });
            const parse = svc.validateSchema(schema);

            expect(() => parse({ a: 123, b: 7 })).toThrow();
            // Could further assert instance of ZodError if needed
        });
    });

    describe("handleError", () => {
        let svc: ValidationService;
        let res: any;

        beforeEach(() => {
            svc = new ValidationService();
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            jest.spyOn(console, "error").mockImplementation(() => undefined);
        });

        it("responds 400 with messages for ZodError", () => {
            // Generate a real ZodError
            const schema = z.object({ x: z.string() });
            let zErr!: ZodError;
            try {
                schema.parse({ x: 5 });
            } catch (error: unknown) {
                if (error instanceof ZodError) {
                    zErr = error;
                } else {
                    // rethrow non-Zod errors so tests don’t silently swallow them
                    throw error;
                }
            }

            svc.handleError(res, zErr);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                data: null,
                message: expect.arrayContaining([{ message: expect.stringMatching(/^x is /) }]),
            });
        });

        it("logs and responds 500 for non‐Zod errors", () => {
            const err = new Error("oops");
            svc.handleError(res, err);

            expect(console.error).toHaveBeenCalledWith("Unexpected validation error:", err);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                data: null,
                message: "Internal server error",
            });
        });
    });
});
