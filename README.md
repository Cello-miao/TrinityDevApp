
# FreshCart: Integrated Grocery Mobile Solution


FreshCart is a professional-grade full-stack mobile application developed for a grocery chain to optimize the customer purchasing process. The solution integrates real-time barcode scanning, secure **JWT** authentication, and mandatory **PayPal** payment processing, all served over a secure **HTTPS** infrastructure.

---

##  Production Team
* **Elie Zaylaa** ([@eliezaylaa](https://github.com/eliezaylaa))
* **Xinxin Miao** ([@Cello-miao](https://github.com/Cello-miao))
* **Boyu Fu** ([@boyufu](https://github.com/boyufu))

---

## Branching model & documents

- `main`: production branch — contains client-ready, release-tested code. The `documents/` directory lives in `main` and holds high-level project artifacts (architecture and design documents, diagrams, and exported PDFs) used for production handoff and audits.
- `dev`: development branch — active feature work, experiments, and integration testing. Developers should base daily work on `dev` and open pull requests into `main` when a feature is release-ready.

`documents/` contains:
- Architecture and system diagrams (UML, class diagrams)
- Activity and data-flow diagrams
- Technology choices and design rationale
- Exported design artifacts (PDF/ODT) for stakeholder review


##  Production Deployment (Physical Device)
In accordance with project specifications, this application is designed for demonstration on **physical Android devices**. Emulators are not supported for the final production release.

### Production Endpoints
* **Production APK**: `https://13.37.46.130/downloads/app-release.apk`
* **Root CA Certificate**: `https://13.37.46.130/downloads/rootCA.crt`
* **Backend API**: `https://13.37.46.130/api`

### Installation Guide
1. **Security**: Download and install the `rootCA.crt`. This is required for the device to trust the project's private CA for secure HTTPS communication.
2. **Installation**: Download and install `app-release.apk`.
3. **Execution**: Launch "FreshCart" directly from the Android launcher. This standalone build does not require Expo Go or a Metro server.

---

## 🛠 Tech Stack
* **Frontend**: React Native + Expo (Standalone Release), TypeScript, Expo Camera, Expo Web Browser.
* **Backend**: Node.js + Express, Nginx (Reverse Proxy & HTTPS Termination).
* **Database**: PostgreSQL (Transactional storage for users, products, and orders).
* **External APIs**: OpenFoodFacts (Product metadata), PayPal Sandbox (Financial transactions).
* **DevOps**: Docker & Docker Compose, GitHub Actions CI/CD, Jest (Testing).

---

##  Key Feature Specifications

### 1. Secure Authentication & Identity
* **JWT Auth**: Implements 15-minute access tokens with 7-day rotating refresh tokens.
* **Encryption**: Password hashing via `bcrypt`.
* **RBAC**: Role-based access control for Admin and Customer privileges.

### 2. Intelligent Barcode Scanner
* **Hardware Access**: Real-time decoding via the smartphone camera.
* **Data Fetching**: Automatic product lookup via OpenFoodFacts with 24-hour in-memory caching.
* **Error Handling**: Immediate feedback for unreadable codes or "Product Not Found" scenarios.

### 3. Product & Cart Management
* **Detailed View**: Displays name, brand, category, price, **nutritional information**, and **live stock quantity**.
* **Dynamic Cart**: Real-time total calculation, quantity modification, and item removal.

### 4. Checkout & Secure Payment
* **Billing Info**: Mandatory collection of First Name, Last Name, Address, Zip Code, and City.
* **PayPal Integration**: Secure financial transactions via PayPal Sandbox API.
* **Purchase History**: Persistent logs of all previous transactions and digital receipts.

---

##  Production API Endpoints

### Scanner & Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scanner/lookup` | Find product by barcode (returns full metadata) |
| POST | `/api/scanner/add-to-cart` | Scan and directly add item to user's cart |
| GET | `/api/products/recommendations` | Personalized suggestions based on history |

### Orders & Payment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/paypal/create-order` | Initialize PayPal transaction |
| POST | `/api/paypal/capture-order` | Confirm and finalize payment |
| POST | `/api/orders` | Create internal order and clear cart |
| GET | `/api/orders/me` | Retrieve user purchase history |

---

##  System Architecture
The project follows a **Layered Architecture** designed for high availability and security:
1. **Client Layer**: React Native App handling UI/UX and hardware (Camera).
2. **Security Layer**: Nginx Gateway managing HTTPS termination and reverse proxying.
3. **Application Layer**: Express API handling business logic and external service orchestration.
4. **Data Layer**: PostgreSQL for transactional persistence.

---

##  Quality Assurance
* **Unit Testing**: Minimum **20% code coverage (actually over 60%)** across all core modules (Jest).
* **CI/CD Pipeline**: Automated testing and deployment via GitHub Actions on every push to `prod`.
* **Security Audit**: Verification of HTTPS encryption for all external communication.

---

##  Demo Credentials (Admin)
* **Email**: `admin@trinity.com`
* **Password**: `admin123`

---
*Developed as part of the Epitech MSc program (2025–2027).*