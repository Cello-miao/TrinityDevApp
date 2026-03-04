require("dotenv").config();
const pool = require("./config/db");
const bcrypt = require("bcrypt");

const seedAdmin = async () => {
  try {
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      "admin@trinity.com",
    ]);

    if (existing.rows.length > 0) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash("admin123", salt);

    await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        "trinityadmin",
        "admin@trinity.com",
        password_hash,
        "Admin",
        "User",
        "admin",
      ],
    );

    console.log("Admin user created!");
    console.log("Email:    admin@trinity.com");
    console.log("Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seedAdmin();
