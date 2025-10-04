const express = require("express");
const router = express.Router();
const { 
  verifyUser, 
  updateUserProfile, 
  getUserById, 
  searchUsers 
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

// Get current user profile
router.get("/me", authMiddleware, verifyUser);

// Update current user profile
router.put("/me", authMiddleware, updateUserProfile);

// Search users (for adding to groups) - must come before /:id route
router.get("/search", authMiddleware, searchUsers);

// Get user by ID (for profile viewing)
router.get("/:id", authMiddleware, getUserById);

module.exports = router;
