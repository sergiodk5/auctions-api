/**
 * Authorization Middleware Usage Examples
 *
 * This file demonstrates various ways to use the authorization middleware
 * with different permission and role requirements.
 */

import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IAuthorizationMiddleware } from "@/middlewares/authorization.middleware";
import express from "express";

const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);

const exampleRoute = express.Router();

// Apply authentication to all routes
exampleRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));

// EXAMPLE 1: Single Permission Check
// Requires the user to have 'user:read' permission
exampleRoute.get("/users", authorizationMiddleware.requirePermissions(["user:read"]), (req, res) => {
    res.json({ message: "User has user:read permission" });
});

// EXAMPLE 2: Multiple Permissions (ANY)
// Requires the user to have EITHER 'user:read' OR 'user:update' permission
exampleRoute.get(
    "/users/profile",
    authorizationMiddleware.requirePermissions(["user:read", "user:update"], false), // false = ANY
    (req, res) => {
        res.json({ message: "User has at least one of the required permissions" });
    },
);

// EXAMPLE 3: Multiple Permissions (ALL)
// Requires the user to have BOTH 'user:read' AND 'user:update' permissions
exampleRoute.put(
    "/users/bulk-update",
    authorizationMiddleware.requirePermissions(["user:read", "user:update"], true), // true = ALL
    (req, res) => {
        res.json({ message: "User has all required permissions" });
    },
);

// EXAMPLE 4: Role-Based Check (ANY)
// Requires the user to have EITHER 'admin' OR 'editor' role
exampleRoute.get(
    "/admin/dashboard",
    authorizationMiddleware.requireRoles(["admin", "editor"], false), // false = ANY
    (req, res) => {
        res.json({ message: "User has admin or editor role" });
    },
);

// EXAMPLE 5: Role-Based Check (ALL)
// This is uncommon but requires user to have BOTH roles (if that's possible in your system)
exampleRoute.get(
    "/super-admin",
    authorizationMiddleware.requireRoles(["admin", "super-admin"], true), // true = ALL
    (req, res) => {
        res.json({ message: "User has all required roles" });
    },
);

// EXAMPLE 6: High-Level Action Check
// Uses the authorization service's can() method with action and resource
exampleRoute.delete("/products/:id", authorizationMiddleware.requireAction("delete", "product"), (req, res) => {
    res.json({ message: "User can delete products" });
});

// EXAMPLE 7: Complex Authorization with Multiple Criteria
// Combines permissions, roles, and action checks
exampleRoute.post(
    "/admin/system/backup",
    authorizationMiddleware.createWithOptions({
        permissions: ["system:backup"],
        roles: ["admin"],
        action: "create",
        resource: "system-backup",
        requireAll: true,
    }),
    (req, res) => {
        res.json({ message: "User has complex authorization requirements" });
    },
);

// EXAMPLE 8: Mixed Requirements (permissions OR roles)
// User needs EITHER specific permissions OR specific roles
exampleRoute.get(
    "/reports/financial",
    authorizationMiddleware.createWithOptions({
        permissions: ["report:financial"],
        roles: ["admin", "finance-manager"],
        requireAll: false, // user needs admin OR finance-manager role
    }),
    (req, res) => {
        res.json({ message: "User has either the required permission or role" });
    },
);

// EXAMPLE 9: Resource-Specific Authorization
// Different permissions for different HTTP methods on the same resource
exampleRoute
    .route("/products/:id")
    .get(authorizationMiddleware.requirePermissions(["product:read"]), (req, res) => {
        res.json({ message: "Reading product" });
    })
    .put(authorizationMiddleware.requirePermissions(["product:update"]), (req, res) => {
        res.json({ message: "Updating product" });
    })
    .delete(authorizationMiddleware.requirePermissions(["product:delete"]), (req, res) => {
        res.json({ message: "Deleting product" });
    });

// EXAMPLE 10: Admin Override Pattern
// Uses the authorization service's built-in admin privilege escalation
exampleRoute.get("/admin/any-resource", authorizationMiddleware.requireAction("read", "any-resource"), (req, res) => {
    // This will pass for admin users even if they don't have the specific permission
    // because the authorization service grants admin users all permissions
    res.json({ message: "Admin can access any resource" });
});

export default exampleRoute;

/**
 * PERMISSION PATTERNS IN THE SYSTEM:
 *
 * Based on the seeded data, here are the available permissions:
 * - user:create
 * - user:read
 * - user:update
 * - user:delete
 * - product:create
 * - product:read
 * - product:update
 * - product:delete
 *
 * ROLE ASSIGNMENTS:
 * - admin: ALL permissions
 * - editor: product:*, user:read
 * - client: product:* only
 *
 * USAGE GUIDELINES:
 *
 * 1. Use requirePermissions() for granular permission checks
 * 2. Use requireRoles() when you need role-based access
 * 3. Use requireAction() for high-level action/resource patterns
 * 4. Use createWithOptions() for complex authorization scenarios
 * 5. Admin users automatically have all permissions due to built-in privilege escalation
 * 6. Always apply authentication middleware before authorization middleware
 * 7. The middleware responds with 401 for authentication issues and 403 for authorization issues
 */
