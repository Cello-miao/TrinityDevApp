const pool = require("../config/db");

const getCart = async (req, res) => {
  try {
    const cart = await pool.query(
      `SELECT cart.id, cart.product_id, products.name, products.price, products.picture, cart.quantity
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
    
    // Validate input
    if (!product_id || !quantity) {
      return res.status(400).json({ message: "product_id and quantity are required" });
    }
    
    const productIdNum = Number(product_id);
    const quantityNum = Number(quantity);
    
    if (!Number.isInteger(productIdNum) || productIdNum <= 0) {
      return res.status(400).json({ message: "Invalid product_id" });
    }
    
    if (!Number.isInteger(quantityNum) || quantityNum <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }
    
    // Check if product exists
    const productCheck = await pool.query(
      "SELECT id, name FROM products WHERE id = $1",
      [productIdNum]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    const existingItem = await pool.query(
      "SELECT * FROM cart WHERE user_id = $1 AND product_id = $2",
      [req.user.id, productIdNum],
    );
    
    if (existingItem.rows.length > 0) {
      const updated = await pool.query(
        "UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *",
        [quantityNum, req.user.id, productIdNum],
      );
      return res.status(200).json(updated.rows[0]);
    }
    
    const newItem = await pool.query(
      "INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, productIdNum, quantityNum],
    );
    res.status(201).json(newItem.rows[0]);
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Remove from cart request:', { id, userId: req.user.id });
    
    const result = await pool.query(
      "DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING *", 
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      console.error('Cart item not found for deletion:', { id, userId: req.user.id });
      return res.status(404).json({ message: "Cart item not found" });
    }
    
    console.log('Cart item removed successfully:', result.rows[0]);
    res.status(200).json({ message: "Item removed from cart", item: result.rows[0] });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    console.log('Update cart item request:', { id, quantity, body: req.body });
    
    // Validate quantity - must be a number and greater than 0
    const quantityNum = Number(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      console.error('Invalid quantity:', quantity);
      return res.status(400).json({ message: "Invalid quantity. Must be a positive number." });
    }
    
    const result = await pool.query(
      "UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *",
      [quantityNum, id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      console.error('Cart item not found:', { id, userId: req.user.id });
      return res.status(404).json({ message: "Cart item not found" });
    }
    
    console.log('Cart item updated successfully:', result.rows[0]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Update cart error:", error);
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

module.exports = { getCart, addToCart, removeFromCart, updateCartItem, clearCart };
