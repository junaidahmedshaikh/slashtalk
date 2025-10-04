const { connectToDB, getDB } = require("../configs/db");
require("dotenv").config();

async function createMessageIndexes() {
  try {
    // Connect to database
    await connectToDB();
    const db = getDB();

    if (!db) {
      throw new Error("Database not connected");
    }

    const messagesCollection = db.collection("messages");

    // Create compound index for efficient conversation queries
    await messagesCollection.createIndex(
      {
        senderId: 1,
        receiverId: 1,
        timestamp: 1,
      },
      {
        name: "conversation_timestamp_idx",
        background: true,
      }
    );

    // Create index for sender queries
    await messagesCollection.createIndex(
      { senderId: 1, timestamp: -1 },
      {
        name: "sender_timestamp_idx",
        background: true,
      }
    );

    // Create index for receiver queries
    await messagesCollection.createIndex(
      { receiverId: 1, timestamp: -1 },
      {
        name: "receiver_timestamp_idx",
        background: true,
      }
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating message indexes:", error);
    process.exit(1);
  }
}

// Run the script
createMessageIndexes();
