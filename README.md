# Trinity Project Mobile Application Development Roadmap

## Quick Start (Docker + Android Emulator)

This project uses a split setup:
- root `package.json`: Expo mobile app
- `backend/package.json`: Express API server

Having both root and `backend` `node_modules` / `package-lock.json` is expected.

### 1) Start backend + database with Docker

```bash
npm install
npm run docker:up
npm run docker:logs
```

### 2) Run app on Android emulator

In another terminal at repo root:

```bash
set EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api
npm run start
```

Then press `a` in Metro to open Android.

### 3) Stop Docker services

```bash
npm run docker:down
```

Notes:
- DB schema auto-initializes from `database/schema.sql` on first startup.
- To fully reset DB data: `docker compose down -v` then `npm run docker:up`.

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

