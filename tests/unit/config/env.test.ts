import { getEnv } from "@/config/env";

describe("Environment Variables", () => {
    it("should return a value from the env", () => {
        const PORT = getEnv("PORT", "8090");
        expect(PORT).toBe("8090");
    });

    it("should return a default value if the variable is not defined", () => {
        const defaultValue = "default_value";
        const result = getEnv("NON_EXISTENT_VARIABLE", defaultValue);
        expect(result).toBe(defaultValue);
    });

    it("should throw an error if the variable is not defined and no default value is provided", () => {
        expect(() => {
            // @ts-expect-error: Testing error case
            getEnv("NON_EXISTENT_VARIABLE");
        }).toThrow("Environment variable NON_EXISTENT_VARIABLE is not defined");
    });
});
