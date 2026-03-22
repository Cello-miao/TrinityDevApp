# FreshCart — Technology Choices

This document justifies the technology decisions made during the development of FreshCart.

---

## Frontend

### React Native + Expo

React Native was chosen to allow a single codebase to target both iOS and Android. Expo simplifies the development workflow by providing a managed build environment, over-the-air updates, and access to native device APIs (camera, storage, deep links) without requiring native code. TypeScript was used throughout for type safety and better maintainability across a team.

### AsyncStorage

AsyncStorage provides a simple persistent key-value store for the device. It is used to store JWT tokens, user data, and user preferences such as theme mode and font scale. It is the standard solution for lightweight persistence in Expo apps without requiring a local database.

### expo-linear-gradient

Used for the home screen header gradient. Chosen over custom SVG backgrounds because it integrates natively with React Native's layout system and renders without performance issues on both platforms.

### expo-web-browser

Used to open the PayPal approval URL in a secure in-app browser session on mobile. It supports the `openAuthSessionAsync` method which handles the deep link redirect back to the app after payment, making it the correct tool for OAuth-style flows in Expo.

---

## Backend

### Node.js + Express

Node.js was chosen for its non-blocking I/O model which handles concurrent API requests efficiently. Express is lightweight, unopinionated, and has a large ecosystem. The team had prior experience with this stack from the web version of the project (TrinityDevWeb), making it a natural continuation.

### PostgreSQL

PostgreSQL was selected as the primary database for its reliability, support for complex relational queries, and ACID compliance which is critical for financial transactions (orders, payments). It also supports JSON columns used for nutritional information storage.

### JWT Authentication

JSON Web Tokens provide stateless authentication. Access tokens are short-lived (15 minutes) to limit the window of exposure if a token is compromised. Refresh tokens (7 days) are stored in the database to allow server-side revocation, combining the performance benefits of stateless auth with the security of server-side session management.

### bcrypt

bcrypt was used for password hashing. It includes a built-in salt and is computationally expensive by design, making brute force attacks impractical. It is the industry standard for password storage in Node.js applications.

### axios

axios was used instead of the official PayPal SDK (`@paypal/checkout-server-sdk`) because the SDK is incompatible with Node.js 22. axios also avoids the HTTP/2 timeout issues encountered with Node.js native `fetch` when calling the PayPal REST API, providing reliable HTTP/1.1 connections.

---

## External APIs

### OpenFoodFacts

OpenFoodFacts is a free, open-source food products database with over 3 million products. It was chosen because it requires no API key, supports barcode lookup and category search, and provides nutritional information which is a requirement of the project specification. An in-memory cache with a 24-hour TTL was added to reduce latency and avoid rate limiting.

### PayPal Sandbox

PayPal was mandatory per the project specification. The sandbox environment allows full end-to-end payment testing without real money. The PayPal REST API v2 was used directly via axios rather than through the official SDK due to Node.js 22 compatibility issues.

---

## DevOps

### Docker + Docker Compose

Docker containerises the backend and database, ensuring consistent environments across development, CI, and production. Docker Compose orchestrates the multi-container setup locally and on the server, defining service dependencies, environment variables, and network configuration.

### GitHub Actions

GitHub Actions was chosen for CI/CD because the repository is hosted on GitHub, making native integration straightforward. The pipeline runs backend and frontend Jest test suites on every push, builds a Docker image, and pushes it to Docker Hub. This ensures regressions are caught immediately and the latest image is always available for deployment.

### AWS EC2

The backend was designed to deploy on an AWS EC2 instance via SSH using the Docker image from Docker Hub. The deployment step is currently disabled in the pipeline but the infrastructure is in place for production use.

---

## Testing

### Jest

Jest was chosen for both backend and frontend unit testing because it works seamlessly with both Node.js and React Native (via `react-native` preset). It supports mocking of modules, async tests, and coverage reporting. The project targets at least 20% code coverage as required by the specification.

---

## Architecture Pattern

The backend follows a layered architecture pattern separating concerns into routes, middleware, and controllers. The frontend follows a service-based pattern where all API communication is centralised in `api.ts` and all authentication logic is in `auth.ts`. This separation makes the code easier to test, maintain, and extend.
