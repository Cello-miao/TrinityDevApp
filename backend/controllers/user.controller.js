const pool = require("../config/db");

const getAllUsers = async (req, res) => {
  try {
    const users = await pool.query(
      "SELECT id, username, email, first_name, last_name, phone_number, role, created_at FROM users",
    );
    res.status(200).json(users.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await pool.query(
      "SELECT id, username, email, first_name, last_name, phone_number, role, created_at FROM users WHERE id = $1",
      [id],
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const updated = await pool.query(
      "UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, role",
      [role, id],
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, username, email, first_name, last_name, phone_number, billing_address, billing_city, billing_country, role FROM users WHERE id = $1",
      [req.user.id],
    );
    res.status(200).json(user.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone_number,
      billing_address,
      billing_zip_code,
      billing_city,
      billing_country,
    } = req.body;
    const updated = await pool.query(
      `UPDATE users SET first_name=$1, last_name=$2, phone_number=$3, 
      billing_address=$4, billing_zip_code=$5, billing_city=$6, 
      billing_country=$7, updated_at=CURRENT_TIMESTAMP 
      WHERE id=$8 RETURNING id, username, email, first_name, last_name, role`,
      [
        first_name,
        last_name,
        phone_number,
        billing_address,
        billing_zip_code,
        billing_city,
        billing_country,
        req.user.id,
      ],
    );
    res.status(200).json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getProfile,
  updateProfile,
};
