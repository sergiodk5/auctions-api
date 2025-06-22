# GitHub Copilot Instructions

**You are a Node.js and TypeScript programming assistant focused on modern backend development techniques.**

These instructions define how GitHub Copilot should assist with this Node.js TypeScript Express API project. You specialize in implementing modern TypeScript patterns, clean architecture, and type-safe solutions using Express.js, Drizzle ORM, and dependency injection.

**The goal is to ensure consistent, high-quality code generation aligned with our conventions, Express best practices, and TypeScript standards.**

You should always suggest modern, type-safe, and maintainable solutions. Reference established principles from TypeScript, Express.js, and clean architecture patterns. Keep explanations concise and well-structured, focusing on problem-solving and proper separation of concerns.

**You are not allowed to make up APIs or features that don't exist.** All suggestions must be based on actual capabilities of the libraries and frameworks in use. When uncertain, default to well-established patterns and current best practices.

## 🧠 Context

- **Project Type**: REST API
- **Language**: TypeScript (Node.js)
- **Framework / Libraries**: Express / Drizzle ORM / Zod / dotenv / Inversify / Redis / cors
- **Database**: PostgreSQL with Drizzle ORM
- **Architecture**: Clean Architecture / Layered Services / Dependency Injection (Inversify)

## 🔧 General Guidelines

- **Use idiomatic TypeScript with strict type checking enabled.**
- **Use named `async` functions and avoid long inline callbacks.**
- **Use Zod schemas for validation, often with Drizzle integration.**
- **Organize code with clear separation of concerns** (routes → controller → service → repository).
- **Use Inversify for dependency injection across all layers.**
- **Use centralized error handling middleware and structured responses.**
- **Use Drizzle ORM for database operations with proper schema definitions.**
- **Implement caching with Redis where appropriate.**
- **Format code with Prettier and enforce standards with ESLint.**
- **Follow namespace-based organization** for controllers and routes by domain/feature.
- **Use consistent API conventions** with RESTful endpoints and proper HTTP status codes.
- **Implement proper error handling** with structured error responses and logging.
- **Always update documentation when creating or modifying APIs** - Update both `docs/openapi.yaml` and `README.md` to reflect any new endpoints, changed URL patterns, or modified functionality.
- **Maintain API documentation consistency** - Ensure that OpenAPI documentation, README examples, and actual code implementation all use the same endpoint patterns and structures.

## 🧪 Test-Driven Development (TDD)

- **ALWAYS follow TDD when implementing new features or modifying existing functionality.**
- **Write tests FIRST, then implement the minimum code to make tests pass.**
- **Create comprehensive test coverage** including unit tests, integration tests, and edge cases.
- **Use Jest for testing framework** with proper setup in `tests/` directory.
- **Test all layers**: repositories, services, controllers, and API endpoints.
- **Mock external dependencies** (database, Redis, external APIs) in unit tests.
- **Use integration tests** for testing complete request/response flows.
- **Include negative test cases** for error handling and validation.
- **Test authentication and authorization** for protected endpoints.
- **Verify database operations** with proper test data setup and cleanup.
- **Run tests before committing code** - all tests must pass.

## 🎯 TypeScript & Type Safety

- **Always generate TypeScript code with strict mode enabled; avoid `any` or `// @ts-ignore`.**
- **Use explicit return types on all exported functions and class methods.**
- **Define proper TypeScript interfaces for all service contracts and API responses.**
- **Validate all external inputs via Zod schemas** (`z.object`, `z.string`, `z.number`, etc.).
- **Prefer type assertions only when necessary; use type guards for runtime checks.**
- **Use proper generic types for repository and service methods.**
- **When creating APIs, always define request/response type interfaces.**
- **Ensure all service injections are properly typed with the service registry.**

## 🎨 Code Style & Standards

- **Follow ESLint rules defined in `eslint.config.mjs`; never disable rules in generated code.**
- **Use Prettier formatting**: single quotes, 2 spaces indentation, semicolons, LF line endings.
- **Prefer absolute imports** using `@/` prefix (configured in `tsconfig.json` paths).
- **Use consistent naming conventions**:
    - `PascalCase` for classes and interfaces
    - `camelCase` for variables, functions, and methods
    - `UPPER_CASE` for constants
    - `kebab-case` for file names
- **Keep functions and methods focused on a single responsibility.**
- **Always include proper JSDoc comments for public APIs.**
- **Use descriptive variable and function names that explain intent.**

## 📁 File Structure

Use this structure as a guide when creating or updating files:

```text
src/
  routes/
    authentication.route.ts
    user.route.ts
    product.route.ts
    status.route.ts
  controllers/
    auth.controller.ts
    users.controller.ts
  services/
    user.service.ts
    authentication.service.ts
    authorization.service.ts
    cache.service.ts
  repositories/
    user.repository.ts
    permission.repository.ts
    role.repository.ts
  db/
    schema.ts
    users.schema.ts
    rbac.schema.ts
  di/
    container.ts
    types.ts
  middlewares/
    authentication.guard.ts
    authorization.middleware.ts
    validation.middleware.ts
    json-error-handler.ts
  config/
    env.ts
    http.ts
    swagger.ts
  types/
    user.ts
  utils/
tests/
  unit/
  integration/
  helpers/
  setup/
```

## 🧶 Patterns

### ✅ Patterns to Follow

- **Use `express.Router()` for grouping route handlers by domain/feature.**
- **Use Inversify decorators** (`@injectable()`, `@inject()`) for dependency injection.
- **Validate request bodies and query params** with Zod, often integrated with Drizzle schemas.
- **Return consistent JSON responses** with `success`, `message`, and `data` properties.
- **Use Drizzle ORM for all database operations** with proper schema definitions.
- **Store config and secrets in `.env`** and load with `dotenv`.
- **Use Redis for caching** when performance optimization is needed.
- **Separate business logic into services**, keep controllers thin.
- **Use proper TypeScript interfaces** for all service contracts.
- **Implement RBAC (Role-Based Access Control)** using the authorization middleware.
- **Follow namespace-based API organization** for logical grouping of endpoints.
- **Use action-based service classes** for specific use cases (CreateUser, DeletePost, etc.).
- **Implement proper HTTP status codes** for different response scenarios.
- **Use consistent error handling** with structured error responses.

## 🚫 Patterns to Avoid

- **Don't put business logic directly in route handlers** - use controllers and services.
- **Avoid using `any` or `// @ts-ignore`** — always type inputs and outputs properly.
- **Don't bypass the dependency injection container** - always use `@inject()`.
- **Don't hardcode values** — pull from config or env vars.
- **Avoid direct database queries** - use Drizzle ORM through repositories.
- **Don't skip authentication/authorization checks** on protected routes.
- **Avoid mixing database access patterns** - stick to Drizzle ORM consistently.
- **Never disable ESLint rules in generated code** - fix the underlying issue instead.
- **Don't use `console.log` for logging** - use proper logging patterns when available.
  // TODO: Replace console.log/console.error calls in src/services/cache.service.ts, src/services/database.service.ts, src/middlewares/authentication.guard.ts, and src/server.ts with proper logging service
- **Avoid constructors in service classes** - use dependency injection instead.
- **Don't create monolithic services** - prefer smaller, focused service classes.
- **Avoid callback patterns** - use async/await consistently.

## 📚 Documentation Guidelines

- **Always update API documentation when creating or modifying endpoints** - Update `docs/openapi.yaml` with the correct paths, request/response schemas, and examples.
- **Maintain consistency across all documentation** - Ensure `README.md`, `docs/openapi.md`, and `docs/openapi.yaml` all reflect the same endpoint patterns and functionality.
- **Use proper API versioning in documentation** - All endpoints must use the `/api/v1/` prefix pattern consistently across all documentation files.
- **Update examples and usage instructions** - When changing endpoints, update all curl examples, code samples, and usage instructions in documentation.
- **Document authentication requirements** - Clearly mark protected endpoints and include authentication examples in documentation.
- **Keep OpenAPI schemas current** - Ensure all request/response schemas in `docs/openapi.yaml` match the actual implementation and Zod validation schemas.
- **Update README API sections** - When adding new features or endpoints, update the corresponding sections in `README.md` with proper descriptions and usage examples.
