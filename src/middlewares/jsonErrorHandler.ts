import { ErrorRequestHandler } from "express-serve-static-core";

const jsonErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.log(`PATH ${req.path}`, err);
    res.status(500).send({ error: err });
};

export default jsonErrorHandler;
