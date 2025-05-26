# Auctions API

[![Tests](https://github.com/sergiodk5/auctions-api/workflows/Tests/badge.svg)](https://github.com/sergiodk5/auctions-api/actions/workflows/test.yml)
[![CI](https://github.com/sergiodk5/auctions-api/workflows/CI/badge.svg)](https://github.com/sergiodk5/auctions-api/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-91.3%25-brightgreen)](https://github.com/sergiodk5/auctions-api/actions/workflows/test.yml)

A robust, TypeScript-based REST API for auction management with comprehensive authentication and email verification.

## Features

- **Secure Authentication:** JWT-based authentication with comprehensive email verification system
- **Email Verification:** Complete email verification workflow with token-based validation
- **User Management:** Robust user registration, login, and profile management
- **Rate Limiting:** Built-in protection against brute force attacks with configurable rate limiters
- **Modular Architecture:** Clean separation of concerns using dependency injection, controllers, services, and repositories
- **Quality Assurance:** Comprehensive test suite with 166 tests covering unit and integration scenarios
- **Type Safety:** Full TypeScript implementation with strict type checking
- **Database Integration:** PostgreSQL with Drizzle ORM for type-safe database operations
- **API Documentation:** Interactive OpenAPI 3.0 documentation with Swagger UI

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
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** JWT with email verification, bcrypt for password hashing
- **Dependency Injection:** InversifyJS for clean dependency management
- **Testing:** Jest with comprehensive unit and integration test suites
- **Development Tools:** ESLint, Prettier, TypeScript strict mode
- **Email Service:** Nodemailer integration for transactional emails

## Installation

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
    PORT=3000
    NODE_ENV=development
    DATABASE_URL=postgresql://username:password@localhost:5432/auctions_db
    TEST_DATABASE_URL=postgresql://username:password@localhost:5432/auctions_test_db
    JWT_SECRET=your-super-secret-jwt-key
    JWT_REFRESH_SECRET=your-super-secret-refresh-key
    MAIL_HOST=smtp.gmail.com
    MAIL_PORT=587
    MAIL_USER=your-email@example.com
    MAIL_PASS=your-app-password
    ```

4. **Set up the database:**

    ```bash
    # Run database migrations
    npm run db:migrate

    # Optional: Seed the database
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

- **Linting:**

    ```bash
    npm run lint
    ```

- **Formatting:**

    ```bash
    npm run format
    ```

- **Type Checking:**

    ```bash
    npm run type-check
    ```

- **View API Documentation:**
    ```bash
    # Start the server and visit http://localhost:8090/api-docs
    npm run dev
    ```

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

- `GET /users` - Get all users
- `POST /users` - Create new user
- `GET /users/{id}` - Get user by ID
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Products

- `GET /products` - Get all products
- `POST /products` - Create new product
- `GET /products/{id}` - Get product by ID
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

### System

- `GET /status` - Health check endpoint

## Testing

The project features comprehensive test coverage with both unit and integration tests:

### Quick Commands

- **Run All Tests:**

    ```bash
    npm test
    ```

- **Run Unit Tests Only (Fast):**

    ```bash
    npm run test:unit
    ```

- **Run Integration Tests (Requires Database):**

    ```bash
    # With Docker (recommended)
    npm run test:integration:local

    # Or start services manually
    npm run test:setup
    npm run test:integration
    npm run test:teardown
    ```

- **Test Coverage:**

    ```bash
    npm run test:coverage
    ```

- **Watch Mode:**
    ```bash
    npm run test:watch
    ```

### Integration Testing Setup

Integration tests require PostgreSQL and Redis. Use Docker for easy setup:

```bash
# Start test services
npm run test:setup

# Run integration tests
npm run test:integration

# Clean up services
npm run test:teardown
```

For detailed testing instructions, see [Testing Guide](./docs/testing.md).

### Test Structure

```
tests/
├── unit/                    # Unit tests with mocked dependencies
│   ├── controllers/         # Controller logic tests
│   ├── services/           # Business logic tests
│   ├── repositories/       # Data access layer tests
│   ├── middlewares/        # Middleware tests
│   └── utils/              # Utility function tests
├── integration/            # Integration tests with real HTTP requests
│   ├── auth/               # Authentication flow tests
│   └── routes/             # API endpoint tests
└── helpers/                # Test utilities and setup
```

## Project Structure

```
src/
├── controllers/            # Request handlers and response logic
├── services/              # Business logic and external integrations
├── repositories/          # Data access layer
├── middlewares/           # Express middlewares
├── routes/                # API route definitions
├── db/                    # Database schemas and configurations
├── di/                    # Dependency injection container
├── config/                # Application configuration
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Development Status

### ✅ Completed Features

- **Authentication System**: Complete JWT-based authentication with refresh tokens
- **Email Verification**: Full email verification workflow with token validation
- **User Management**: Registration, login, profile management
- **Security**: Rate limiting, password hashing, input validation
- **Testing**: Comprehensive test suite with 166 tests (100% passing)
- **Code Quality**: TypeScript strict mode, ESLint, Prettier integration
- **Database**: PostgreSQL with Drizzle ORM and migrations

### 🚧 In Development

- Real-time bidding with WebSocket integration
- Auction management endpoints
- Payment processing integration
- Advanced user roles and permissions

### 📋 Future Roadmap

- Auction categories and search functionality
- Image upload for auction items
- Notification system
- Admin dashboard
- Mobile API optimizations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode requirements
- Write tests for new features (maintain 100% passing rate)
- Use conventional commit messages
- Ensure all linting and type checks pass

## License

This project is licensed under the ISC License.
