import { Request, Response, NextFunction } from "express";

export default interface IMiddleware {
    handle(req: Request, res: Response, next: NextFunction): Promise<void> | void;
}
