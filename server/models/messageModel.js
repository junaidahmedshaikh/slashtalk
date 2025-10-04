const { getDB } = require("../configs/db");
const { ObjectId } = require("mongodb");

const MESSAGES_COLLECTION = "messages";

// Save a new message to the database (supports both private and group messages)
const saveMessage = async (messageData) => {
  try {
    const db = getDB();
    if (!db) {
      throw new Error("Database not connected");
    }

    const message = {
      senderId: new ObjectId(messageData.senderId),
      message: messageData.message,
      timestamp: new Date(messageData.timestamp || Date.now()),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add either receiverId (for private messages) or groupId (for group messages)
    if (messageData.groupId) {
      message.groupId = new ObjectId(messageData.groupId);
      message.messageType = "group";

      // Add mention metadata for group messages
      if (messageData.mentions && messageData.mentions.length > 0) {
        message.mentions = messageData.mentions.map((id) => new ObjectId(id));
      }
      if (messageData.visibleToUserIds) {
        message.visibleToUserIds = messageData.visibleToUserIds.map(
          (id) => new ObjectId(id)
        );
      }
    } else if (messageData.receiverId) {
      message.receiverId = new ObjectId(messageData.receiverId);
      message.messageType = "private";
    }

    const result = await db.collection(MESSAGES_COLLECTION).insertOne(message);

    // Return the saved message with the generated ID
    return {
      _id: result.insertedId,
      ...message,
      senderId: message.senderId.toString(),
      receiverId: message.receiverId?.toString(),
      groupId: message.groupId?.toString(),
      mentions: message.mentions?.map((id) => id.toString()),
      visibleToUserIds: message.visibleToUserIds?.map((id) => id.toString()),
    };
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
};

// Get conversation history between two users
const getConversationHistory = async (
  senderId,
  receiverId,
  limit = 50,
  offset = 0
) => {
  try {
    const db = getDB();
    if (!db) {
      throw new Error("Database not connected");
    }

    const conversation = await db
      .collection(MESSAGES_COLLECTION)
      .find({
        $or: [
          {
            senderId: new ObjectId(senderId),
            receiverId: new ObjectId(receiverId),
          },
          {
            senderId: new ObjectId(receiverId),
            receiverId: new ObjectId(senderId),
          },
        ],
      })
      .sort({ timestamp: 1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Format the messages for the frontend
    return conversation.map((msg) => ({
      _id: msg._id,
      senderId: msg.senderId.toString(),
      receiverId: msg.receiverId.toString(),
      message: msg.message,
      timestamp: msg.timestamp,
      createdAt: msg.createdAt,
    }));
  } catch (error) {
    console.error("Error getting conversation history:", error);
    throw error;
  }
};

// Get recent conversations for a user (latest message from each conversation)
const getRecentConversations = async (userId) => {
  try {
    const db = getDB();
    if (!db) {
      throw new Error("Database not connected");
    }

    // Aggregate to get the latest message from each conversation
    const conversations = await db
      .collection(MESSAGES_COLLECTION)
      .aggregate([
        {
          $match: {
            $or: [
              { senderId: new ObjectId(userId) },
              { receiverId: new ObjectId(userId) },
            ],
          },
        },
        {
          $sort: { timestamp: -1 },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$senderId", new ObjectId(userId)] },
                "$receiverId",
                "$senderId",
              ],
            },
            latestMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$senderId", new ObjectId(userId)] },
                      { $eq: ["$isRead", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: 1,
            user: {
              _id: "$user._id",
              username: "$user.username",
              avatarUrl: "$user.avatarUrl",
            },
            latestMessage: {
              message: "$latestMessage.message",
              timestamp: "$latestMessage.timestamp",
              senderId: "$latestMessage.senderId",
            },
            unreadCount: 1,
          },
        },
        {
          $sort: { "latestMessage.timestamp": -1 },
        },
      ])
      .toArray();

    return conversations;
  } catch (error) {
    console.error("Error getting recent conversations:", error);
    throw error;
  }
};

// Get group conversation history with visibility filtering
const getGroupConversationHistory = async (
  groupId,
  userId,
  limit = 50,
  offset = 0
) => {
  try {
    const db = getDB();
    if (!db) {
      throw new Error("Database not connected");
    }

    const conversation = await db
      .collection(MESSAGES_COLLECTION)
      .aggregate([
        {
          $match: {
            groupId: new ObjectId(groupId),
            $or: [
              { visibleToUserIds: { $exists: false } }, // Messages visible to all
              { visibleToUserIds: null }, // Messages visible to all
              { visibleToUserIds: { $in: [new ObjectId(userId)] } }, // Messages visible to this user
            ],
          },
        },
        {
          $sort: { timestamp: 1 },
        },
        {
          $skip: offset,
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: "users",
            localField: "senderId",
            foreignField: "_id",
            as: "senderInfo",
          },
        },
        {
          $unwind: "$senderInfo",
        },
        {
          $project: {
            _id: 1,
            senderId: 1,
            groupId: 1,
            message: 1,
            timestamp: 1,
            createdAt: 1,
            senderName: "$senderInfo.username",
            senderAvatar: "$senderInfo.avatarUrl",
            mentions: 1,
            visibleToUserIds: 1,
            isPrivateMention: {
              $cond: [{ $ifNull: ["$visibleToUserIds", false] }, true, false],
            },
          },
        },
      ])
      .toArray();

    // Format the messages for the frontend
    return conversation.map((msg) => ({
      _id: msg._id,
      senderId: msg.senderId.toString(),
      groupId: msg.groupId.toString(),
      message: msg.message,
      timestamp: msg.timestamp,
      createdAt: msg.createdAt,
      senderName: msg.senderName,
      senderAvatar: msg.senderAvatar,
      mentions: msg.mentions?.map((id) => id.toString()),
      isPrivateMention: msg.isPrivateMention,
    }));
  } catch (error) {
    console.error("Error getting group conversation history:", error);
    throw error;
  }
};

module.exports = {
  saveMessage,
  getConversationHistory,
  getRecentConversations,
  getGroupConversationHistory,
};
