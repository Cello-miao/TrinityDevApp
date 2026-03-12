const pool = require("../config/db");

// Get user's favorites
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await pool.query(
      `SELECT p.* FROM products p
       INNER JOIN favorites f ON p.id = f.product_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.status(200).json(favorites.rows);
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add product to favorites
const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists
    const productCheck = await pool.query(
      "SELECT id FROM products WHERE id = $1",
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if already favorited
    const existingFavorite = await pool.query(
      "SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2",
      [userId, product_id]
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(409).json({ message: "Product already in favorites" });
    }

    // Add to favorites
    const newFavorite = await pool.query(
      `INSERT INTO favorites (user_id, product_id)
       VALUES ($1, $2) RETURNING *`,
      [userId, product_id]
    );

    res.status(201).json({
      message: "Added to favorites",
      favorite: newFavorite.rows[0],
    });
  } catch (error) {
    console.error("Add favorite error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remove product from favorites
const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.params;

    if (!product_id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const result = await pool.query(
      "DELETE FROM favorites WHERE user_id = $1 AND product_id = $2 RETURNING *",
      [userId, product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.status(200).json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Check if product is favorited
const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.params;

    const favorite = await pool.query(
      "SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2",
      [userId, product_id]
    );

    res.status(200).json({ isFavorite: favorite.rows.length > 0 });
  } catch (error) {
    console.error("Check favorite error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
};
