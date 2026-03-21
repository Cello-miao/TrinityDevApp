# FreshCart

A full-stack mobile grocery application built with React Native (Expo) and Node.js/Express. FreshCart allows users to scan product barcodes, manage a shopping cart, and complete purchases via PayPal.

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
- React Native + Expo
- TypeScript
- Expo Camera (barcode scanning)
- Expo Linear Gradient
- AsyncStorage
- PayPal React JS SDK (web)
- Expo Web Browser (mobile PayPal)

**Backend**
- Node.js + Express
- PostgreSQL (via `pg`)
- JWT authentication (access + refresh tokens)
- bcrypt (password hashing)
- axios (PayPal API calls)

**External APIs**
- OpenFoodFacts API (product data by barcode)
- PayPal Sandbox API (payments)

**DevOps**
- Docker + Docker Compose
- GitHub Actions CI/CD
- Jest (unit tests)

---

## Project Structure

```
freshcart/
├── backend/                  # Node.js/Express API
│   ├── controllers/          # Business logic
│   ├── routes/               # API routes
│   ├── middleware/           # Auth, roles
│   ├── config/               # Database config
│   └── test/                 # Backend unit tests
├── frontend/                 # React Native Expo app
│   ├── screens/              # App screens
│   ├── lib/                  # API client, auth, theme
│   ├── components/           # Reusable components
│   ├── types/                # TypeScript types
│   └── test/                 # Frontend unit tests
├── database/
│   └── schema.sql            # PostgreSQL schema
├── docker-compose.yml
└── .github/
    └── workflows/
        └── ci-cd.yml         # CI/CD pipeline
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Expo CLI (`npm install -g expo-cli`)
- A PayPal Developer sandbox account

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freshcart
DB_USER=postgres
DB_PASSWORD=postgres123

# JWT
JWT_SECRET=your_jwt_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
```

Create a `.env` file in the `frontend/` directory:

```env
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_IP>:3000/api
```

> Replace `<YOUR_LOCAL_IP>` with your machine's local IP address (e.g. `192.168.1.10`). Do not use `localhost` — mobile devices cannot reach it.

To generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Database Setup

Make sure PostgreSQL is running, then create the database and apply the schema:

```bash
psql -U postgres -c "CREATE DATABASE freshcart;"
psql -U postgres -d freshcart -f database/schema.sql
```

---

## Running the Backend

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:3000`.

To verify it's running:
```bash
curl http://localhost:3000/api/test
```

---

## Running the Frontend

```bash
cd frontend
npm install
npx expo start --clear
```

Scan the QR code with the **Expo Go** app on your phone, or press `a` for Android emulator / `i` for iOS simulator.

> **Note:** PayPal deep link payments require a native build. Run `npx expo run:android` instead of Expo Go for full PayPal mobile support.

---

## Running with Docker

```bash
docker compose up --build
```

This starts the backend and PostgreSQL in containers. The API will be available at `http://localhost:3000`.

---

## Running Tests

```bash
# All tests
npm test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend

# With coverage
npm run test:backend:coverage
npm run test:frontend:coverage
```

Tests are automatically run in the CI/CD pipeline on every push to `dev` or `main`.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout and revoke refresh token |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |
| GET | `/api/products/discounted/list` | Get discounted products |
| GET | `/api/products/recommendations` | Get personalized recommendations |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get current user's cart |
| POST | `/api/cart/add` | Add item to cart |
| PUT | `/api/cart/update/:id` | Update cart item quantity |
| DELETE | `/api/cart/remove/:id` | Remove item from cart |
| DELETE | `/api/cart/clear` | Clear entire cart |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create an order |
| GET | `/api/orders/me` | Get current user's orders |
| GET | `/api/orders` | Get all orders (admin) |

### PayPal
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/paypal/create-order` | Create a PayPal order |
| POST | `/api/paypal/capture-order` | Capture a PayPal payment |

### OpenFoodFacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/openfoodfacts/barcode/:barcode` | Lookup product by barcode |
| GET | `/api/openfoodfacts/search` | Search products by name or category |

---

## Key Features

- **Barcode scanning** — scan any product barcode using the device camera; product data is fetched from OpenFoodFacts with 24-hour in-memory caching
- **JWT authentication** — 15-minute access tokens with 7-day rotating refresh tokens
- **PayPal payments** — sandbox integration for web (PayPal JS SDK) and mobile (deep link via expo-web-browser)
- **Accessibility** — color blind mode, high contrast, font scaling, reduce motion
- **Dark mode** — full light/dark/color-blind theme system
- **Admin dashboard** — manage products, import from OpenFoodFacts, set discounts
- **Recommendations** — personalized product suggestions based on purchase history
- **Notifications** — in-app bell with promotions and low stock alerts

---

## CI/CD Pipeline

The GitHub Actions pipeline runs on every push to `dev` or `main`:

1. **Backend tests** — runs Jest with coverage
2. **Frontend tests** — runs Jest with coverage
3. **Build & push** — builds Docker image and pushes to Docker Hub

---

## Default Admin Account

For development and testing:

```
Email: admin@trinity.com
Password: admin123
```

---

## License

This project was developed as part of the Epitech MSc program (2025–2027).
