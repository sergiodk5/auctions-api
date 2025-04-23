import express from "express";

const statusRoutes = express.Router();

statusRoutes.get("/", (_req, res, _next) => {
    res.status(200).json({ status: "healthy" });
});

export default statusRoutes;