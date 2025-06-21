# GitHub Copilot Instructions

These instructions define how GitHub Copilot should assist with this Node.js TypeScript Express API project. The goal is to ensure consistent, high-quality code generation aligned with our conventions, Express best practices, and TypeScript standards.

## 🧠 Context

- **Project Type**: REST API
- **Language**: TypeScript (Node.js)
- **Framework / Libraries**: Express / Drizzle ORM / Zod / dotenv / Inversify / Redis / cors
- **Database**: PostgreSQL with Drizzle ORM
- **Architecture**: Clean Architecture / Layered Services / Dependency Injection (Inversify)

## 🔧 General Guidelines

- Use idiomatic TypeScript with strict type checking enabled.
- Use named `async` functions and avoid long inline callbacks.
- Use Zod schemas for validation, often with Drizzle integration.
- Organize code with clear separation of concerns (routes → controller → service → repository).
- Use Inversify for dependency injection across all layers.
- Use centralized error handling middleware and structured responses.
- Use Drizzle ORM for database operations with proper schema definitions.
- Implement caching with Redis where appropriate.
- Format code with Prettier and enforce standards with ESLint.

## 🎯 TypeScript & Type Safety

- Always generate TypeScript code with strict mode enabled; avoid `any` or `// @ts-ignore`.
- Use explicit return types on all exported functions and class methods.
- Validate all external inputs via Zod schemas (`z.object`, `z.string`, `z.number`, etc.).
- Prefer type assertions only when necessary; use type guards for runtime checks.
- Use proper generic types for repository and service methods.

## 🎨 Code Style & Standards

- Follow ESLint rules defined in `eslint.config.mjs`; never disable rules in generated code.
- Use Prettier formatting: single quotes, 2 spaces indentation, semicolons, LF line endings.
- Prefer absolute imports using `@/` prefix (configured in `tsconfig.json` paths).
- Use consistent naming: PascalCase for classes, camelCase for variables/functions, UPPER_CASE for constants.
- Keep functions and methods focused on a single responsibility.

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

- Use `express.Router()` for grouping route handlers by domain.
- Use Inversify decorators (`@injectable()`, `@inject()`) for dependency injection.
- Validate request bodies and query params with Zod, often integrated with Drizzle schemas.
- Return consistent JSON responses with `success`, `message`, and `data` properties.
- Use Drizzle ORM for all database operations with proper schema definitions.
- Store config and secrets in `.env` and load with `dotenv`.
- Use Redis for caching when performance optimization is needed.
- Separate business logic into services, keep controllers thin.
- Use proper TypeScript interfaces for all service contracts.
- Implement RBAC (Role-Based Access Control) using the authorization middleware.

### 🚫 Patterns to Avoid

- Don't put business logic directly in route handlers - use controllers and services.
- Avoid using `any` or `// @ts-ignore` — always type inputs and outputs properly.
- Don't bypass the dependency injection container - always use `@inject()`.
- Don't hardcode values — pull from config or env vars.
- Avoid direct database queries - use Drizzle ORM through repositories.
- Don't skip authentication/authorization checks on protected routes.
- Avoid mixing database access patterns - stick to Drizzle ORM consistently.
- Never disable ESLint rules in generated code - fix the underlying issue instead.
- Don't use `console.log` for logging - use proper logging patterns when available.

## 🧪 Testing Guidelines

- Use `Jest` with ts-jest preset for unit and integration tests.
- Use `supertest` for HTTP layer testing.
- Use separate test databases with Docker Compose for integration tests.
- Mock services and repositories using Jest mocks to isolate controller behavior.
- Test Drizzle schemas and validation with both valid/invalid cases.
- Use the existing test helpers and setup utilities in `/tests/helpers/`.
- Run tests with `npm run test`, `npm run test:unit`, or `npm run test:integration`.
- Ensure tests run sequentially (`--runInBand`) for database consistency.
- Aim for high test coverage (>85%) with meaningful assertions, not just coverage metrics.
- Include both positive and negative test cases for all business logic.

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
  - Subject line max 72 characters
  - Use lowercase for subject (except proper nouns)
  - No period at the end of subject line
  - Use imperative mood ("add" not "added" or "adds")

## 🧩 Example Prompts

- `Copilot, create a POST /users endpoint with Inversify DI that validates the request body with Zod.`
- `Copilot, implement a user controller with @injectable() decorator that delegates to a user service.`
- `Copilot, generate a Drizzle schema for a user table with Zod validation integration.`
- `Copilot, write authentication middleware that uses the authorization service for RBAC.`
- `Copilot, create a Jest unit test for the user controller's createUser function with Inversify mocks.`
- `Copilot, implement a repository pattern using Drizzle ORM with proper error handling.`
- `Copilot, add Redis caching to a service method using the cache service.`

## 🔁 Iteration & Review

- Review Copilot output with Prettier and ESLint before committing.
- Use comments to guide Copilot when generating controller logic or complex validation.
- Refactor repeated logic into shared utilities or services.
- Validate schema contracts and function signatures with type checking.
- Ensure all new services are properly registered in the Inversify container.
- Test database operations against the test database setup.
- Run the full test suite (`npm run test`) to ensure no regressions.
- Verify that generated code follows TypeScript strict mode requirements.
- Check that all public methods have explicit return types.

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
