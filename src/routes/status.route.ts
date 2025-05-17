import express from "express";

const statusRoute = express.Router();

statusRoute.get("/", (_req, res, _next) => {
    res.status(200).json({ status: "healthy" });
});

export default statusRoute;
