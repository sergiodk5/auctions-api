# Auctions API

[![Tests](https://github.com/sergiodk5/auctions-api/workflows/Tests/badge.svg)](https://github.com/sergiodk5/auctions-api/actions/workflows/test.yml)
[![CI](https://github.com/sergiodk5/auctions-api/workflows/CI/badge.svg)](https://github.com/sergiodk5/auctions-api/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-73.8%25-yellow)](https://github.com/sergiodk5/auctions-api/actions/workflows/test.yml)

A robust, TypeScript-based REST API foundation for auction management with comprehensive authentication, authorization, and user management systems.

## Features

- **Secure Authentication:** JWT-based authentication with comprehensive email verification and password reset workflows
- **Role-Based Access Control (RBAC):** Complete permission system with roles, permissions, and user assignments
- **Email Verification:** Full email verification workflow with token-based validation and resend capabilities
- **User Management:** Robust user registration, login, profile management, and administrative controls
- **Rate Limiting:** Built-in protection against brute force attacks with configurable rate limiters
- **Modular Architecture:** Clean separation of concerns using dependency injection, controllers, services, and repositories
- **Quality Assurance:** Comprehensive test suite with 36 test files covering unit and integration scenarios
- **Type Safety:** Full TypeScript implementation with strict type checking and comprehensive error handling
- **Database Integration:** PostgreSQL with Drizzle ORM for type-safe database operations and migrations
- **Development Environment:** Docker-based development setup with PostgreSQL, Redis, and MailHog services
- **API Documentation:** Interactive OpenAPI 3.0 documentation with Swagger UI and comprehensive endpoint coverage
- **CI/CD Pipeline:** Advanced GitHub Actions workflows with separate fast unit tests and comprehensive integration testing

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

- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Drizzle ORM for type-safe operations
- **Cache/Session Store:** Redis for session management and caching
- **Authentication:** JWT with email verification, bcrypt for password hashing
- **Authorization:** Complete RBAC system with roles, permissions, and user assignments
- **Dependency Injection:** InversifyJS for clean dependency management and testability
- **Testing:** Jest with comprehensive unit and integration test suites (36 test files)
- **Development Tools:** ESLint, Prettier, TypeScript strict mode, Husky for git hooks
- **Email Service:** Nodemailer integration with MailHog for development testing
- **Development Environment:** Docker Compose with PostgreSQL, Redis, and MailHog services
- **API Documentation:** OpenAPI 3.0 with Swagger UI for interactive documentation
- **CI/CD:** GitHub Actions with separate workflows for fast unit tests and comprehensive integration testing

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

    # Seed the database with RBAC setup and sample data
    npm run db:seed
    ```

### Manual Installation (Without Docker)

If you prefer to set up services manually:

1. **Set up PostgreSQL and Redis** on your system

2. **Configure Environment Variables** with your database and Redis connection details

3. **Set up the database:**

    ```bash
    # Run database migrations
    npm run db:migrate

    # Seed the database
    npm run db:seed
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

    # Seed database with RBAC setup
    npm run db:seed

    # Generate new migration
    npm run db:generate

    # Reset database (drop and recreate)
    npm run db:reset
    ```

- **Docker Services:**

    ```bash
    # Start development services
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
    - **API Health Check:** http://localhost:8090/status

## API Endpoints

> 💡 **Complete documentation available at** [`http://localhost:8090/api-docs`](http://localhost:8090/api-docs) when server is running.

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/revoke` - Revoke refresh token
- `POST /auth/logout` - User logout
- `POST /auth/verify-email` - Verify email address with token
- `POST /auth/resend-verification` - Resend email verification
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### Users (🔒 Requires Authentication)

- `GET /users` - Get all users (with pagination and filtering)
- `POST /users` - Create new user (admin only)
- `GET /users/{id}` - Get user by ID
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user (admin only)
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update current user profile

### Roles & Permissions (🔒 Requires Authentication)

- `GET /roles` - Get all roles with permissions
- `POST /roles` - Create new role (admin only)
- `GET /roles/{id}` - Get role by ID with permissions
- `PUT /roles/{id}` - Update role (admin only)
- `DELETE /roles/{id}` - Delete role (admin only)
- `POST /users/{userId}/roles` - Assign role to user (admin only)
- `DELETE /users/{userId}/roles/{roleId}` - Remove role from user (admin only)

### Products (Placeholder Implementation)

- `GET /products` - Get all products (placeholder)
- `POST /products` - Create new product (placeholder)
- `GET /products/{id}` - Get product by ID (placeholder)
- `PUT /products/{id}` - Update product (placeholder)
- `DELETE /products/{id}` - Delete product (placeholder)

> **Note:** Product endpoints are currently placeholder implementations. The focus has been on building a robust authentication and authorization foundation.

### System

- `GET /status` - Health check endpoint

## Testing

The project features comprehensive test coverage with both unit and integration tests across 36 test files:

### Test Coverage Overview

- **Unit Tests:** 30 test files covering controllers, services, repositories, middlewares, and utilities
- **Integration Tests:** 6 test files covering complete API workflows and authentication flows
- **Total Coverage:** High coverage across all components with focus on critical business logic
- **Test Database:** Dedicated PostgreSQL test database with automatic setup and teardown

### Quick Commands

- **Run All Tests:**

    ```bash
    npm test
    ```

- **Run Unit Tests Only (Fast - ~10 seconds):**

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
├── unit/                           # Unit tests with mocked dependencies (30 files)
│   ├── controllers/               # Controller logic tests (8 files)
│   ├── services/                  # Business logic tests (10 files)
│   ├── repositories/              # Data access layer tests (6 files)
│   ├── middlewares/               # Middleware tests (4 files)
│   └── utils/                     # Utility function tests (2 files)
├── integration/                   # Integration tests with real HTTP requests (6 files)
│   ├── auth/                      # Complete authentication flow tests
│   └── routes/                    # API endpoint integration tests
└── helpers/                       # Test utilities, fixtures, and setup helpers
    ├── fixtures/                  # Test data and database fixtures
    ├── test-container.ts          # Dependency injection container for tests
    └── database-helper.ts         # Database setup and cleanup utilities
```

For detailed testing instructions, see [Testing Guide](./docs/testing.md).

## Project Structure

```
src/
├── controllers/           # Request handlers and response logic
├── services/             # Business logic and external integrations
├── repositories/         # Data access layer with Drizzle ORM
├── middlewares/          # Express middlewares (auth, validation, rate limiting)
├── routes/               # API route definitions and OpenAPI documentation
├── db/                   # Database schemas, migrations, and seed scripts
│   ├── schemas/          # Drizzle database schema definitions
│   ├── migrations/       # Database migration files
│   └── seed/             # Database seeding scripts for RBAC and sample data
├── di/                   # Dependency injection container configuration
├── config/               # Application configuration and environment variables
├── types/                # TypeScript type definitions and interfaces
└── utils/                # Utility functions and helpers
```

## Development Status

### ✅ Completed Features

- **Authentication System**: Complete JWT-based authentication with refresh tokens and session management
- **Email Verification**: Full email verification workflow with token validation and resend capabilities
- **Password Reset**: Secure password reset flow with email-based token validation
- **Role-Based Access Control (RBAC)**: Complete implementation with roles, permissions, and user assignments
- **User Management**: Registration, login, profile management, and administrative controls
- **Security**: Rate limiting, password hashing, input validation, and comprehensive middleware protection
- **Testing**: Comprehensive test suite with 36 test files covering unit and integration scenarios
- **Code Quality**: TypeScript strict mode, ESLint, Prettier integration, and pre-commit hooks
- **Database**: PostgreSQL with Drizzle ORM, migrations, and seeding system
- **Development Environment**: Complete Docker-based development setup with all required services
- **API Documentation**: Interactive OpenAPI 3.0 documentation with Swagger UI
- **CI/CD Pipeline**: Advanced GitHub Actions workflows with separate fast and comprehensive testing strategies

### 🚧 In Development

- Complete auction management system implementation
- Real-time bidding with WebSocket integration
- Payment processing integration
- Advanced search and filtering capabilities

### 📋 Future Roadmap

- Auction categories and advanced search functionality
- Image upload and media management for auction items
- Real-time notification system (email, push, in-app)
- Advanced admin dashboard with analytics
- Mobile API optimizations and dedicated endpoints
- Multi-currency support and internationalization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode requirements
- Write tests for new features (maintain comprehensive test coverage)
- Use conventional commit messages
- Ensure all linting, formatting, and type checks pass
- Update API documentation for new endpoints
- Follow the established RBAC patterns for permission-based features
- Use the dependency injection container for new services and repositories
- Maintain database migrations for schema changes

### Setting Up Development Environment

1. **Fork and clone the repository**
2. **Install dependencies:** `npm install`
3. **Start Docker services:** `npm run docker:dev`
4. **Run migrations and seed:** `npm run db:migrate && npm run db:seed`
5. **Start development server:** `npm run dev`
6. **Run tests to verify setup:** `npm run test:unit`

The development environment includes:

- **PostgreSQL** (port 5432) - Main database
- **Redis** (port 6379) - Session store and caching
- **MailHog** (port 1025 SMTP, 8025 Web UI) - Email testing

## License

This project is licensed under the ISC License.
