# FreshCart: Development & Technical Documentation

FreshCart is a full-stack mobile grocery application built with **React Native (Expo)** and **Node.js/Express**. This project is designed to optimize the customer purchasing process through integrated product scanning and secure mobile payments.

---

## Team

| Name | GitHub |
|------|--------|
| Elie Zaylaa | [@eliezaylaa](https://github.com/eliezaylaa) |
| Xinxin Miao | [@Cello-miao](https://github.com/Cello-miao) |
| Boyu Fu | [@boyufu](https://github.com/boyufu) |

---

## Tech Stack

**Frontend**
* React Native + Expo (TypeScript)
* Expo Camera (Barcode scanning)
* AsyncStorage (Local state)
* Expo Web Browser (PayPal mobile integration)

**Backend**
* Node.js + Express
* PostgreSQL via `pg`
* JWT Authentication (Access & Refresh tokens)
* bcrypt (Password hashing)

**External APIs**
* OpenFoodFacts API (Product metadata)
* PayPal Sandbox API (Payments)

**DevOps**
* Docker & Docker Compose
* GitHub Actions CI/CD
* Jest (Unit testing)

---

## Project Structure

The project uses a split setup: the root directory manages the Expo app, while the `backend/` directory contains the API server.

```text
freshcart/
├── backend/                  # Node.js/Express API
│   ├── controllers/          # Business logic
│   ├── routes/               # API routes
│   ├── middleware/           # Auth, roles, validation
│   └── test/                 # Backend unit tests
├── frontend/                 # React Native Expo app
│   ├── screens/              # App screens (Scanner, Cart, etc.)
│   ├── lib/                  # API client, auth, theme
│   └── test/                 # Frontend unit tests
├── database/
│   └── schema.sql            # PostgreSQL schema definitions
├── docker-compose.yml        # Orchestration for local dev
└── .github/
    └── workflows/
        └── ci-cd.yml         # CI/CD pipeline
```

---

## Local Development Setup

### 1. Prerequisites
* Node.js 18+
* PostgreSQL 14+
* Expo CLI (`npm install -g expo-cli`)
* PayPal Developer sandbox account

### 2. Environment Variables
Create a `.env` file in the `backend/` directory for local configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freshcart
DB_USER=postgres
DB_PASSWORD=postgres123

# JWT
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret

# PayPal
PAYPAL_CLIENT_ID=your_id
PAYPAL_CLIENT_SECRET=your_secret
PAYPAL_MODE=sandbox
```

Create a `.env` file in the `frontend/` directory:
```env
# Replace <YOUR_LOCAL_IP> with your machine's IP for real device testing
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_IP>:3000/api
```

### 3. Running the Backend
```bash
cd backend
npm install
npm run dev
```
The API will be available at `http://localhost:3000/api`.

### 4. Running the Frontend
```bash
# From the project root
npm install
npx expo start
```
* **Emulator**: Press `a` for Android or `i` for iOS.
* **Real Device**: Scan the QR code with **Expo Go**. Ensure your phone and PC are on the same Wi-Fi.

---

## Scanner Backend APIs

The scanner feature is powered by barcode-focused endpoints for real-time lookup and cart management.

### POST /api/scanner/lookup
* **Purpose**: Retrieve product details by scanned barcode.
* **Auth**: Optional.
* **Returns**: Product ID, name, brand, category, price, stock quantity, and **nutritional information**.

### POST /api/scanner/add-to-cart
* **Purpose**: Scan a barcode and directly add the item to the user's cart.
* **Auth**: Required (`Bearer <JWT>`).
* **Logic**: Verifies product existence and stock before updating the cart.

---

## Testing & Quality Assurance

All core modules must maintain a minimum threshold of **20% code coverage** to satisfy project requirements.

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run tests in Docker environment (CI-style)
npm run docker:test
```

---

## Project Roadmap

### Phase 1: Initiation & Architecture (Weeks 1-2)
* Initialize React Native environment and establish CI/CD pipeline.
* Design **UML Class Diagrams** and **Activity Diagrams** for business processes.

### Phase 2: Authentication & Scanner (Weeks 3-4)
* Implement secure login/signup with email/password and **JWT**.
* Develop home page and integrate barcode scanner with camera hardware.
* Handle scanning errors and provide user feedback.

### Phase 3: Product Management & Payment (Weeks 5-6)
* Build product display interface (names, brands, nutrition, prices, stock).
* Implement caching mechanisms to optimize performance.
* Develop shopping cart management and integrate **PayPal API**.
* Implement billing forms (address, zip code, city).

### Phase 4: Quality Assurance & Delivery (Weeks 7-8)
* Implement purchase history and verify transaction details.
* Finalize unit tests to reach 20% coverage.
* Final keynote presentation and demonstration on a **physical smartphone**.

---
*Developed as part of the Epitech MSc program (2025–2027).*
