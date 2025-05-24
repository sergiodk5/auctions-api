import swaggerSpec from "@/config/swagger";

describe("OpenAPI Specification", () => {
    it("should have valid OpenAPI spec", () => {
        expect(swaggerSpec).toBeDefined();
        expect(swaggerSpec.openapi).toBe("3.1.0");
        expect(swaggerSpec.info).toBeDefined();
        expect(swaggerSpec.info.title).toBe("Auctions API");
        expect(swaggerSpec.info.version).toBe("1.0.0");
    });

    it("should have required security schemes", () => {
        expect(swaggerSpec.components?.securitySchemes).toBeDefined();
        expect(swaggerSpec.components?.securitySchemes?.bearerAuth).toBeDefined();
        expect(swaggerSpec.components?.securitySchemes?.cookieAuth).toBeDefined();
    });

    it("should have required schemas", () => {
        const schemas = swaggerSpec.components?.schemas;
        expect(schemas).toBeDefined();
        expect(schemas?.User).toBeDefined();
        expect(schemas?.CreateUser).toBeDefined();
        expect(schemas?.UpdateUser).toBeDefined();
        expect(schemas?.LoginRequest).toBeDefined();
        expect(schemas?.AuthResponse).toBeDefined();
        expect(schemas?.ApiResponse).toBeDefined();
        expect(schemas?.ErrorResponse).toBeDefined();
        expect(schemas?.HealthStatus).toBeDefined();
    });

    it("should have required tags", () => {
        expect(swaggerSpec.tags).toBeDefined();
        expect(swaggerSpec.tags).toHaveLength(4);

        const tagNames = swaggerSpec.tags?.map((tag: { name: string }) => tag.name) as string[];
        expect(tagNames).toContain("Authentication");
        expect(tagNames).toContain("Users");
        expect(tagNames).toContain("Products");
        expect(tagNames).toContain("System");
    });

    it("should have development and production servers", () => {
        expect(swaggerSpec.servers).toBeDefined();
        expect(swaggerSpec.servers).toHaveLength(2);

        const serverUrls = swaggerSpec.servers?.map((server: { url: string }) => server.url) as string[];
        expect(serverUrls).toContain("http://localhost:8090");
        expect(serverUrls).toContain("https://api.auctions.com");
    });

    it("should have paths documented", () => {
        expect(swaggerSpec.paths).toBeDefined();
        expect(Object.keys(swaggerSpec.paths ?? {}).length).toBeGreaterThan(0);
    });
});
