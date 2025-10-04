const { getDB } = require("../configs/db");
const { ObjectId } = require("mongodb");
const COLLECTION_NAME = "users";
// Create a new conversation
const createConversation = async (req, res) => {
  try {
    res.send("createConversation");
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const userId = req.userId;
    const users = await getDB()
      .collection(COLLECTION_NAME)
      .find(
        { _id: { $ne: new ObjectId(userId) } },
        { projection: { _id: 1, username: 1, avatarUrl: 1 } }
      )
      .toArray();
    res.send({ success: true, data: users });
  } catch (error) {
    console.log("Error: ", error.message);
  }
};

// Get one conversation by ID
const getConversationById = async (req, res) => {
  try {
    const id = req.params;
    console.log(id);
    res.send("getConversationById");
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete a conversation
const deleteConversation = async (req, res) => {
  try {
    res.send("deleteConversation");
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createConversation,
  getAllUsers,
  getConversationById,
  deleteConversation
};
