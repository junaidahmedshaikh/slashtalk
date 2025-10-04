const express = require("express");
const router = express.Router();
const { getConversationHistoryAPI, getRecentConversationsAPI, getGroupConversationHistoryAPI } = require("../controllers/messageController");
const authMiddleware = require("../middlewares/authMiddleware");

// send message (for fallback; prefer socket)
router.post("/conversations/:id/messages", async (req, res) => {
  try {
    res.send("send message");
  } catch (error) {
    console.log("Error: ", error.message);
  }
});

// edit message
router.put("/messages/:id", async (req, res) => {
  try {
    res.send("Eidt message");
  } catch (error) {
    console.log("Error: ", error.message);
  }
});

// delete message
router.delete("/messages/:id", async (req, res) => {
  try {
    res.send("Delete message");
  } catch (error) {
    console.log("Error: ", error.message);
  }
});

// Get conversation history between two users
router.get(
  "/conversations/:senderId/:receiverId/messages",
  authMiddleware,
  getConversationHistoryAPI
);

// Get recent conversations for a user
router.get(
  "/users/:userId/conversations",
  authMiddleware,
  getRecentConversationsAPI
);

// Get group conversation history
router.get(
  "/groups/:groupId/messages",
  authMiddleware,
  getGroupConversationHistoryAPI
);

module.exports = router;
