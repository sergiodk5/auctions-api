import authRouter from "@/routes/auth";
import productRoutes from "@/routes/product";
import userRoutes from "@/routes/user";
import cors from "cors";
import express, { Request, Response } from "express";

const app = express();

app.use(cors({
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req: Request, res: Response) => {
    res.send("Hello World");
});

app.use("/auth", authRouter);
app.use("/products", productRoutes);
app.use("/users", userRoutes);

export default app;