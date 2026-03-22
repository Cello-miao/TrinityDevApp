# FreshCart — Activity Diagrams

This document contains all activity diagrams illustrating the key workflows and business processes of the FreshCart mobile application.

---

## 1. User Login Flow

### Description

The login flow begins when the user opens the app and enters their email and password. The credentials are sent to the backend via `POST /api/auth/login`. If invalid, an error is shown and the user can retry. On success, the backend issues a 15-minute JWT access token and a 7-day refresh token. The user is then redirected based on their role — admin to the dashboard, regular users to the home screen.

### Diagram

```mermaid
flowchart TD
    A([Start]) --> B[Enter email and password]
    B --> C[POST /api/auth/login]
    C --> D{Credentials valid?}
    D -- No --> E[Show error]
    E --> B
    D -- Yes --> F[Issue access token 15min + refresh token 7 days]
    F --> G{Role?}
    G -- Admin --> H[Admin dashboard]
    G -- User --> I[Home screen]
```

---

## 2. Barcode Scan to Cart Flow

### Description

The user opens the scanner screen which activates the device camera. The camera processes frames in real time to detect barcodes. If the barcode is unreadable, an error is shown. If readable, the backend looks up the product first in cache, then in OpenFoodFacts if not cached. If found, the product detail screen is shown with name, price, nutritional info, and stock. The user can then add it to their cart via `POST /api/cart/add`.

### Diagram

```mermaid
flowchart TD
    A([Start scanner]) --> B[Camera scans barcode]
    B --> C{Barcode readable?}
    C -- No --> D[Show error]
    D --> B
    C -- Yes --> E[Lookup barcode - backend + OpenFoodFacts cache]
    E --> F{Product found?}
    F -- No --> G[Product not found]
    F -- Yes --> H[Show product details]
    H --> I[Add to cart - POST /api/cart/add]
    I --> J([Cart updated])
```

---

## 3. Checkout and PayPal Payment Flow

### Description

From the cart screen the user proceeds to checkout and fills in billing information including name, address, zip code, and city. If the form is invalid, errors are shown. On valid submission, the backend creates a PayPal order via the PayPal REST API and returns an approval URL. The user is redirected to PayPal to approve the payment. On approval, the backend captures the payment. If cancelled, the flow ends. On successful capture, the order is saved to the database, the cart is cleared, and a success screen is shown.

### Diagram

```mermaid
flowchart TD
    A([View cart]) --> B[Fill billing form]
    B --> C{Form valid?}
    C -- No --> D[Show errors]
    D --> B
    C -- Yes --> E[Create PayPal order - backend to PayPal API]
    E --> F[Redirect user to PayPal]
    F --> G{Payment approved?}
    G -- No --> H[Cancelled]
    G -- Yes --> I[Capture payment - POST /api/paypal/capture-order]
    I --> J[Save order to database]
    J --> K([Clear cart and show success])
```

---

## 4. Token Refresh Flow

### Description

Every API request is sent with a JWT access token. If the server returns a 401 Unauthorized response, the frontend automatically sends the stored refresh token to `POST /api/auth/refresh`. If the refresh token is valid, new access and refresh tokens are issued (rotation) and the original request is retried transparently. If the refresh token is invalid or expired, the user is forced to log out.

### Diagram

```mermaid
flowchart TD
    A[App makes API request] --> B{Response 401?}
    B -- No --> C([Return data])
    B -- Yes --> D[Send refresh token - POST /api/auth/refresh]
    D --> E{Refresh token valid?}
    E -- No --> F[Force logout]
    E -- Yes --> G[Issue new access + rotate refresh token]
    G --> H[Retry original request]
    H --> C
```

---

## 5. Admin Product Import Flow

### Description

The admin can add products manually via a form or import them from OpenFoodFacts by searching by name or category. If no results are found the admin can try a different query. On selecting a product, the system checks if a product with the same barcode already exists in the database. If it does, an error is shown. If not, the product is saved with an auto-generated price based on its category.

### Diagram

```mermaid
flowchart TD
    A([Admin dashboard]) --> B{Import or add manually?}
    B -- Manual --> C[Fill product form]
    C --> J
    B -- Import --> D[Search OpenFoodFacts by name or category]
    D --> E{Results found?}
    E -- No --> F[No results - try again]
    E -- Yes --> G[Select product to import]
    G --> H{Barcode already exists?}
    H -- Yes --> I[Show already exists error]
    H -- No --> J[Save to database with auto-generated price]
    J --> K([Product added])
```

---

## 6. Order History Flow

### Description

The user navigates to the Orders tab which triggers a fetch of their order history via `GET /api/orders/me`. If no orders exist, an empty state is shown. Otherwise the list of orders is displayed with date, items, total, and status. Tapping an order opens the order detail screen.

### Diagram

```mermaid
flowchart TD
    A([Orders tab]) --> B[Fetch order history - GET /api/orders/me]
    B --> C{Orders exist?}
    C -- No --> D[Show empty state]
    C -- Yes --> E[Display order list]
    E --> F{Tap an order?}
    F -- No --> E
    F -- Yes --> G([Show order details])
```

---

## 7. User Registration Flow

### Description

The user fills in the registration form with their name, email, phone number, and password. If the fields are invalid, errors are shown inline. On valid submission, the backend checks if the email already exists. If it does, an error is shown. If not, the password is hashed with bcrypt and the user is saved. The app then automatically logs the user in and redirects them to the home screen.

### Diagram

```mermaid
flowchart TD
    A([Sign up screen]) --> B[Fill registration form]
    B --> C{Fields valid?}
    C -- No --> D[Show errors]
    D --> B
    C -- Yes --> E[POST /api/auth/register]
    E --> F{Email already exists?}
    F -- Yes --> G[Show error]
    F -- No --> H[Hash password and save user]
    H --> I[Auto login - issue access + refresh token]
    I --> J([Redirect to home screen])
```
