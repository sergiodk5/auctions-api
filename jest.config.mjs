import { pathsToModuleNameMapper } from "ts-jest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { compilerOptions } = require("./tsconfig.json");

export default {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    testRegex: "((\\.|/)(test|spec))\\.tsx?$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    modulePaths: [compilerOptions.baseUrl],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>" }),
    projects: [
        {
            displayName: "unit",
            preset: "ts-jest",
            testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
            testEnvironment: "node",
            transform: {
                "^.+\\.tsx?$": "ts-jest",
            },
            moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
            modulePaths: [compilerOptions.baseUrl],
            moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>" }),
        },
        {
            displayName: "integration",
            preset: "ts-jest",
            testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
            testEnvironment: "node",
            transform: {
                "^.+\\.tsx?$": "ts-jest",
            },
            moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
            modulePaths: [compilerOptions.baseUrl],
            moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>" }),
            setupFilesAfterEnv: ["<rootDir>/tests/setup/integration.setup.ts"],
            testTimeout: 30000,
        },
    ],
    // Default config for when running all tests
    collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
        "!src/**/*.d.ts",
        "!src/**/index.ts",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html"],
};
