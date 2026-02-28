const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");
const { createOrder, getMyOrders, getAllOrders } = require("../controllers/order.controller");

router.post("/", verifyToken, createOrder);
router.get("/me", verifyToken, getMyOrders);
router.get("/", verifyToken, authorizeRoles("admin"), getAllOrders);

module.exports = router;
