# Trinity Project Mobile Application Development Roadmap

## Production APK Installation Guide

This repository can now produce a standalone Android release APK.
The release package does not require Expo Go and does not depend on a running Metro server.

Production download endpoints:
- APK: `https://13.37.46.130/downloads/app-release.apk`
- Root CA certificate: `https://13.37.46.130/downloads/rootCA.crt`

Recommended installation flow for a real Android device:
1. Download and install `rootCA.crt` if your device does not already trust the project CA.
2. Download `app-release.apk` from the same server.
3. Install the APK and launch the app directly from the Android launcher.

Release build behavior:
- The release APK targets the production backend at `https://13.37.46.130/api`.
- The Android build embeds the project root CA through `networkSecurityConfig`.
- Expo Go is not required for installation or runtime.

## Quick Start (Docker-First)

This project uses a split setup:
- root `package.json`: Expo mobile app
- `backend/package.json`: Express API server

Having both root and `backend` `node_modules` / `package-lock.json` is expected.

### 1) Install dependencies (once)

```bash
npm install
```

> On Windows PowerShell with execution policy restrictions, use:

```bash
npm.cmd install
```

### Secret Management (Local vs GitHub)

- Do not put real secrets in `docker-compose.yml`.
- Local testing: create hidden `./.env` from `./.env.example`.
- Remote CI/CD: keep the same keys in GitHub Secrets and inject them as environment variables.

```powershell
Copy-Item .env.example .env
```

Required keys:
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`

### 2) Start backend + database with Docker

```bash
npm run docker:up
npm run docker:logs
```

### 2.1) Create local TLS certificate for Nginx (dev HTTPS)

Install `mkcert` once, then run at repo root:

```bash
mkcert -key-file nginx/certs/dev.key -cert-file nginx/certs/dev.crt localhost 127.0.0.1 ::1 10.0.2.2 <YOUR_PC_IP>
```

If certificate files are missing, the `nginx` container will fail to start.

### 3) Start Expo app (Android emulator)

In another terminal at repo root:

```bash
set EXPO_PUBLIC_API_BASE_URL=https://10.0.2.2:3443/api
npm run start
```

Then press `a` in Metro to open Android.

### 4) Start Expo app (real device)

Set API URL to your computer LAN IP (same Wi-Fi as phone):

```bash
set EXPO_PUBLIC_API_BASE_URL=https://<YOUR_PC_IP>:3443/api
npm run start -- --clear
```

### 5) Run tests (Docker CI-style)

```bash
npm run docker:test
```

### 6) Stop Docker services

```bash
npm run docker:down
```

Notes:
- DB schema auto-initializes from `database/schema.sql` on first startup.
- To fully reset DB data: `docker compose down -v` then `npm run docker:up`.
- HTTPS gateway runs at `https://localhost:3443` via Nginx.
- Backend `3000` is internal-only in Docker and is not exposed to host.
- Database `5432` is internal-only in Docker and is not exposed to host.
- `10.0.2.2` works for Android emulator only; real devices must use your computer IP.
- You must trust the local certificate on emulator/device for HTTPS requests to succeed.

## Scanner Backend APIs

The scanner feature is powered by barcode-focused APIs for real-time lookup and cart linkage.

- `POST /api/scanner/lookup`
	- Purpose: Find a product by scanned barcode and return product details.
	- Auth: Optional (works without token).
	- Body:
		```json
		{
			"barcode": "1234567890123"
		}
		```
	- Success response includes: `id`, `name`, `picture`, `brand`, `category`, `nutritional_info`, `nutrition_grade`, `price`, `quantity`, `barcode`.
	- Error codes: `BARCODE_REQUIRED`, `BARCODE_INVALID_FORMAT`, `PRODUCT_NOT_FOUND`.

- `POST /api/scanner/add-to-cart`
	- Purpose: Scan by barcode and directly add the matched product to the current user's cart.
	- Auth: Required (`Authorization: Bearer <token>`).
	- Body:
		```json
		{
			"barcode": "1234567890123",
			"quantity": 1
		}
		```
	- Error codes: `BARCODE_REQUIRED`, `BARCODE_INVALID_FORMAT`, `INVALID_QUANTITY`, `PRODUCT_NOT_FOUND`, `INSUFFICIENT_STOCK`.

All scanner requests are logged into `scan_events` for diagnostics and demo traceability.

## Local Testing (Frontend + Backend)

### 1) Install dependencies

```bash
npm install
```

> On Windows PowerShell with execution policy restrictions, use:

```bash
npm.cmd install
```

### 2) Run unit tests locally

```bash
# run all tests
npm run test

# run frontend tests only
npm run test:frontend

# run backend tests only
npm run test:backend

# run coverage report
npm run test:coverage

# run tests in Docker (CI/CD-friendly)
npm run docker:test
```

Current local baseline includes:
- Frontend unit tests:
	- `frontend/lib/cartUtils.test.ts`
	- `frontend/lib/auth.test.ts`
	- `frontend/lib/api.test.ts`
	- `frontend/lib/mockData.test.ts`
- Backend unit tests:
	- `backend/controllers/auth.controller.test.js`
	- `backend/controllers/product.controller.test.js`
	- `backend/controllers/cart.controller.test.js`
	- `backend/controllers/user.controller.test.js`
	- `backend/controllers/scanner.controller.test.js`
	- `backend/middleware/auth.test.js`
	- `backend/middleware/roles.test.js`

Coverage is collected for frontend `lib` modules and all core backend controllers/middleware, with a global minimum threshold of 20% (branches/functions/lines/statements) to satisfy project requirements.

### 3) Manual integration checks (recommended)

For local end-to-end validation before final demo:
- Start backend and DB: `npm run docker:up`
- Start app: `npm run start`
- Verify scanner flow on a real phone:
	- camera permission prompt appears
	- barcode lookup returns product detail
	- unknown barcode returns clear error feedback
	- scan-to-cart updates cart successfully

## Project Overview

Our team of three developers will collaborate over an eight-week period to build a React Native mobile application for a grocery chain. This application is designed to optimize the customer purchasing process through integrated product scanning and secure mobile payments. The project will be managed using ClickUp to track individual tasks and overall progress across our three primary Git branches: the **document** branch for technical deliverables, the **dev** branch for the source code, and the **prod** branch for client-ready production releases.

---

## Phase 1: Initiation and Architectural Design (Weeks 1-2)

During the first week, the team will **initialize the React Native environment** on the dev branch and **establish a CI/CD pipeline** for automated testing. We will prioritize the **creation of a technical documentation framework** in the document branch that justifies our choice of React Native for this project and outlines our technological strategy.

In the second week, the team will focus on architectural foundations by **designing UML class diagrams** to show data structures and their relationships. We will also **develop activity diagrams** to illustrate specific business processes, such as the workflow from scanning a product to completing a purchase. This phase concludes with the **definition of core data structures**, specifically the Repository data class, to ensure consistent communication with the internal API.

---

## Phase 2: Authentication and Scanner Implementation (Weeks 3-4)

During the third week, we will **implement a secure login screen** that allows users to sign up or log in using an email and password. We will **integrate JSON Web Tokens (JWT)** to authenticate and authorize all secure requests made to our internal API services to protect user data.

The fourth week will focus on **developing an intuitive home page** that provides clear navigation buttons to access the scanner, shopping cart, and purchase history. A major technical objective is the **implementation of the barcode scanner** using the smartphone camera. We will ensure the application **handles scanning errors effectively** and provides appropriate feedback to the user when codes are unreadable or products are not found.

---

## Phase 3: Product Management and Payment Integration (Weeks 5-6)

In the fifth week, the team will **build the product display interface** to show detailed information including names, brands, prices, and nutritional data. We will also **implement caching mechanisms** during this stage to improve application performance and reduce redundant API calls.

During the sixth week, we will **develop the shopping cart management system** which allows users to modify quantities or remove items in real-time. A critical milestone is the **mandatory integration of the PayPal API** to enable secure financial transactions directly within the app. We will also **implement a billing form** for users to enter required information such as their address and zip code.

---

## Phase 4: Quality Assurance and Final Delivery (Weeks 7-8)

In the seventh week, the team will **implement a purchase history feature** so users can access the details of their previous transactions. We will also **write unit tests** using the Jest framework to guarantee that our code coverage reaches the mandatory minimum of 20%. Security remains a priority as we **verify that all communications** between the app and payment services use HTTPS and robust encryption.

The final week will be dedicated to **polishing the user interface** and **finalizing all technical documentation**, including data flows and component architecture. Once the build is verified as stable and secure, we will **merge the final code into the prod branch** for the client release. The project will conclude with a **final keynote presentation** where we **demonstrate the application's functionality on a physical smartphone**, as simulations via emulators will not be accepted.

