const pool = require("../config/db");

const getCart = async (req, res) => {
  try {
    const cart = await pool.query(
      `SELECT cart.id, products.name, products.price, products.picture, cart.quantity
      FROM cart JOIN products ON cart.product_id = products.id
      WHERE cart.user_id = $1`,
      [req.user.id],
    );
    res.status(200).json(cart.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const existingItem = await pool.query(
      "SELECT * FROM cart WHERE user_id = $1 AND product_id = $2",
      [req.user.id, product_id],
    );
    if (existingItem.rows.length > 0) {
      const updated = await pool.query(
        "UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *",
        [quantity, req.user.id, product_id],
      );
      return res.status(200).json(updated.rows[0]);
    }
    const newItem = await pool.query(
      "INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, product_id, quantity],
    );
    res.status(201).json(newItem.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM cart WHERE id = $1 AND user_id = $2", [
      id,
      req.user.id,
    ]);
    res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    await pool.query("DELETE FROM cart WHERE user_id = $1", [req.user.id]);
    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getCart, addToCart, removeFromCart, clearCart };
