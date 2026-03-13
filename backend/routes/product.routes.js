const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getDiscountedProducts,
  updateProductDiscount,
  getRecommendedProducts,
} = require("../controllers/product.controller");
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");

router.get("/", getAllProducts);
router.get("/recommendations", verifyToken, getRecommendedProducts);
router.get("/discounted/list", getDiscountedProducts);
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
router.patch(
  "/:id/discount",
  verifyToken,
  authorizeRoles("manager", "admin"),
  updateProductDiscount,
);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteProduct);

module.exports = router;
