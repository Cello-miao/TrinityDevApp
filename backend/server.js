const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const userRoutes = require("./routes/user.routes");
const scannerRoutes = require("./routes/scanner.routes");
const orderRoutes = require("./routes/order.routes");
const openfoodfactsRoutes = require("./routes/openfoodfacts.routes");
const paypalRoutes = require("./routes/paypal.routes");
const favoritesRoutes = require("./routes/favorites.routes");

const isProduction = process.env.NODE_ENV === "production";
const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction) {
  app.set("trust proxy", 1);
}

// Use strict CORS in production and permissive CORS during local development.
app.use(
  cors({
    origin:
      isProduction && corsOrigins.length > 0
        ? corsOrigins
        : "*",
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// Reject insecure transport in production unless explicitly disabled.
app.use((req, res, next) => {
  if (!isProduction) {
    return next();
  }

  const allowInsecure = process.env.ALLOW_INSECURE_HTTP === "true";
  if (allowInsecure) {
    return next();
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const isHttps = req.secure || forwardedProto === "https";

  if (isHttps) {
    return next();
  }

  return res.status(426).json({
    message: "HTTPS is required in production.",
    code: "HTTPS_REQUIRED",
  });
});

// Logging middleware - log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/scanner", scannerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/openfoodfacts", openfoodfactsRoutes);
app.use("/api/paypal", paypalRoutes);
app.use("/api/favorites", favoritesRoutes);

// Test route
app.get("/api/test", (req, res) => {
  console.log("Test route hit");
  res.json({ message: "API is working!" });
});

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0"; // Listen on all network interfaces

const ensureAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@trinity.com";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      adminEmail,
    ]);

    if (existing.rows.length > 0) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      [adminUsername, adminEmail, passwordHash, "Admin", "User", "admin"],
    );

    console.log(`Admin user ensured for ${adminEmail}`);
  } catch (error) {
    console.error("Failed to ensure admin user:", error.message);
  }
};

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.log("Database connection failed", err);
  } else {
    console.log("Database connected successfully");
    ensureAdminUser();
  }
});

app.listen(PORT, HOST, () => {
  const protocol = isProduction ? "https" : "http";
  console.log(`Server running on ${protocol}://${HOST}:${PORT}`);
  if (!isProduction) {
    console.log("Nginx HTTPS API base: https://localhost:3443/api");
    console.log("Android emulator HTTPS API base: https://10.0.2.2:3443/api");
  }
});
