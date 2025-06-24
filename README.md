# Auctions API

[![Tests](https://github.com/sergiodk5/auctions-api/workflows/Tests/badge.svg)](https://github.com/sergiodk5/auctions-api/actions/workflows/test.yml)
[![CI](https://github.com/sergiodk5/auctions-api/workflows/CI/badge.svg)](https://github.com/sergiodk5/auctions-api/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-421%20tests-green)](https://github.com/sergiodk5/auctions-api/actions/workflows/test.yml)

A comprehensive, production-ready TypeScript REST API foundation featuring enterprise-grade authentication, role-based access control (RBAC), and user management systems. Built with modern development practices and extensive test coverage.

## Features

- **🔐 Enterprise Authentication System**: Complete JWT-based authentication with refresh tokens, session management, and secure cookie handling
- **📧 Email Verification Workflow**: Full email verification system with token-based validation, resend capabilities, and customizable templates
- **🔑 Password Management**: Secure password reset flow with email-based token validation and bcrypt hashing
- **👥 Advanced RBAC System**: Complete role-based access control with hierarchical permissions, role assignments, and dynamic authorization
- **🛡️ Security & Protection**: Multi-layer rate limiting, brute force protection, input validation, and comprehensive middleware security
- **🏗️ Clean Architecture**: Modular design using dependency injection, layered services, repositories, and clear separation of concerns
- **🧪 Comprehensive Testing**: 46 test files with 421 tests covering unit testing, integration testing, and end-to-end API workflows
- **📊 Database Management**: PostgreSQL with Drizzle ORM, type-safe operations, migrations, and automated seeding system
- **🚀 Development Experience**: Docker-based development environment with hot reloading, database management tools, and email testing
- **📖 API Documentation**: Interactive OpenAPI 3.0 documentation with Swagger UI, complete schemas, and testing capabilities
- **⚙️ CI/CD Pipeline**: Advanced GitHub Actions workflows with parallel testing strategies and comprehensive quality checks
- **🔍 Code Quality**: TypeScript strict mode, ESLint/Prettier integration, pre-commit hooks, and automated code formatting

## 📚 API Documentation

This project includes comprehensive **OpenAPI 3.0** documentation with **Swagger UI** for interactive API exploration and testing.

### Accessing the Documentation

Once your server is running, access the interactive API documentation at:

```
http://localhost:8090/api-docs
```

### Features

- 🔍 **Interactive Testing** - Test all endpoints directly from the browser
- 🔐 **Authentication Support** - Built-in JWT token authentication for protected endpoints
- 📋 **Complete Schemas** - Detailed request/response models and validation rules
- 🏷️ **Organized by Tags** - Endpoints grouped by functionality (Auth, Users, Products, System)
- 📖 **Comprehensive Examples** - Sample requests and responses for all endpoints

For detailed information about using the API documentation, see [`docs/openapi.md`](docs/openapi.md).

## Tech Stack

- **Backend Framework**: Node.js 18+ with Express.js and TypeScript (strict mode)
- **Database**: PostgreSQL 14+ with Drizzle ORM for type-safe operations and schema management
- **Caching & Sessions**: Redis 7+ for session management, token blacklisting, and application caching
- **Authentication & Security**: JWT tokens with refresh token rotation, bcrypt password hashing, and rate limiting
- **Authorization**: Complete RBAC implementation with roles, permissions, and dynamic user assignments
- **Dependency Injection**: InversifyJS container for clean dependency management and enhanced testability
- **Testing Framework**: Jest with 46 test files (421 tests) including unit, integration, and API endpoint testing
- **Development Tools**: ESLint, Prettier, TypeScript compiler, Husky git hooks, and automated code formatting
- **Email Services**: Nodemailer integration with development support via MailHog for email workflow testing
- **Development Environment**: Docker Compose orchestration with PostgreSQL, Redis, and MailHog services
- **API Documentation**: OpenAPI 3.0 specification with Swagger UI for interactive documentation and testing
- **CI/CD**: GitHub Actions with multi-stage workflows for fast unit testing and comprehensive integration testing
- **Code Quality**: Pre-commit hooks, automated linting, type checking, and comprehensive error handling

## Installation

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (recommended for development)
- PostgreSQL 14+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Quick Start with Docker (Recommended)

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/auctions-api.git
    cd auctions-api
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Configure Environment Variables:**

    - Copy `.env.example` to `.env` and configure the following variables:

    ```env
    PORT=8090
    NODE_ENV=development
    DATABASE_URL=postgresql://postgres:password@localhost:5432/auctions_db
    TEST_DATABASE_URL=postgresql://postgres:password@localhost:5433/auctions_test_db
    REDIS_URL=redis://localhost:6379
    JWT_SECRET=your-super-secret-jwt-key-min-32-chars
    JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
    MAIL_HOST=localhost
    MAIL_PORT=1025
    MAIL_USER=test@example.com
    MAIL_PASS=password
    MAIL_FROM=noreply@auctions-api.com
    ```

4. **Start the development environment:**

    ```bash
    # Start all services (PostgreSQL, Redis, MailHog)
    npm run docker:dev

    # Run database migrations
    npm run db:migrate

    # Seed the database with RBAC setup and sample data (optional)
    # Note: Individual seeding scripts available - see Database Operations section
    ```

### Manual Installation (Without Docker)

If you prefer to set up services manually:

1. **Set up PostgreSQL and Redis** on your system

2. **Configure Environment Variables** with your database and Redis connection details

3. **Set up the database:**

    ```bash
    # Run database migrations
    npm run db:migrate

    # Optional: Seed the database with sample data
    # Individual seeding scripts available - see Database Operations section
    ```

## Usage

- **Start Development Server:**

    ```bash
    npm run dev
    ```

- **Build for Production:**

    ```bash
    npm run build
    ```

- **Start Production Server:**

    ```bash
    npm start
    ```

- **Database Operations:**

    ```bash
    # Run migrations
    npm run db:migrate

    # Generate new migration
    npm run db:generate

    # Open Drizzle Studio (database GUI)
    npm run db:studio

    # Database seeding (individual seeders available)
    # See docs/seeding-guide.md for complete seeding documentation
    # Examples:
    # npm run seed roles
    # npm run seed permissions
    # npm run seed admin-user

    # Reset database (drop and recreate) - use with caution
    npm run db:push
    ```

- **Docker Services:**

    ```bash
    # Start development services (PostgreSQL, Redis, MailHog)
    npm run docker:dev

    # Stop services
    npm run docker:stop

    # View logs
    npm run docker:logs
    ```

- **Code Quality:**

    ```bash
    # Linting
    npm run lint

    # Formatting
    npm run format

    # Type checking
    npm run type-check
    ```

- **View Services:**
    - **API Documentation:** http://localhost:8090/api-docs
    - **MailHog (Email Testing):** http://localhost:8025
    - **API Health Check:** http://localhost:8090/api/v1/status

## API Endpoints

> 💡 **Complete documentation available at** [`http://localhost:8090/api-docs`](http://localhost:8090/api-docs) when server is running.

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token (requires refresh token cookie)
- `POST /api/v1/auth/revoke` - Revoke refresh token
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/verify-email` - Verify email address with token
- `POST /api/v1/auth/resend-verification` - Resend email verification
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token

### Users (🔒 Requires Authentication)

- `GET /api/v1/users` - Get all users (with pagination and filtering)
- `POST /api/v1/users` - Create new user (admin only)
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user (admin only)

### Roles & Permissions (🔒 Requires Authentication)

**Role Management (Admin Only):**

- `GET /api/v1/roles` - Get all roles (optionally with permissions)
- `POST /api/v1/roles` - Create new role
- `GET /api/v1/roles/{id}` - Get role by ID (optionally with permissions)
- `PUT /api/v1/roles/{id}` - Update role
- `DELETE /api/v1/roles/{id}` - Delete role
- `POST /api/v1/roles/{id}/permissions` - Assign permission to role
- `DELETE /api/v1/roles/{id}/permissions/{permissionId}` - Remove permission from role
- `PUT /api/v1/roles/{id}/permissions` - Set all permissions for role

**Permission Management (Admin Only):**

- `GET /api/v1/permissions` - Get all permissions
- `POST /api/v1/permissions` - Create new permission
- `GET /api/v1/permissions/{id}` - Get permission by ID
- `PUT /api/v1/permissions/{id}` - Update permission
- `DELETE /api/v1/permissions/{id}` - Delete permission

**User-Role Assignment (Admin Only):**

- `GET /api/v1/users/{id}/roles` - Get user's roles
- `POST /api/v1/users/{id}/roles` - Assign roles to user
- `DELETE /api/v1/users/{id}/roles/{roleId}` - Remove role from user

### Products (Placeholder Implementation)

- `GET /api/v1/products` - Get all products (placeholder response)
- `POST /api/v1/products` - Create new product (placeholder response)
- `GET /api/v1/products/{id}` - Get product by ID (placeholder response)
- `PUT /api/v1/products/{id}` - Update product (placeholder response)
- `DELETE /api/v1/products/{id}` - Delete product (placeholder response)

> **Note:** Product endpoints are currently placeholder implementations that return simple text responses. These endpoints demonstrate the RBAC authorization system but do not include actual product management functionality. Full product/auction management features are planned for future development.

### System

- `GET /api/v1/status` - Health check endpoint

## Testing

This project features comprehensive test coverage with 46 test files containing 421 individual tests, covering both unit and integration testing scenarios across all application layers.

### Test Coverage Overview

- **Unit Tests**: 36 test files covering controllers, services, repositories, middlewares, and utilities
- **Integration Tests**: 10 test files covering complete API workflows, authentication flows, and database operations
- **Total Test Count**: 421 individual tests providing comprehensive coverage across all components
- **Test Database**: Dedicated PostgreSQL test database with automatic setup and teardown
- **Mocking Strategy**: External dependencies (database, Redis, external APIs) properly mocked in unit tests
- **Real Integration Testing**: Complete request/response flows tested with actual database and service integrations

### Quick Commands

- **Run All Tests:**

    ```bash
    npm test
    ```

- **Run Unit Tests Only (Fast - ~1.5 seconds):**

    ```bash
    npm run test:unit
    ```

- **Run Integration Tests (Requires Database - ~30 seconds):**

    ```bash
    # With Docker (recommended)
    npm run test:integration:local

    # Or with manual services
    npm run test:setup      # Start test services
    npm run test:integration
    npm run test:teardown   # Clean up services
    ```

- **Test Coverage:**

    ```bash
    npm run test:coverage
    ```

- **Watch Mode (Unit Tests):**
    ```bash
    npm run test:watch
    ```

### Advanced Testing Features

- **Automatic Test Database Management:** Integration tests automatically create and manage a separate test database
- **Docker Test Environment:** Dedicated Docker Compose setup for integration testing
- **Parallel Test Execution:** Unit tests run in parallel for faster feedback
- **GitHub Actions Integration:** Separate CI workflows for fast unit tests and comprehensive integration testing

### Test Structure

```
tests/
├── unit/                           # Unit tests with mocked dependencies (36 files)
│   ├── controllers/               # Controller logic tests (8 files)
│   ├── services/                  # Business logic tests (14 files)
│   ├── repositories/              # Data access layer tests (8 files)
│   ├── middlewares/               # Middleware tests (6 files)
│   ├── config/                    # Configuration tests (3 files)
│   ├── db/                        # Database schema tests (4 files)
│   └── utils/                     # Utility function tests (2 files)
├── integration/                   # Integration tests with real HTTP requests (10 files)
│   ├── auth/                      # Authentication workflow integration tests
│   ├── routes/                    # API endpoint integration tests
│   └── helpers/                   # RBAC and database integration helpers
└── helpers/                       # Test utilities, fixtures, and setup helpers
    ├── fixtures/                  # Test data and database fixtures
    ├── test-container.ts          # Dependency injection container for tests
    └── database-helper.ts         # Database setup and cleanup utilities
```

For detailed testing instructions, see [Testing Guide](./docs/testing.md).

## Project Structure

```
src/
├── controllers/           # Request handlers and response logic (4 controllers)
├── services/             # Business logic and external integrations (10+ services)
├── repositories/         # Data access layer with Drizzle ORM (8 repositories)
├── middlewares/          # Express middlewares (auth, validation, rate limiting)
├── routes/               # API route definitions and OpenAPI documentation (6 route modules)
├── db/                   # Database schemas, migrations, and seed scripts
│   ├── schemas/          # Drizzle database schema definitions (6 schema files)
│   ├── migrations/       # Database migration files (5 migrations)
│   └── seeds/            # Database seeding scripts for RBAC and sample data (5 seeders)
├── scripts/              # Utility scripts for database management (4 scripts)
├── di/                   # Dependency injection container configuration
├── config/               # Application configuration and environment variables
├── adapters/             # External service adapters (logging, etc.)
├── types/                # TypeScript type definitions and interfaces
└── utils/                # Utility functions and helpers
```

## Development Status

### ✅ Completed Features

- **🔐 Authentication System**: Complete JWT-based authentication with refresh tokens, session management, and secure cookie handling
- **📧 Email Verification**: Full email verification workflow with token validation, resend capabilities, and error handling
- **🔑 Password Reset**: Secure password reset flow with email-based token validation and comprehensive security measures
- **👥 Role-Based Access Control (RBAC)**: Complete implementation with roles, permissions, user assignments, and dynamic authorization
- **🛡️ Security Features**: Multi-layer rate limiting, brute force protection, input validation, and middleware-based security
- **🧪 Testing Infrastructure**: Comprehensive test suite with 46 test files, 421 tests, covering unit and integration scenarios
- **📊 Database Systems**: PostgreSQL with Drizzle ORM, migrations, seeding system, and automated sequence management
- **🚀 Development Environment**: Complete Docker-based development setup with all required services and tooling
- **📖 API Documentation**: Interactive OpenAPI 3.0 documentation with Swagger UI and comprehensive endpoint coverage
- **⚙️ CI/CD Pipeline**: Advanced GitHub Actions workflows with multi-stage testing and quality assurance checks
- **🏗️ Architecture**: Clean separation of concerns with dependency injection, layered services, and modular design
- **📝 Code Quality**: TypeScript strict mode, comprehensive linting, formatting, and pre-commit hook integration

### 🚧 In Development

- Enhanced user profile management endpoints (get/update profile)
- Database seeding automation scripts (npm run db:seed commands)
- Sequence management utilities (npm run db:fix-sequence commands)

### 📋 Future Roadmap

- **🏪 Auction Management System**: Complete auction creation, bidding, and management functionality
- **⚡ Real-time Features**: WebSocket integration for live bidding and real-time notifications
- **💳 Payment Integration**: Payment processing system with multiple payment provider support
- **🔍 Advanced Search**: Elasticsearch integration with filtering, sorting, and advanced search capabilities
- **� Mobile Optimization**: Mobile API optimizations and dedicated mobile endpoints
- **🌍 Internationalization**: Multi-language support, currency handling, and localization features
- **📊 Analytics Dashboard**: Advanced admin dashboard with analytics, reporting, and business intelligence
- **🖼️ Media Management**: Image upload, processing, and media management for auction items
- **🔔 Notification System**: Multi-channel notifications (email, push, SMS, in-app) with preferences

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **TypeScript Standards**: Follow strict TypeScript requirements with comprehensive type safety
- **Testing Requirements**: Write tests for new features maintaining high coverage (unit + integration)
- **Code Standards**: Use conventional commit messages and ensure all quality checks pass
- **Documentation**: Update API documentation for new endpoints and maintain consistency
- **Architecture**: Follow established RBAC patterns and dependency injection practices
- **Database**: Use migrations for schema changes and follow established repository patterns
- **Security**: Implement proper authentication/authorization for all protected endpoints

### Setting Up Development Environment

1. **Fork and clone the repository**
2. **Install dependencies:** `npm install`
3. **Start Docker services:** `npm run docker:dev`
4. **Run migrations and seed:** `npm run db:migrate && npm run db:seed`
5. **Start development server:** `npm run dev`
6. **Run tests to verify setup:** `npm run test:unit`

The development environment includes:

- **PostgreSQL** (port 5432) - Main application database
- **Redis** (port 6379) - Session store, caching, and rate limiting
- **MailHog** (port 1025 SMTP, 8025 Web UI) - Email testing and development

## License

This project is licensed under the ISC License.
