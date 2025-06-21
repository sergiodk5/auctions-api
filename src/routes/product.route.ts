import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IAuthorizationMiddleware } from "@/middlewares/authorization.middleware";
import express from "express";

const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);

const productRoute = express.Router();

// Apply authentication to all product routes
productRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));

// GET / - List all products (requires product:read permission)
productRoute.get("/", authorizationMiddleware.requirePermissions(["product:read"]), (_req, res) => {
    res.send("Get all products");
});

// POST / - Create new product (requires product:create permission)
productRoute.post("/", authorizationMiddleware.requirePermissions(["product:create"]), (_req, res) => {
    res.send("Create a new product");
});

// GET /:id - Get product by ID (requires product:read permission)
productRoute.get("/:id", authorizationMiddleware.requirePermissions(["product:read"]), (req, res) => {
    res.send(`Get product with ID: ${req.params.id}`);
});

// PUT /:id - Update product (requires product:update permission)
productRoute.put("/:id", authorizationMiddleware.requirePermissions(["product:update"]), (req, res) => {
    res.send(`Update product with ID: ${req.params.id}`);
});

// DELETE /:id - Delete product (requires product:delete permission)
productRoute.delete("/:id", authorizationMiddleware.requirePermissions(["product:delete"]), (req, res) => {
    res.send(`Delete product with ID: ${req.params.id}`);
});

export default productRoute;
