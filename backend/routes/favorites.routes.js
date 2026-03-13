const express = require("express");
const router = express.Router();
const {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} = require("../controllers/favorites.controller");
const verifyToken = require("../middleware/auth");

// All routes require authentication
router.get("/", verifyToken, getFavorites);
router.post("/", verifyToken, addFavorite);
router.delete("/:product_id", verifyToken, removeFavorite);
router.get("/check/:product_id", verifyToken, checkFavorite);

module.exports = router;
