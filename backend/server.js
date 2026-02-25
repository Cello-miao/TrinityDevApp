const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const userRoutes = require("./routes/user.routes");

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 3000;

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.log("Database connection failed", err);
  } else {
    console.log("Database connected successfully");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
