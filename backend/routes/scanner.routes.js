const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const {
  findProductByBarcode,
  scanAndAddToCart,
} = require("../controllers/scanner.controller");

router.post("/lookup", findProductByBarcode);
router.post("/add-to-cart", verifyToken, scanAndAddToCart);

module.exports = router;
