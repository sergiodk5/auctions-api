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
- **Reference dependency injection documentation** - Use `docs/di/container.guide.md` for proper container setup, service bindings, and injection patterns. Use `docs/di/types.guide.md` for TYPES symbol registry usage and naming conventions.
- **Use centralized error handling middleware and structured responses.**
- **Use Drizzle ORM for database operations with proper schema definitions.**
- **Implement caching with Redis where appropriate.**
- **Format code with Prettier and enforce standards with ESLint.**
- **Follow namespace-based organization** for controllers and routes by domain/feature.
- **Use consistent API conventions** with RESTful endpoints and proper HTTP status codes.
- **Implement proper error handling** with structured error responses and logging.
- **Always use the centralized environment configuration** - Import environment variables from `@/config/env` instead of accessing `process.env` directly. See `docs/config/env.guide.md` for comprehensive usage examples.
- **Always use dependency injection properly** - Use the Inversify container with `@injectable()` and `@inject()` decorators. Reference `docs/di/container.guide.md` for container setup and usage patterns, and `docs/di/types.guide.md` for proper TYPES symbol usage and naming conventions.
- **Always use utility functions for common operations** - Use existing utilities from `@/utils/` for common operations like password hashing. Reference `docs/utils/utils.guide.md` for available utilities, usage patterns, and guidelines for adding new utilities.
- **Always follow repository patterns** - Use the established repository patterns for data access. Reference `docs/repositories/repositories.guide.md` for comprehensive repository usage, testing patterns, and best practices. See specific guides for `user-repository.guide.md`, `token-repository.guide.md`, and `rbac-repositories.guide.md`.
- **Always follow service layer patterns** - Implement business logic in services using proper dependency injection and interface-based design. Reference `docs/services/services.guide.md` for comprehensive service patterns and best practices. See specific guides for `authentication-service.guide.md`, `authorization-service.guide.md`, `user-service.guide.md`, and `infrastructure-services.guide.md`.
- **Always follow controller layer patterns** - Implement HTTP request/response handling in controllers using proper error handling and response formatting. Reference `docs/controllers/controllers.guide.md` for comprehensive controller patterns and best practices. See specific guides for `auth-controller.guide.md` and `users-controller.guide.md`.
- **Always follow middleware layer patterns** - Implement cross-cutting concerns using proper middleware patterns for authentication, authorization, validation, and rate limiting. Reference `docs/middlewares/middlewares.guide.md` for comprehensive middleware patterns and best practices. See specific guides for `authentication-middleware.guide.md`, `authorization-middleware.guide.md`, `validation-middleware.guide.md`, `refresh-token-guard-middleware.guide.md`, and `rate-limiting-middleware.guide.md`.
- **Always follow route layer patterns** - Implement HTTP endpoints using proper REST conventions, middleware orchestration, and dependency injection. Reference `docs/routes/routes.guide.md` for comprehensive route patterns and best practices. See specific guides for `authentication-routes.guide.md`, `user-routes.guide.md`, `role-routes.guide.md`, `permission-routes.guide.md`, `product-routes.guide.md`, and `status-routes.guide.md`.
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
    logger.service.ts
  repositories/
    user.repository.ts
    permission.repository.ts
    role.repository.ts
  adapters/
    winston-transport.adapter.ts
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
- **Follow established service patterns** - Implement business logic using the service layer patterns documented in `docs/services/`. Use dependency injection, implement clear interfaces, and follow separation of concerns between controllers, services, and repositories.
- **Use infrastructure services properly** - Leverage DatabaseService, CacheService, LoggerService, MailerService, and ValidationService following the patterns in `docs/services/infrastructure-services.guide.md`.
- **Use proper logging patterns** - Always inject and use the LoggerService for all logging needs. Never use console.log/error/warn/info/debug directly. Use appropriate log levels (error, warn, info, debug) with structured metadata. Reference `docs/services/logger-service.guide.md` for comprehensive usage patterns.
- **Follow adapter patterns** - Use adapter pattern for external dependencies like logging libraries. Reference `docs/adapters/logger-adapter.guide.md` for implementing adapters that abstract external library dependencies.
- **Implement RBAC (Role-Based Access Control)** using the authorization middleware.
- **Follow namespace-based API organization** for logical grouping of endpoints.
- **Use action-based service classes** for specific use cases (CreateUser, DeletePost, etc.).
- **Implement proper HTTP status codes** for different response scenarios.
- **Use consistent error handling** with structured error responses.
- **Use existing utility functions** for common operations like password hashing, string manipulation, and data processing.
- **Follow established repository patterns** for data access, caching, and testing. Use dependency injection, implement proper interfaces, and follow the established patterns for security and performance.
- **Follow established middleware patterns** - Implement cross-cutting concerns using proper middleware patterns documented in `docs/middlewares/`. Use authentication middleware for token validation, authorization middleware for permission checking, validation middleware for input sanitization, and rate limiting middleware for abuse prevention.
- **Use middleware chaining properly** - Apply middleware in the correct order: rate limiting → validation → authentication → authorization → controller. Reference `docs/middlewares/middlewares.guide.md` for proper middleware ordering and usage patterns.
- **Follow established route patterns** - Implement HTTP endpoints using proper REST conventions, middleware orchestration, and dependency injection patterns documented in `docs/routes/`. Use consistent URL patterns, appropriate HTTP methods, proper middleware chains, and standardized response formats. Reference specific route guides for authentication, user management, RBAC, and resource endpoints.

## 🚫 Patterns to Avoid

- **Don't put business logic directly in route handlers** - use controllers and services following the established patterns in `docs/services/services.guide.md` and `docs/controllers/controllers.guide.md`.
- **Avoid using `any` or `// @ts-ignore`** — always type inputs and outputs properly.
- **Don't bypass the dependency injection container** - always use `@inject()`.
- **Don't hardcode values** — pull from config or env vars.
- **Avoid direct database queries** - use Drizzle ORM through repositories following established patterns.
- **Don't skip authentication/authorization checks** on protected routes.
- **Avoid mixing database access patterns** - stick to Drizzle ORM consistently through repository layer.
- **Never disable ESLint rules in generated code** - fix the underlying issue instead.
- **Use proper logging patterns** - Use the logger service for all logging needs instead of console.log/console.error. Inject the logger service through dependency injection and use appropriate log levels (error, warn, info, debug, etc.) with structured metadata.
- **Avoid constructors in service classes** - use dependency injection instead following patterns in `docs/services/services.guide.md`.
- **Don't create monolithic services** - prefer smaller, focused service classes as documented in service guides.
- **Don't mix infrastructure concerns with business logic** - use dedicated infrastructure services (DatabaseService, CacheService, etc.) rather than handling these concerns in business services.
- **Don't handle business logic in controllers** - controllers should focus on HTTP concerns (request/response handling, status codes, error mapping) while delegating business logic to services as documented in `docs/controllers/controllers.guide.md`.
- **Don't implement security logic in controllers** - use proper middleware patterns for authentication, authorization, validation, and rate limiting as documented in `docs/middlewares/middlewares.guide.md`.
- **Avoid bypassing middleware chains** - don't skip authentication, authorization, or validation middleware on protected routes.
- **Don't create middleware without proper error handling** - all middleware must handle errors gracefully and return appropriate HTTP status codes.
- **Don't put business logic in route handlers** - routes should only orchestrate middleware and delegate to controllers. Follow patterns in `docs/routes/routes.guide.md` for proper separation of concerns.
- **Avoid inconsistent REST patterns** - use consistent HTTP methods, status codes, and URL patterns across all endpoints as documented in route guides.
- **Don't skip validation on route endpoints** - all routes that accept input should use validation middleware with appropriate schemas.
- **Avoid mixing authentication patterns** - use consistent authentication and authorization patterns across all protected routes.
- **Avoid callback patterns** - use async/await consistently.

## 📚 Documentation Guidelines

- **Always update API documentation when creating or modifying endpoints** - Update `docs/openapi.yaml` with the correct paths, request/response schemas, and examples.
- **Maintain consistency across all documentation** - Ensure `README.md`, `docs/openapi.md`, and `docs/openapi.yaml` all reflect the same endpoint patterns and functionality.
- **Use proper API versioning in documentation** - All endpoints must use the `/api/v1/` prefix pattern consistently across all documentation files.
- **Update examples and usage instructions** - When changing endpoints, update all curl examples, code samples, and usage instructions in documentation.
- **Document authentication requirements** - Clearly mark protected endpoints and include authentication examples in documentation.
- **Keep OpenAPI schemas current** - Ensure all request/response schemas in `docs/openapi.yaml` match the actual implementation and Zod validation schemas.
- **Update README API sections** - When adding new features or endpoints, update the corresponding sections in `README.md` with proper descriptions and usage examples.
- **Follow database schema documentation** - Reference the comprehensive guides in `docs/db/` for proper database usage patterns, validation schemas, and seeding procedures. See `docs/db/schema.guide.md` for the overview and specific guides for each schema file.
