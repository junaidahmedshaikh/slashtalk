const { Server } = require("socket.io");
const {
  saveMessage,
  getConversationHistory,
  getGroupConversationHistory,
} = require("../models/messageModel");
const { getGroupById } = require("../models/groupModel");
const { getDB } = require("../configs/db");
const { ObjectId } = require("mongodb");

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ["http://10.10.15.171:5173", "http://localhost:5173"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", ({ username, senderId, receiverId }) => {
      const roomId = [senderId, receiverId].sort().join("_");
      socket.join(roomId);
      socket.userId = senderId;
    });

    socket.on("joinGroup", ({ username, userId, groupId }) => {
      socket.join(`group_${groupId}`);
      socket.userId = userId;

      // Notify other members
      socket.to(`group_${groupId}`).emit("userJoinedGroup", {
        userId,
        username,
      });
    });

    socket.on("leaveGroup", ({ groupId }) => {
      socket.leave(`group_${groupId}`);
    });

    socket.on("leaveRoom", () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
    });

    socket.on("getConversation", async ({ senderId, receiverId }) => {
      try {
        const history = await getConversationHistory(senderId, receiverId);
        socket.emit("conversationHistory", history);
      } catch (error) {
        console.error("Error fetching conversation history:", error);
        socket.emit("conversationHistory", []);
      }
    });

    socket.on("getGroupConversation", async ({ groupId }) => {
      try {
        const history = await getGroupConversationHistory(
          groupId,
          socket.userId
        );
        socket.emit("groupConversationHistory", history);
      } catch (error) {
        console.error("Error fetching group conversation history:", error);
        socket.emit("groupConversationHistory", []);
      }
    });

    socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
      try {
        const roomId = [senderId, receiverId].sort().join("_");

        const savedMessage = await saveMessage({
          senderId,
          receiverId,
          message,
          timestamp: new Date().toISOString(),
        });

        io.to(roomId).emit("messageReceived", {
          senderId,
          receiverId,
          message,
          timestamp: savedMessage.timestamp,
          messageId: savedMessage._id,
        });
      } catch (error) {
        console.error("Error saving or sending message:", error);

        const roomId = [senderId, receiverId].sort().join("_");
        io.to(roomId).emit("messageReceived", {
          senderId,
          receiverId,
          message,
          timestamp: new Date().toISOString(),
          error: "Failed to save message",
        });
      }
    });

    socket.on("sendGroupMessage", async ({ senderId, groupId, message }) => {
      try {
        const roomId = `group_${groupId}`;

        // Parse mentions from the message (e.g., @username)
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;

        while ((match = mentionRegex.exec(message)) !== null) {
          mentions.push(match[1]);
        }

        let visibleToUserIds = [senderId];
        let mentionedUserIds = [];

        if (mentions.length > 0) {
          const group = await getGroupById(groupId);

          if (group) {
            const db = getDB();
            const allMentionedUsers = await db
              .collection("users")
              .find({
                username: { $in: mentions },
              })
              .toArray();

            const groupMemberIds = group.members.map((member) =>
              member._id.toString()
            );

            const mentionedUsers = allMentionedUsers.filter((user) =>
              groupMemberIds.includes(user._id.toString())
            );

            mentionedUserIds = mentionedUsers.map((u) => u._id.toString());
            visibleToUserIds = [...visibleToUserIds, ...mentionedUserIds];
          }
        }

        const savedMessage = await saveMessage({
          senderId,
          groupId,
          message,
          timestamp: new Date().toISOString(),
          mentions: mentionedUserIds,
          visibleToUserIds: mentions.length > 0 ? visibleToUserIds : null,
        });

        const db = getDB();
        const sender = await db
          .collection("users")
          .findOne({ _id: new ObjectId(senderId) });

        const messageData = {
          senderId,
          groupId,
          message,
          timestamp: savedMessage.timestamp,
          messageId: savedMessage._id,
          senderName: sender?.username,
          senderAvatar: sender?.avatarUrl,
          mentions: mentionedUserIds,
          isPrivateMention: mentions.length > 0,
        };

        if (mentions.length > 0 && visibleToUserIds.length > 0) {
          const socketsInRoom = await io.in(roomId).fetchSockets();
          const sentToUsers = new Set();

          for (const sock of socketsInRoom) {
            if (sock.userId && visibleToUserIds.includes(sock.userId)) {
              sock.emit("groupMessageReceived", messageData);
              sentToUsers.add(sock.userId);
            }
          }

          // Check for users not currently in room
          const missedUsers = visibleToUserIds.filter(
            (id) => !sentToUsers.has(id)
          );

          if (missedUsers.length > 0) {
            const allSockets = await io.fetchSockets();
            for (const missedUserId of missedUsers) {
              const userSocket = allSockets.find(
                (sock) => sock.userId === missedUserId
              );

              if (userSocket) {
                userSocket.emit("groupMessageReceived", messageData);
              }
            }
          }
        } else {
          io.to(roomId).emit("groupMessageReceived", messageData);
        }
      } catch (error) {
        console.error("Error saving or sending group message:", error);

        const roomId = `group_${groupId}`;
        io.to(roomId).emit("groupMessageReceived", {
          senderId,
          groupId,
          message,
          timestamp: new Date().toISOString(),
          error: "Failed to save message",
        });
      }
    });

    socket.on("disconnect", () => {
      // Minimal disconnect logging
    });
  });
}

module.exports = initializeSocket;
