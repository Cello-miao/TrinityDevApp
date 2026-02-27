const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { createOrder, getMyOrders } = require("../controllers/order.controller");

router.post("/", verifyToken, createOrder);
router.get("/me", verifyToken, getMyOrders);

module.exports = router;
