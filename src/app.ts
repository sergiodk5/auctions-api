import { setupSwagger } from "@/config/swagger";
import jsonErrorHandler from "@/middlewares/json-error-handler";
import authRoute from "@/routes/auth.route";
import productRoute from "@/routes/product.route";
import statusRoute from "@/routes/status.route";
import userRoute from "@/routes/user.route";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import "reflect-metadata";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ credentials: true }));
app.use(cookieParser());

// Setup Swagger documentation
setupSwagger(app);

app.use("/status", statusRoute);
app.use("/auth", authRoute);
app.use("/products", productRoute);
app.use("/users", userRoute);

app.use(jsonErrorHandler);

export default app;
