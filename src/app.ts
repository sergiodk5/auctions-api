import "reflect-metadata";
import authRouter from "@/routes/auth.routes";
import productRoutes from "@/routes/product.routes";
import userRoutes from "@/routes/user.routes";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import statusRoutes from "@/routes/status.routes";
import jsonErrorHandler from "@/middlewares/jsonErrorHandler";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ credentials: true }));
app.use(cookieParser());

app.use("/status", statusRoutes);
app.use("/auth", authRouter);
app.use("/products", productRoutes);
app.use("/users", userRoutes);

app.use(jsonErrorHandler);

export default app;
