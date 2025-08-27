# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm run dev` - Start development server with hot reload using tsc-watch
- `npm run build` - Build TypeScript to JavaScript (output: `dist/`)
- `npm start` - Start production server from built files

### Database
- `npm run db:migrate` - Run database migrations using Drizzle Kit
- `npm run db:generate` - Generate new migration from schema changes
- `npm run db:studio` - Open Drizzle Studio database GUI
- `npm run db:push` - Push schema changes directly to database (dev only)

### Testing
- `npm test` - Run all tests (unit + integration) with --runInBand
- `npm run test:unit` - Run unit tests only (fast ~1.5s)
- `npm run test:integration` - Run integration tests with database
- `npm run test:integration:local` - Run integration tests with Docker setup/teardown
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run unit tests in watch mode

### Database Seeding & RBAC Setup
- `npm run db:seed roles` - Create role system (admin, editor, client roles)  
- `npm run db:seed permissions` - Create permission system (user:*, product:* permissions)
- `npm run db:seed role-permissions` - Map permissions to roles
- `npm run db:seed admin-user` - Create admin user (admin@example.com/password)
- `npm run db:seed users` - Create 20 sample users with varied verification status
- `npm run db:fix-sequence <table>` - Fix PostgreSQL sequence after seeding with explicit IDs
- `npm run db:fix-all-sequences` - Fix all table sequences at once

### Code Quality
- `npm run lint` - Run ESLint on all TypeScript files
- `npm run lint:fix` - Auto-fix linting issues where possible
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without changes
- `npm run type-check` - Run TypeScript compiler without emitting files

### Docker Development
- `docker-compose up -d` - Start PostgreSQL, Redis, and MailHog services
- `docker-compose down` - Stop and remove containers
- Integration tests use `docker-compose.test.yml` with dedicated test services

## Architecture Overview

This is a **TypeScript Express REST API** using **clean architecture** principles with comprehensive **authentication**, **authorization (RBAC)**, and **user management** systems.

### Core Architecture Layers

1. **Routes** (`src/routes/`) - HTTP endpoint definitions with middleware orchestration
2. **Controllers** (`src/controllers/`) - HTTP request/response handling and error mapping  
3. **Services** (`src/services/`) - Business logic and external service integration
4. **Repositories** (`src/repositories/`) - Data access layer using Drizzle ORM
5. **Middlewares** (`src/middlewares/`) - Cross-cutting concerns (auth, validation, rate limiting)

### Dependency Injection System

Uses **InversifyJS** container (`src/di/container.ts`) for dependency injection:
- All services, repositories, controllers, and middleware use `@injectable()` decorator
- Dependencies injected via `@inject(TYPES.ServiceName)` with type registry (`src/di/types.ts`)
- Container configured in singleton scope by default
- Dynamic providers for mail transporter (SMTP vs SendGrid based on environment)
- Logger transport adapter for Winston integration

### Database & ORM

**PostgreSQL with Drizzle ORM**:
- Schema definitions split across multiple files: `users.schema.ts`, `tokens.schema.ts`, `email-verification.schema.ts`, `rbac.schema.ts`
- Database configuration in `drizzle.config.ts` with environment-based connection strings
- Migration system with versioned SQL files in `migrations/`
- Path alias `@/` configured for clean imports (maps to `src/`)

### Authentication & Authorization System

**Complete JWT-based authentication with RBAC**:
- **Access tokens** (15min lifetime) + **Refresh tokens** (7-day lifetime) with rotation
- **Email verification** workflow with token-based validation and resend capabilities  
- **Password reset** flow with secure email-based token validation
- **Role-Based Access Control**: hierarchical permissions system with dynamic user assignments
- **Multi-layer security**: rate limiting, brute force protection, session management
- **Secure cookie handling** with HTTP-only, secure, and SameSite settings

### Testing Strategy

**Comprehensive 46-file test suite with 421 tests**:
- **Unit tests** (`tests/unit/`) - Mock all external dependencies, fast execution
- **Integration tests** (`tests/integration/`) - Real HTTP requests with test database
- **Jest configuration** with separate projects for unit vs integration
- **Test database** automation with Docker Compose setup/teardown
- **Coverage reporting** with LCOV and HTML reports
- **Parallel execution** for unit tests, sequential for integration (database safety)

### Service Infrastructure

**Redis caching & session management**:
- Token blacklisting and session storage using Redis
- Rate limiting implementation with `rate-limiter-flexible`
- Cache service abstraction for application-level caching

**Email system**:  
- Nodemailer with dual provider support (SMTP for dev, SendGrid for production)
- Email verification and password reset workflows
- MailHog integration for development email testing

**Logging & Monitoring**:
- Winston-based logging with transport adapter pattern
- Structured logging with metadata support
- Request/response logging middleware

### Development Environment

**Docker-based development setup**:
- PostgreSQL (port 5432) for main database
- Redis (port 6379) for caching and sessions  
- MailHog (SMTP port 1025, Web UI port 8025) for email testing
- Test services on alternate ports (PostgreSQL 5435, etc.)

### API Documentation

**OpenAPI 3.0 with Swagger UI**:
- Interactive documentation at `/api-docs`
- Complete schemas with validation rules and examples
- JWT authentication support in documentation interface
- Organized by functional tags (Auth, Users, RBAC, System)

### Key Implementation Details

**Environment Configuration**: Centralized config in `src/config/env.ts` with validation - never access `process.env` directly

**Error Handling**: Structured error responses with consistent format, centralized error handler middleware

**Validation**: Zod schemas integrated with Drizzle for type-safe validation throughout the stack

**Security**: Bcrypt password hashing, JWT token validation, CORS configuration, security headers

**Database Patterns**: Repository pattern with interfaces, proper error handling, transaction support

**RBAC Implementation**: Dynamic permission checking, role inheritance, user-role assignments with caching

### Module Alias Configuration

TypeScript paths configured with `@/*` mapping to `src/*` for clean imports. Runtime alias resolution via `module-alias` package with `_moduleAliases` in `package.json`.

### Code Quality Standards

- **TypeScript strict mode** with comprehensive type safety
- **ESLint** with TypeScript-specific rules and Jest plugin  
- **Prettier** formatting with consistent style rules
- **Husky** pre-commit hooks with lint-staged for automatic formatting
- **Conventional commits** enforced via commitlint configuration