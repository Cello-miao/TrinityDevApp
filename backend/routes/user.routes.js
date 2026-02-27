const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getProfile,
  updateProfile,
} = require("../controllers/user.controller");
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");

router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.get("/", verifyToken, authorizeRoles("admin"), getAllUsers);
router.get("/:id", verifyToken, authorizeRoles("admin"), getUserById);
router.put("/:id/role", verifyToken, authorizeRoles("admin"), updateUserRole);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteUser);

module.exports = router;
