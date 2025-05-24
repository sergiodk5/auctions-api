import app from "@/app";
import request from "supertest";

describe("Product Routes", () => {
    it("should return the status of the server", async () => {
        const response = await request(app).get("/status");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "healthy" });
    });
});
