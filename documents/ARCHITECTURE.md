# FreshCart — System Architecture

## Overview

FreshCart follows a client-server architecture with a React Native mobile frontend, a Node.js/Express REST API backend, a PostgreSQL database, and two external services — OpenFoodFacts for product data and PayPal for payments. The entire backend is containerised with Docker and deployed via a GitHub Actions CI/CD pipeline.

---

## Architecture Diagram

```mermaid
graph TB
    subgraph Mobile["Mobile App (React Native + Expo)"]
        UI[Screens]
        API_LIB[api.ts - HTTP Client]
        AUTH_LIB[auth.ts - Token Manager]
        THEME[theme.ts - Theme System]
        STORAGE[AsyncStorage]
    end

    subgraph Backend["Backend (Node.js + Express)"]
        ROUTES[Routes]
        CONTROLLERS[Controllers]
        MIDDLEWARE[Auth Middleware]
        PAYPAL_ROUTE[PayPal Routes]
        OFF_ROUTE[OpenFoodFacts Routes]
        CACHE[In-Memory Cache]
    end

    subgraph Database["Database (PostgreSQL)"]
        USERS[(users)]
        PRODUCTS[(products)]
        CART[(cart)]
        ORDERS[(orders)]
        TOKENS[(refresh_tokens)]
        FAVORITES[(favorites)]
    end

    subgraph External["External Services"]
        PAYPAL[PayPal Sandbox API]
        OFF[OpenFoodFacts API]
    end

    subgraph DevOps["CI/CD (GitHub Actions + Docker)"]
        GH[GitHub Actions]
        DOCKER[Docker Hub]
        EC2[AWS EC2]
    end

    UI --> API_LIB
    API_LIB --> AUTH_LIB
    AUTH_LIB --> STORAGE

    API_LIB -->|JWT| MIDDLEWARE
    MIDDLEWARE --> ROUTES
    ROUTES --> CONTROLLERS
    CONTROLLERS --> Database

    PAYPAL_ROUTE -->|axios| PAYPAL
    OFF_ROUTE --> CACHE
    CACHE -->|cache miss| OFF

    GH -->|build + push| DOCKER
    DOCKER -->|deploy| EC2
```

---

## Layer Descriptions

### Mobile App

The frontend is built with React Native and Expo, written in TypeScript. It communicates with the backend exclusively through `api.ts`, which handles all HTTP requests, token injection, and automatic token refresh on 401 responses. The theme system supports light, dark, and color-blind modes. All tokens and user data are persisted in AsyncStorage.

### Backend

The Node.js/Express backend follows a layered architecture: routes define the URL structure, middleware handles JWT verification and role-based access, and controllers contain the business logic. The OpenFoodFacts proxy uses an in-memory Map cache with a 24-hour TTL to avoid redundant external calls. PayPal integration uses axios to call the PayPal REST API directly, avoiding the official SDK which is incompatible with Node.js 22.

### Database

PostgreSQL stores all persistent data. The schema includes users, products, cart items, orders, order items, favorites, refresh tokens, and scan events. Refresh tokens are stored in the database to enable server-side revocation.

### External Services

OpenFoodFacts provides free product data by barcode or category search. PayPal Sandbox is used for payment processing — the backend acts as a proxy between the app and the PayPal API to avoid exposing credentials to the client.

### CI/CD

GitHub Actions runs backend and frontend Jest test suites on every push to `dev` or `main`. On success, it builds a Docker image of the backend and pushes it to Docker Hub. The EC2 deployment step is currently disabled.

---

## Request Lifecycle

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant Mid as Auth Middleware
    participant Ctrl as Controller
    participant DB as PostgreSQL

    App->>Mid: HTTP Request + Bearer token
    Mid->>Mid: jwt.verify(token, JWT_SECRET)
    alt Token valid
        Mid->>Ctrl: req.user injected
        Ctrl->>DB: Query
        DB-->>Ctrl: Result
        Ctrl-->>App: JSON Response
    else Token expired
        Mid-->>App: 401 Unauthorized
        App->>App: Auto refresh token
        App->>Mid: Retry with new token
    end
```
