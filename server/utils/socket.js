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

  // Socket.IO logic
  io.on("connection", (socket) => {
    socket.on("joinChat", ({ username, senderId, receiverId }) => {
      const roomId = [senderId, receiverId].sort().join("_");
      socket.join(roomId);
      socket.userId = senderId; // Store userId on socket
      console.log(`User ${username} joined chat room: ${roomId}`);
    });

    socket.on("joinGroup", ({ username, userId, groupId }) => {
      socket.join(`group_${groupId}`);
      socket.userId = userId; // Store userId on socket
      console.log(`User ${username} joined group: ${groupId}`);

      // Notify other members
      socket.to(`group_${groupId}`).emit("userJoinedGroup", {
        userId,
        username,
      });
    });

    socket.on("leaveGroup", ({ groupId }) => {
      socket.leave(`group_${groupId}`);
      console.log(`User left group: ${groupId}`);
    });

    socket.on("leaveRoom", () => {
      // Leave all rooms for this socket
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
      console.log(`User left all chat rooms`);
    });

    socket.on("getConversation", async ({ senderId, receiverId }) => {
      try {
        console.log(
          `Requested conversation history for ${senderId} and ${receiverId}`
        );

        // Get conversation history from database
        const history = await getConversationHistory(senderId, receiverId);

        // Send conversation history to the client
        socket.emit("conversationHistory", history);
        console.log(`Sent ${history.length} messages to client`);
      } catch (error) {
        console.error("Error fetching conversation history:", error);
        socket.emit("conversationHistory", []);
      }
    });

    socket.on("getGroupConversation", async ({ groupId }) => {
      try {
        // console.log(
        //   `Requested group conversation history for group ${groupId}`
        // );

        // Get group conversation history from database
        const history = await getGroupConversationHistory(
          groupId,
          socket.userId
        );

        // Send conversation history to the client
        socket.emit("groupConversationHistory", history);
        // console.log(`Sent ${history.length} group messages to client`);
      } catch (error) {
        console.error("Error fetching group conversation history:", error);
        socket.emit("groupConversationHistory", []);
      }
    });

    socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
      try {
        const roomId = [senderId, receiverId].sort().join("_");

        // Save message to database
        const savedMessage = await saveMessage({
          senderId,
          receiverId,
          message,
          timestamp: new Date().toISOString(),
        });

        // console.log(`Message saved to database with ID: ${savedMessage._id}`);

        // Send message to receiver client
        io.to(roomId).emit("messageReceived", {
          senderId,
          receiverId,
          message,
          timestamp: savedMessage.timestamp,
          messageId: savedMessage._id,
        });

        // console.log(
        //   `Message sent from ${senderId} to ${receiverId}: ${message}`
        // );
      } catch (error) {
        console.error("Error saving or sending message:", error);

        // Still try to send the message even if saving failed
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
        console.log(`=== SENDING GROUP MESSAGE ===`);
        console.log(
          `Sender: ${senderId}, Group: ${groupId}, Message: "${message}"`
        );

        // Parse mentions from the message (e.g., @username)
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;

        while ((match = mentionRegex.exec(message)) !== null) {
          mentions.push(match[1]); // Extract username without @
        }

        console.log("Parsed mentions:", mentions);

        // If message contains mentions, it should only be visible to sender and mentioned users
        let visibleToUserIds = [senderId]; // Always visible to sender
        let mentionedUserIds = [];

        if (mentions.length > 0) {
          console.log("Message contains mentions, processing...");

          // Get group details to verify mentioned users are group members
          const group = await getGroupById(groupId);
          console.log("Group details:", group ? "Found" : "Not found");

          if (group) {
            console.log(
              "Group members:",
              group.members.map((m) => m._id.toString())
            );

            // Find mentioned users from group members
            const db = getDB();

            // Debug
            console.log("Searching for usernames:", mentions);
            console.log(
              "In group members:",
              group.members.map((m) => m._id.toString())
            );

            const allMentionedUsers = await db
              .collection("users")
              .find({
                username: { $in: mentions },
              })
              .toArray();

            console.log(
              "All users with mentioned usernames:",
              allMentionedUsers.map((u) => ({
                id: u._id.toString(),
                username: u.username,
              }))
            );

            // Now filter to only include group members
            // Convert group members to strings for comparison
            const groupMemberIds = group.members.map((member) =>
              member._id.toString()
            );
            console.log("Group member IDs (as strings):", groupMemberIds);

            const mentionedUsers = allMentionedUsers.filter((user) =>
              groupMemberIds.includes(user._id.toString())
            );

            console.log(
              "Found mentioned users in DB (filtered by group membership):",
              mentionedUsers.map((u) => ({
                id: u._id.toString(),
                username: u.username,
              }))
            );

            // If no mentioned users found, let's debug further
            if (mentionedUsers.length === 0 && allMentionedUsers.length > 0) {
              console.log("⚠️ Mentioned users found but not in group members");
              console.log(
                "Mentioned users:",
                allMentionedUsers.map((u) => ({
                  id: u._id.toString(),
                  username: u.username,
                }))
              );
              console.log("Group members (as strings):", groupMemberIds);
            } else if (allMentionedUsers.length === 0) {
              console.log("⚠️ No users found with mentioned usernames");
              console.log("Searched for usernames:", mentions);

              const allUsers = await db.collection("users").find({}).toArray();
              console.log(
                "All users in database:",
                allUsers.map((u) => ({
                  id: u._id.toString(),
                  username: u.username,
                }))
              );
            }

            mentionedUserIds = mentionedUsers.map((u) => u._id.toString());
            visibleToUserIds = [...visibleToUserIds, ...mentionedUserIds];

            console.log("Mentioned user IDs:", mentionedUserIds);
            console.log("Visible to user IDs:", visibleToUserIds);
          }
        }

        // Save group message with mention metadata
        const savedMessage = await saveMessage({
          senderId,
          groupId,
          message,
          timestamp: new Date().toISOString(),
          mentions: mentionedUserIds,
          visibleToUserIds: mentions.length > 0 ? visibleToUserIds : null, // null means visible to all
        });

        console.log(
          `Group message saved to database with ID: ${savedMessage._id}`
        );

        // Get sender info
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

        // If message has mentions, only send to sender and mentioned users
        if (mentions.length > 0 && visibleToUserIds.length > 0) {
          console.log("Sending mention message to specific users...");
          // Send to each visible user individually
          const socketsInRoom = await io.in(roomId).fetchSockets();
          console.log(
            `Found ${socketsInRoom.length} sockets in room ${roomId}`
          );

          let sentCount = 0;
          const sentToUsers = new Set();

          // Log all sockets in the room for debugging
          console.log("All sockets in room:");
          for (const sock of socketsInRoom) {
            console.log(
              `  - Socket ID: ${sock.id}, User ID: ${
                sock.userId
              }, Rooms: ${Array.from(sock.rooms)}`
            );
          }

          for (const sock of socketsInRoom) {
            console.log(
              `Checking socket - User ID: ${
                sock.userId
              }, Should see: ${visibleToUserIds.includes(sock.userId)}`
            );

            // Check if this socket's user should see the message
            if (sock.userId && visibleToUserIds.includes(sock.userId)) {
              console.log(`✅ Sending message to user: ${sock.userId}`);
              sock.emit("groupMessageReceived", messageData);
              sentToUsers.add(sock.userId);
              sentCount++;
            } else {
              console.log(
                `❌ Skipping user: ${sock.userId} (not in visible list)`
              );
            }
          }

          // Check if we missed any mentioned users who might not be in the room
          const missedUsers = visibleToUserIds.filter(
            (id) => !sentToUsers.has(id)
          );
          if (missedUsers.length > 0) {
            console.log("⚠️ Users not currently in room:", missedUsers);
            console.log(
              "These users will get the message when they join the group and request conversation history"
            );

            // Try to find these users in other rooms and send them the message
            for (const missedUserId of missedUsers) {
              console.log(`Looking for user ${missedUserId} in other rooms...`);

              // Get all connected sockets
              const allSockets = await io.fetchSockets();
              const userSocket = allSockets.find(
                (sock) => sock.userId === missedUserId
              );

              if (userSocket) {
                console.log(
                  `✅ Found user ${missedUserId} in another room, sending message`
                );
                userSocket.emit("groupMessageReceived", messageData);
                sentToUsers.add(missedUserId);
                sentCount++;
              } else {
                console.log(`❌ User ${missedUserId} not found in any room`);
              }
            }
          }

          console.log(`Sent mention message to ${sentCount} users`);
        } else {
          console.log("Sending normal message to all group members...");
          io.to(roomId).emit("groupMessageReceived", messageData);
        }

        console.log(`=== MESSAGE SENDING COMPLETE ===`);
      } catch (error) {
        console.error("Error saving or sending group message:", error);

        // Still try to send the message even if saving failed
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
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
}

module.exports = initializeSocket;
