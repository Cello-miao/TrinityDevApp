const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const saveRefreshToken = async (userId, token) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt],
  );
};

const register = async (req, res) => {
  const { username, email, password, first_name, last_name, phone_number } =
    req.body;
  try {
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );

    if (userExists.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Email or username already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users 
      (username, email, password_hash, first_name, last_name, phone_number) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, username, email, role`,
      [username, email, password_hash, first_name, last_name, phone_number],
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password_hash,
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user.rows[0]);
    const refreshToken = generateRefreshToken();

    await saveRefreshToken(user.rows[0].id, refreshToken);

    res.status(200).json({
      message: "Login successful",
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    const result = await pool.query(
      `SELECT rt.*, u.id as user_id, u.email, u.role 
       FROM refresh_tokens rt 
       JOIN users u ON u.id = rt.user_id 
       WHERE rt.token = $1`,
      [refreshToken],
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const tokenRow = result.rows[0];

    if (new Date() > new Date(tokenRow.expires_at)) {
      await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [
        refreshToken,
      ]);
      return res.status(403).json({ message: "Refresh token expired" });
    }

    const newAccessToken = generateAccessToken({
      id: tokenRow.user_id,
      email: tokenRow.email,
      role: tokenRow.role,
    });

    const newRefreshToken = generateRefreshToken();
    await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [
      refreshToken,
    ]);
    await saveRefreshToken(tokenRow.user_id, newRefreshToken);

    res.status(200).json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [
      refreshToken,
    ]);
  }

  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { register, login, refresh, logout };
