import productRoutes from "@/routes/product";
import cors from "cors";
import express, { Request, Response } from "express";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req: Request, res: Response) => {
    res.send("Hello World");
});

app.use("/products", productRoutes);

export default app;