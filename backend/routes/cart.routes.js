const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
} = require("../controllers/cart.controller");
const verifyToken = require("../middleware/auth");

router.get("/", verifyToken, getCart);
router.post("/add", verifyToken, addToCart);
router.put("/update/:id", verifyToken, updateCartItem);
router.delete("/remove/:id", verifyToken, removeFromCart);
router.delete("/clear", verifyToken, clearCart);

module.exports = router;
