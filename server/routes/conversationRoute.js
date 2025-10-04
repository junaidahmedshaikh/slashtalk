const express = require("express");
const {
  getAllUsers,
} = require("../controllers/conversationController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();


// Get all users
router.get("/getAllUsers", authMiddleware, getAllUsers);

module.exports = router;
