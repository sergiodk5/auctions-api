import express from "express";

const productRoutes = express.Router();

// Define product routes
productRoutes.get("/", (_req, res) => {
    res.send("Get all products");
});

productRoutes.post("/", (_req, res) => {
    res.send("Create a new product");
});

productRoutes.get("/:id", (req, res) => {
    res.send(`Get product with ID: ${req.params.id}`);
});

productRoutes.put("/:id", (req, res) => {
    res.send(`Update product with ID: ${req.params.id}`);
});

productRoutes.delete("/:id", (req, res) => {
    res.send(`Delete product with ID: ${req.params.id}`);
});

export default productRoutes;
