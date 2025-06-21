declare namespace Express {
    interface Request {
        validatedBody?: Record<string, unknown>;
    }
}
