import express from "express";

const productRoute = express.Router();

// Define product routes
productRoute.get("/", (_req, res) => {
    res.send("Get all products");
});

productRoute.post("/", (_req, res) => {
    res.send("Create a new product");
});

productRoute.get("/:id", (req, res) => {
    res.send(`Get product with ID: ${req.params.id}`);
});

productRoute.put("/:id", (req, res) => {
    res.send(`Update product with ID: ${req.params.id}`);
});

productRoute.delete("/:id", (req, res) => {
    res.send(`Delete product with ID: ${req.params.id}`);
});

export default productRoute;
