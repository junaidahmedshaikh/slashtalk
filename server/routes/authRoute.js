const express = require("express");
const router = express.Router();
const {
  registerUser,
  findUser,
  logoutUser,
} = require("../controllers/userController");

// create user
router.post("/register", registerUser);
// accessToken
router.post("/login", findUser);
// invalidate refresh token
router.post("/logout", logoutUser);

module.exports = router;
