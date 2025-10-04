const express = require("express");
const router = express.Router();
const {
  createGroupAPI,
  getGroupDetailsAPI,
  getUserGroupsAPI,
  addMemberAPI,
  removeMemberAPI,
  updateGroupAPI,
  promoteToAdminAPI
} = require("../controllers/groupController");
const authMiddleware = require("../middlewares/authMiddleware");

// Create a new group
router.post("/groups", authMiddleware, createGroupAPI);

// Get group details
router.get("/groups/:groupId", authMiddleware, getGroupDetailsAPI);

// Get all groups for a user
router.get("/users/:userId/groups", authMiddleware, getUserGroupsAPI);

// Add member to group
router.post("/groups/:groupId/members", authMiddleware, addMemberAPI);

// Remove member from group
router.delete("/groups/:groupId/members/:userId", authMiddleware, removeMemberAPI);

// Update group
router.put("/groups/:groupId", authMiddleware, updateGroupAPI);

// Promote member to admin
router.post("/groups/:groupId/admins", authMiddleware, promoteToAdminAPI);

module.exports = router;