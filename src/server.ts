import "module-alias/register";
import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req: Request, res: Response) => {
    res.send("Hello World");
});

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT.toString()}`);
});
