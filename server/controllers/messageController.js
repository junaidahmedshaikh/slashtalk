const { getConversationHistory, getRecentConversations, getGroupConversationHistory } = require("../models/messageModel");
const { ObjectId } = require("mongodb");

// Get conversation history 
const getConversationHistoryAPI = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "Both senderId and receiverId are required"
      });
    }

    const history = await getConversationHistory(
      senderId, 
      receiverId, 
      parseInt(limit), 
      parseInt(offset)
    );

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error("Error in getConversationHistoryAPI:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation history"
    });
  }
};

// Get recent conversations for a user
const getRecentConversationsAPI = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const conversations = await getRecentConversations(userId);

    res.json({
      success: true,
      data: conversations,
      count: conversations.length
    });
  } catch (error) {
    console.error("Error in getRecentConversationsAPI:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent conversations"
    });
  }
};

// Get group conversation history 
const getGroupConversationHistoryAPI = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required"
      });
    }

    const history = await getGroupConversationHistory(
      groupId, 
      parseInt(limit), 
      parseInt(offset)
    );

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error("Error in getGroupConversationHistoryAPI:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group conversation history"
    });
  }
};

module.exports = {
  getConversationHistoryAPI,
  getRecentConversationsAPI,
  getGroupConversationHistoryAPI
};
