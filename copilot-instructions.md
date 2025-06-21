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
- **Avoid constructors in service classes** - use dependency injection instead.
- **Don't create monolithic services** - prefer smaller, focused service classes.
- **Avoid callback patterns** - use async/await consistently.

## 🧪 Testing Guidelines

- **Use `Jest` with ts-jest preset** for unit and integration tests.
- **Use `supertest` for HTTP layer testing** and endpoint validation.
- **Use separate test databases** with Docker Compose for integration tests.
- **Mock services and repositories** using Jest mocks to isolate controller behavior.
- **Test both positive and negative cases** for all business logic and validation.
- **Test Drizzle schemas and validation** with both valid/invalid input cases.
- **Use the existing test helpers** and setup utilities in `/tests/helpers/`.
- **Run tests with proper npm scripts**: `npm run test`, `npm run test:unit`, or `npm run test:integration`.
- **Ensure tests run sequentially** (`--runInBand`) for database consistency.
- **Aim for high test coverage (>85%)** with meaningful assertions, not just coverage metrics.
- **Include error handling tests** to verify proper error responses and logging.
- **Test authentication and authorization** scenarios with different user roles.
- **Mock external services** (Redis, email, etc.) in unit tests.

## 🚀 Quality & CI/CD Guidelines

- All generated code must pass: `npm run lint:fix`, `npm run type-check`, and `npm run test`.
- Use `npm run test:coverage` to verify test coverage before committing.
- Ensure integration tests use the test database setup (Docker Compose).
- New features should include corresponding tests (unit + integration where applicable).
- Follow the existing error handling patterns and middleware structure.
- Use Conventional Commits format for all commit messages (enforced by commitlint).

## 📝 Commit Message Standards

- Follow Conventional Commits specification: `type(scope): description`
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`
- **Examples**:
    - `feat: add user authentication endpoint`
    - `fix: resolve database connection timeout issue`
    - `docs: update API documentation for user routes`
    - `test: add unit tests for user service`
    - `refactor: improve error handling in auth middleware`
- **Rules**:
    - Subject line max 60 characters
    - Use lowercase for subject (except proper nouns)
    - No period at the end of subject line
    - Use imperative mood ("add" not "added" or "adds")

## 🎯 Development Workflow Guidelines

### Code Quality Standards

- **Follow existing architectural patterns** for new features and endpoints
- **Maintain namespace consistency** across controllers, services, and routes
- **Use established error handling patterns** with proper HTTP status codes
- **Write comprehensive tests** following existing patterns for new functionality
- **Maintain strict TypeScript usage** with proper type hints and interfaces
- **Update API documentation** when adding new endpoints or modifying existing ones

### When Working with This Codebase

1. **Follow established patterns**: Use the existing architectural patterns for new features
2. **Type safety first**: Maintain strict TypeScript usage throughout all layers
3. **Testing discipline**: Write tests for new functionality following existing patterns
4. **Documentation**: Keep API documentation current and accurate
5. **Error handling**: Use consistent error handling patterns with proper logging
6. **Security**: Implement proper authentication/authorization for all protected endpoints
7. **Performance**: Consider caching strategies and database query optimization
8. **Consistency**: Ensure new code follows established naming and organization conventions

## 🔍 Finding Components and APIs

### Locating existing patterns by functionality

When asked to implement common backend patterns, first check existing implementations in the codebase:

- **Authentication**: Look in `/src/middlewares/authentication.guard.ts` and `/src/services/authentication.service.ts`
- **Authorization**: Check `/src/middlewares/authorization.middleware.ts` and `/src/services/authorization.service.ts`
- **User management**: Reference `/src/controllers/users.controller.ts` and `/src/services/user.service.ts`
- **Database patterns**: Review existing repositories in `/src/repositories/`
- **Validation patterns**: Check existing Zod schemas in schema files

### Providing API interfaces

When asked to provide interfaces for services or controllers, look for TypeScript interfaces in the `.ts` files. Within them, look for:

```typescript
interface ServiceNameInterface {
    methodName(param: Type): Promise<ReturnType>;
    // Define all service contract methods here
}
```

You should provide **all** methods defined in the interface with their complete signatures, including parameter types and return types. If a parameter is optional, mark it with `?` after the parameter name.

### Common service patterns

When asked for common backend patterns, provide these established components:

- **User Authentication**: `/src/services/authentication.service.ts`
- **Role-based Authorization**: `/src/services/authorization.service.ts`
- **Database Operations**: Repository pattern in `/src/repositories/`
- **Caching**: `/src/services/cache.service.ts`
- **Input Validation**: Zod schemas with Drizzle integration
- **Error Handling**: `/src/middlewares/json-error-handler.ts`
- **Action-based Services**: Specific use case handlers (CreateUser, UpdateProfile, etc.)
- **Feature Flags**: Service-based feature flag checking and management
- **API Response Formatting**: Consistent response structure with proper typing

## 🧩 Example Prompts

### Component Creation

- `Copilot, create a POST /users endpoint with Inversify DI that validates the request body with Zod.`
- `Copilot, implement a user controller with @injectable() decorator that delegates to a user service.`
- `Copilot, generate a Drizzle schema for a user table with Zod validation integration.`
- `Copilot, write authentication middleware that uses the authorization service for RBAC.`

### Testing & Quality

- `Copilot, create a Jest unit test for the user controller's createUser function with Inversify mocks.`
- `Copilot, write integration tests for the authentication endpoints using supertest.`
- `Copilot, add error handling tests for the user service with proper assertions.`

### Data & Performance

- `Copilot, implement a repository pattern using Drizzle ORM with proper error handling.`
- `Copilot, add Redis caching to a service method using the cache service.`
- `Copilot, create a database migration for adding email verification to users.`

### Architecture & Patterns

- `Copilot, refactor this service to use dependency injection with proper TypeScript interfaces.`
- `Copilot, implement role-based authorization middleware for admin endpoints.`
- `Copilot, create a standardized API response format with proper TypeScript types.`
- `Copilot, implement feature flag support for controlled feature rollouts.`
- `Copilot, create action-based service classes for specific use cases like CreateUser or UpdateProfile.`
- `Copilot, implement namespace-based API organization for better endpoint grouping.`

## 🔁 Iteration & Review

- **Review Copilot output with Prettier and ESLint** before committing.
- **Use comments to guide Copilot** when generating controller logic or complex validation.
- **Refactor repeated logic** into shared utilities or services.
- **Validate schema contracts and function signatures** with type checking.
- **Ensure all new services are properly registered** in the Inversify container.
- **Test database operations** against the test database setup.
- **Run the full test suite** (`npm run test`) to ensure no regressions.
- **Verify that generated code follows TypeScript strict mode** requirements.
- **Check that all public methods have explicit return types** and proper JSDoc.
- **Ensure proper error handling** and logging in all generated code.
- **Validate that all imports use absolute paths** where configured.
- **Review API responses** for consistency with established patterns.
- **Check HTTP status codes** are appropriate for the operation and outcome.
- **Verify namespace consistency** between related endpoints and services.
- **Ensure proper authentication/authorization** checks are in place for protected routes.

## 📚 References

- [Express.js Documentation](https://expressjs.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Zod Documentation](https://zod.dev/)
- [Inversify Documentation](https://inversify.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Redis Node.js Client](https://redis.io/docs/clients/nodejs/)
- [dotenv Config Docs](https://github.com/motdotla/dotenv)
- [Jest Documentation](https://jestjs.io/)
- [Supertest for Express](https://github.com/visionmedia/supertest)
- [ESLint Rules for TypeScript](https://typescript-eslint.io/rules/)
- [Prettier Formatter](https://prettier.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint](https://commitlint.js.org/)

## 🏗️ API Architecture & Conventions

### RESTful Endpoint Design

- **Follow consistent URL patterns**: `/api/v1/{resource}` or `/api/v1/{namespace}/{resource}`
- **Use proper HTTP methods**: GET (read), POST (create), PUT/PATCH (update), DELETE (remove)
- **Implement resource-based routing**: `/users/{id}`, `/users/{id}/roles`, `/posts/{id}/comments`
- **Support query parameters** for filtering, sorting, and pagination: `?page=1&limit=10&sort=name`
- **Use plural nouns** for resource endpoints: `/users`, `/posts`, `/comments`

### Response Standardization

- **Consistent JSON structure**:
    ```typescript
    interface ApiResponse<T> {
        success: boolean;
        message?: string;
        data?: T;
        error?: string;
        metadata?: {
            pagination?: PaginationInfo;
            timestamp: string;
        };
    }
    ```
- **Proper HTTP status codes**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error)
- **Error response format** with consistent structure and helpful messages
- **Include request/response timestamps** for debugging and monitoring

### Authentication & Authorization Patterns

- **JWT-based authentication** with proper token validation
- **Role-based access control (RBAC)** with middleware validation
- **Feature flags support** for controlled feature rollouts
- **User session management** with proper token refresh patterns
- **API key authentication** for service-to-service communication where needed
