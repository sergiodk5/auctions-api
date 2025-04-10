import express from "express";

const router = express.Router();

// Define product routes
router.get("/", (_req, res) => {
    res.send("Get all products");
});

router.post("/", (_req, res) => {
    res.send("Create a new product");
});

router.get("/:id", (req, res) => {
    res.send(`Get product with ID: ${req.params.id}`);
});

router.put("/:id", (req, res) => {
    res.send(`Update product with ID: ${req.params.id}`);
});

router.delete("/:id", (req, res) => {
    res.send(`Delete product with ID: ${req.params.id}`);
});

export default router;