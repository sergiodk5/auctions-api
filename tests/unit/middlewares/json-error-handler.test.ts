import jsonErrorHandler from "@/middlewares/json-error-handler";
import "reflect-metadata";

describe("jsonErrorHandler", () => {
    let req: any;
    let res: any;
    let next: jest.Mock;
    const err = new Error("Something went wrong");

    beforeEach(() => {
        // Spy on console.log and suppress actual output
        jest.spyOn(console, "log").mockImplementation(() => undefined);

        // Minimal req/res/next mocks
        req = { path: "/test-path" } as any;
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("logs the path and error, and sends a 500 with the error object", async () => {
        // Cast to the ErrorRequestHandler signature
        const handler = jsonErrorHandler;

        await handler(err, req, res, next);

        // console.log should be called with "PATH /test-path" and the error
        expect(console.log).toHaveBeenCalledWith(`PATH ${req.path}`, err);

        // Response status should be 500
        expect(res.status).toHaveBeenCalledWith(500);

        // Response send should include the error object
        expect(res.send).toHaveBeenCalledWith({ error: err });

        // Next should not be called
        expect(next).not.toHaveBeenCalled();
    });
});
