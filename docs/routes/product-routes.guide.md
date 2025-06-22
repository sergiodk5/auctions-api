# Product Routes Guide

## Overview

Product routes demonstrate a typical resource-based API implementation with full RBAC integration. These routes serve as an example of how to implement domain-specific resources using the established patterns for authentication, authorization, and validation.

## Route Structure

### Product Router Setup

```typescript
// src/routes/product.route.ts
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
```

## Product CRUD Operations

### List Products

```typescript
// GET /api/v1/products
productRoute.get("/", authorizationMiddleware.requirePermissions(["product:read"]), (_req, res) => {
    res.send("Get all products");
});
```

**Purpose**: Retrieve all products
**Authentication**: Required
**Authorization**: `product:read` permission
**Implementation Status**: Placeholder (returns mock response)

**Query Parameters** (future implementation):

```typescript
?page=1&limit=10          // Pagination
?category=electronics     // Filter by category
?search=laptop           // Search in product names/descriptions
?sort=price&order=asc    // Sorting options
```

**Response** (future implementation):

```typescript
// Success (200 OK)
{
    success: true,
    message: "Products retrieved successfully",
    data: [
        {
            id: number,
            name: string,
            description: string,
            price: number,
            category: string,
            sku: string,
            inStock: boolean,
            stockQuantity: number,
            createdAt: string,
            updatedAt: string
        }
    ],
    pagination: {
        page: number,
        limit: number,
        total: number,
        pages: number
    }
}
```

### Create Product

```typescript
// POST /api/v1/products
productRoute.post("/", authorizationMiddleware.requirePermissions(["product:create"]), (_req, res) => {
    res.send("Create a new product");
});
```

**Purpose**: Create a new product
**Authentication**: Required
**Authorization**: `product:create` permission
**Implementation Status**: Placeholder (returns mock response)

**Request Body** (future implementation):

```typescript
{
    name: string; // Product name
    description: string; // Product description
    price: number; // Product price
    category: string; // Product category
    sku: string; // Stock keeping unit (unique)
    stockQuantity: number; // Initial stock quantity
}
```

**Response** (future implementation):

```typescript
// Success (201 Created)
{
    success: true,
    message: "Product created successfully",
    data: {
        id: number,
        name: string,
        description: string,
        price: number,
        category: string,
        sku: string,
        inStock: boolean,
        stockQuantity: number,
        createdAt: string,
        updatedAt: string
    }
}
```

### Get Product by ID

```typescript
// GET /api/v1/products/:id
productRoute.get("/:id", authorizationMiddleware.requirePermissions(["product:read"]), (req, res) => {
    res.send(`Get product with ID: ${req.params.id}`);
});
```

**Purpose**: Retrieve specific product by ID
**Authentication**: Required
**Authorization**: `product:read` permission
**Implementation Status**: Placeholder (returns mock response with ID)

**Path Parameters**:

- `id`: Product ID (integer)

### Update Product

```typescript
// PUT /api/v1/products/:id
productRoute.put("/:id", authorizationMiddleware.requirePermissions(["product:update"]), (req, res) => {
    res.send(`Update product with ID: ${req.params.id}`);
});
```

**Purpose**: Update existing product
**Authentication**: Required
**Authorization**: `product:update` permission
**Implementation Status**: Placeholder (returns mock response with ID)

**Path Parameters**:

- `id`: Product ID (integer)

### Delete Product

```typescript
// DELETE /api/v1/products/:id
productRoute.delete("/:id", authorizationMiddleware.requirePermissions(["product:delete"]), (req, res) => {
    res.send(`Delete product with ID: ${req.params.id}`);
});
```

**Purpose**: Delete product from system
**Authentication**: Required
**Authorization**: `product:delete` permission
**Implementation Status**: Placeholder (returns mock response with ID)

**Path Parameters**:

- `id`: Product ID (integer)

## Required Permissions

The product routes use granular permissions for different operations:

```typescript
// Product permissions (should be created in permission management)
const productPermissions = [
    {
        name: "product:create",
        description: "Create new products",
        category: "product",
    },
    {
        name: "product:read",
        description: "View products",
        category: "product",
    },
    {
        name: "product:update",
        description: "Update existing products",
        category: "product",
    },
    {
        name: "product:delete",
        description: "Delete products",
        category: "product",
    },
];
```

## Implementation Status

**Current State**: The product routes are implemented as placeholders that demonstrate the authorization patterns but do not include:

- Product controller implementation
- Product service layer
- Product repository
- Product database schema
- Product validation schemas
- Actual business logic

**What's Implemented**:

- ✅ Route structure and HTTP methods
- ✅ Authentication middleware integration
- ✅ Authorization middleware with granular permissions
- ✅ RESTful URL patterns
- ✅ Dependency injection pattern

**What's Missing**:

- ❌ Product controller and service
- ❌ Database schema and repository
- ❌ Request/response validation
- ❌ Business logic implementation
- ❌ Error handling
- ❌ Unit and integration tests

## Full Implementation Guide

### Step 1: Database Schema

```typescript
// src/db/products.schema.ts
export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
```

### Step 2: Validation Schemas

```typescript
// src/db/product-validation.schema.ts
import { z } from "zod";
import { insertProductSchema } from "./products.schema";

export const createProductRouteSchema = z.object({
    body: insertProductSchema.pick({
        name: true,
        description: true,
        price: true,
        category: true,
        sku: true,
        stockQuantity: true,
    }),
    params: z.object({}),
    query: z.object({}),
});

export const updateProductRouteSchema = z.object({
    body: insertProductSchema
        .pick({
            name: true,
            description: true,
            price: true,
            category: true,
            sku: true,
            stockQuantity: true,
        })
        .partial(),
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number"),
    }),
    query: z.object({}),
});
```

### Step 3: Repository Implementation

```typescript
// src/repositories/product.repository.ts
import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/di/types";
import { IDatabaseService } from "@/services/database.service";
import { products, Product, InsertProduct } from "@/db/products.schema";

export interface IProductRepository {
    findAll(): Promise<Product[]>;
    findById(id: number): Promise<Product | null>;
    create(product: InsertProduct): Promise<Product>;
    update(id: number, product: Partial<InsertProduct>): Promise<Product | null>;
    delete(id: number): Promise<boolean>;
    findBySku(sku: string): Promise<Product | null>;
}

@injectable()
export class ProductRepository implements IProductRepository {
    constructor(@inject(TYPES.IDatabaseService) private readonly databaseService: IDatabaseService) {}

    async findAll(): Promise<Product[]> {
        return this.databaseService.db.select().from(products);
    }

    async findById(id: number): Promise<Product | null> {
        const result = await this.databaseService.db.select().from(products).where(eq(products.id, id));
        return result[0] || null;
    }

    async create(product: InsertProduct): Promise<Product> {
        const result = await this.databaseService.db.insert(products).values(product).returning();
        return result[0];
    }

    async update(id: number, product: Partial<InsertProduct>): Promise<Product | null> {
        const result = await this.databaseService.db
            .update(products)
            .set({ ...product, updatedAt: new Date() })
            .where(eq(products.id, id))
            .returning();
        return result[0] || null;
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.databaseService.db.delete(products).where(eq(products.id, id)).returning();
        return result.length > 0;
    }

    async findBySku(sku: string): Promise<Product | null> {
        const result = await this.databaseService.db.select().from(products).where(eq(products.sku, sku));
        return result[0] || null;
    }
}
```

### Step 4: Service Implementation

```typescript
// src/services/product.service.ts
import { inject, injectable } from "inversify";
import { TYPES } from "@/di/types";
import { IProductRepository } from "@/repositories/product.repository";
import { Product, InsertProduct } from "@/db/products.schema";

export interface IProductService {
    getAllProducts(): Promise<Product[]>;
    getProductById(id: number): Promise<Product>;
    createProduct(productData: InsertProduct): Promise<Product>;
    updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product>;
    deleteProduct(id: number): Promise<void>;
}

@injectable()
export class ProductService implements IProductService {
    constructor(@inject(TYPES.IProductRepository) private readonly productRepository: IProductRepository) {}

    async getAllProducts(): Promise<Product[]> {
        return this.productRepository.findAll();
    }

    async getProductById(id: number): Promise<Product> {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new Error("ProductNotFound");
        }
        return product;
    }

    async createProduct(productData: InsertProduct): Promise<Product> {
        // Check if SKU already exists
        const existingProduct = await this.productRepository.findBySku(productData.sku);
        if (existingProduct) {
            throw new Error("ProductSKUExists");
        }

        return this.productRepository.create(productData);
    }

    async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product> {
        // Check if product exists
        const existingProduct = await this.productRepository.findById(id);
        if (!existingProduct) {
            throw new Error("ProductNotFound");
        }

        // Check if SKU is being updated and if it conflicts
        if (productData.sku && productData.sku !== existingProduct.sku) {
            const skuConflict = await this.productRepository.findBySku(productData.sku);
            if (skuConflict) {
                throw new Error("ProductSKUExists");
            }
        }

        const updatedProduct = await this.productRepository.update(id, productData);
        if (!updatedProduct) {
            throw new Error("ProductUpdateFailed");
        }

        return updatedProduct;
    }

    async deleteProduct(id: number): Promise<void> {
        const deleted = await this.productRepository.delete(id);
        if (!deleted) {
            throw new Error("ProductNotFound");
        }
    }
}
```

### Step 5: Controller Implementation

```typescript
// src/controllers/product.controller.ts
import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/di/types";
import { IProductService } from "@/services/product.service";

export interface IProductController {
    getAllProducts(req: Request, res: Response): Promise<void>;
    getProductById(req: Request, res: Response): Promise<void>;
    createProduct(req: Request, res: Response): Promise<void>;
    updateProduct(req: Request, res: Response): Promise<void>;
    deleteProduct(req: Request, res: Response): Promise<void>;
}

@injectable()
export class ProductController implements IProductController {
    constructor(@inject(TYPES.IProductService) private readonly productService: IProductService) {}

    async getAllProducts(req: Request, res: Response): Promise<void> {
        try {
            const products = await this.productService.getAllProducts();
            res.json({
                success: true,
                message: "Products retrieved successfully",
                data: products,
            });
        } catch (error) {
            this.handleServiceError(error, res);
        }
    }

    async getProductById(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid product ID",
                });
                return;
            }

            const product = await this.productService.getProductById(id);
            res.json({
                success: true,
                message: "Product retrieved successfully",
                data: product,
            });
        } catch (error) {
            this.handleServiceError(error, res);
        }
    }

    async createProduct(req: Request, res: Response): Promise<void> {
        try {
            const productData = req.body.cleanBody.body;
            const product = await this.productService.createProduct(productData);

            res.status(201).json({
                success: true,
                message: "Product created successfully",
                data: product,
            });
        } catch (error) {
            this.handleServiceError(error, res);
        }
    }

    async updateProduct(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid product ID",
                });
                return;
            }

            const productData = req.body.cleanBody.body;
            const product = await this.productService.updateProduct(id, productData);

            res.json({
                success: true,
                message: "Product updated successfully",
                data: product,
            });
        } catch (error) {
            this.handleServiceError(error, res);
        }
    }

    async deleteProduct(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid product ID",
                });
                return;
            }

            await this.productService.deleteProduct(id);
            res.status(204).send();
        } catch (error) {
            this.handleServiceError(error, res);
        }
    }

    private handleServiceError(error: unknown, res: Response): void {
        if (!(error instanceof Error)) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
            return;
        }

        switch (error.message) {
            case "ProductNotFound":
                res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
                break;
            case "ProductSKUExists":
                res.status(409).json({
                    success: false,
                    message: "Product SKU already exists",
                });
                break;
            default:
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
        }
    }
}
```

### Step 6: Updated Routes with Full Implementation

```typescript
// src/routes/product.route.ts (updated)
import { IProductController } from "@/controllers/product.controller";
import { createProductRouteSchema, updateProductRouteSchema } from "@/db/product-validation.schema";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IAuthorizationMiddleware } from "@/middlewares/authorization.middleware";
import { IValidationMiddleware } from "@/middlewares/validation.middleware";
import express from "express";

const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const productController = container.get<IProductController>(TYPES.IProductController);

const productRoute = express.Router();

// Apply authentication to all product routes
productRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));

// GET / - List all products
productRoute.get(
    "/",
    authorizationMiddleware.requirePermissions(["product:read"]),
    productController.getAllProducts.bind(productController),
);

// POST / - Create new product
productRoute.post(
    "/",
    authorizationMiddleware.requirePermissions(["product:create"]),
    validationMiddleware.validate(createProductRouteSchema),
    productController.createProduct.bind(productController),
);

// GET /:id - Get product by ID
productRoute.get(
    "/:id",
    authorizationMiddleware.requirePermissions(["product:read"]),
    productController.getProductById.bind(productController),
);

// PUT /:id - Update product
productRoute.put(
    "/:id",
    authorizationMiddleware.requirePermissions(["product:update"]),
    validationMiddleware.validate(updateProductRouteSchema),
    productController.updateProduct.bind(productController),
);

// DELETE /:id - Delete product
productRoute.delete(
    "/:id",
    authorizationMiddleware.requirePermissions(["product:delete"]),
    productController.deleteProduct.bind(productController),
);

export default productRoute;
```

## Testing Product Routes

### Integration Test Example

```typescript
// tests/integration/routes/product.route.test.ts
describe("Product Routes", () => {
    let adminToken: string;
    let userToken: string;

    beforeEach(async () => {
        await clearDatabase();
        await seedDefaultRoles();
        await seedProductPermissions();

        const admin = await createTestUser({
            email: "admin@example.com",
            roles: ["admin"],
        });
        adminToken = await getTokenForUser(admin.id);

        const user = await createTestUser({
            email: "user@example.com",
        });
        userToken = await getTokenForUser(user.id);
    });

    describe("GET /api/v1/products", () => {
        it("should require authentication", async () => {
            const response = await request(app).get("/api/v1/products");
            expect(response.status).toBe(401);
        });

        it("should require product:read permission", async () => {
            const response = await request(app).get("/api/v1/products").set("Authorization", `Bearer ${userToken}`);
            expect(response.status).toBe(403);
        });

        it("should return products for authorized user", async () => {
            const response = await request(app).get("/api/v1/products").set("Authorization", `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
        });
    });
});
```

## Security Considerations

### Permission-Based Access

Each product operation requires specific permissions:

- `product:create` - Create new products
- `product:read` - View products
- `product:update` - Modify existing products
- `product:delete` - Remove products

### Input Validation

When fully implemented, all product routes should:

- Validate request parameters and body data
- Sanitize inputs to prevent XSS and injection attacks
- Enforce business rules (e.g., price must be positive)
- Check for unique constraints (e.g., SKU uniqueness)

### Data Protection

- Sensitive product information should be protected appropriately
- Price and inventory data should have additional access controls
- Product deletion should be logged for audit purposes

## Best Practices

### Route Design

1. **RESTful URLs**: Follow standard REST conventions
2. **Granular Permissions**: Use specific permissions for each operation
3. **Validation**: Validate all input data using schemas
4. **Error Handling**: Provide meaningful error responses
5. **Status Codes**: Use appropriate HTTP status codes

### Implementation

1. **Layer Separation**: Maintain clear separation between routes, controllers, services, and repositories
2. **Dependency Injection**: Use DI container for all dependencies
3. **Error Boundaries**: Handle errors at appropriate layers
4. **Type Safety**: Use TypeScript interfaces and types throughout

### Testing

1. **Integration Tests**: Test complete request/response flows
2. **Authorization Tests**: Verify permission requirements
3. **Validation Tests**: Test input validation and error cases
4. **Business Logic Tests**: Test service layer logic

## Related Documentation

- [Product Controller Guide](../controllers/product-controller.guide.md) (when implemented)
- [Product Service Guide](../services/product-service.guide.md) (when implemented)
- [Product Repository Guide](../repositories/product-repository.guide.md) (when implemented)
- [Authorization Middleware Guide](../middlewares/authorization-middleware.guide.md)
- [Main Routes Guide](./routes.guide.md)
