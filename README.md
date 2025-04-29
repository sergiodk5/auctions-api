## Features

- **Real-Time Bidding:** Live bid updates using socket.io.
- **Secure Authentication:** JWT-based authentication with role-based access control.
- **Auction Management:** RESTful API endpoints for managing auctions, items, and bids.
- **Modular Architecture:** Clean separation of concerns using controllers, services, middleware, and models.
- **Quality Assurance:** Comprehensive testing, linting, and CI/CD integration.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Real-Time Communication:** socket.io
- **Database:** PostgreSQL (via Sizzle ORM)
- **Authentication:** JWT, bcrypt/argon2
- **Development Tools:** ESLint, Prettier, Jest, GitHub Actions

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
    - Create a `.env` file in the root directory and add required variables (e.g., `PORT`, `DATABASE_URL`, `JWT_SECRET`).

## Usage

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

## Testing

- **Run Tests:**
    ```bash
    npm run test
    ```
- **Test Coverage:**
    ```bash
    npm run test:coverage
    ```

## License

This project is licensed under the ISC License.
