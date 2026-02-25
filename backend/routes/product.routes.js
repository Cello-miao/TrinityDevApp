const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post(
  "/",
  verifyToken,
  authorizeRoles("manager", "admin"),
  createProduct,
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("manager", "admin"),
  updateProduct,
);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteProduct);

module.exports = router;
