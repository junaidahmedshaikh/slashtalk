import { useState, useRef, useMemo, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { Smile, Paperclip, Send } from "lucide-react";
import { useSocket } from "../contexts/SocketContext";
import { useSelector } from "react-redux";
import { EmojiModal } from "./modal/EmojiModal";

const ChatWindow = ({ selectedUserId, users }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [receiverId, setReceiverId] = useState(selectedUserId);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const endRef = useRef(null);

  const userInfo = useSelector((state) => state.user);
  const senderId = userInfo?._id;
  const { socket, isConnected, joinPrivateChat } = useSocket();

  // Update receiverId when selectedUserId changes
  useEffect(() => {
    if (selectedUserId && selectedUserId !== receiverId) {
      setReceiverId(selectedUserId);
      setMessages([]); // Clear messages when switching users
    }
  }, [selectedUserId, receiverId]);

  const receiverClient = useMemo(
    () => users?.find((u) => u._id === receiverId),
    [receiverId, users]
  );

  // Set up socket listeners
  useEffect(() => {
    if (!socket || !senderId) return;

    // Listen for incoming messages
    const handleMessageReceived = ({
      senderId: msgSenderId,
      message: recMsg,
      timestamp,
    }) => {
      console.log("Message received:", recMsg);

      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          from: msgSenderId === senderId ? "me" : "other",
          text: recMsg,
          time: new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    };

    // Listen for conversation history
    const handleConversationHistory = (history) => {
      console.log("Conversation history received:", history);
      if (Array.isArray(history)) {
        const formattedMessages = history.map((msg) => ({
          id: msg._id || `m_${Date.now()}_${Math.random()}`,
          from: msg.senderId === senderId ? "me" : "other",
          text: msg.message,
          time: new Date(msg.createdAt || msg.timestamp).toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
        }));
        setMessages(formattedMessages);
      }
    };

    socket.on("messageReceived", handleMessageReceived);
    socket.on("conversationHistory", handleConversationHistory);

    // Cleanup listeners
    return () => {
      socket.off("messageReceived", handleMessageReceived);
      socket.off("conversationHistory", handleConversationHistory);
    };
  }, [socket, senderId]);

  // Handle receiverId changes and socket room management
  useEffect(() => {
    if (!receiverId || !senderId || !socket || !isConnected) return;

    // Join the chat room for the new receiver
    joinPrivateChat(senderId, receiverId, userInfo.username);

    // Reset messages when switch to a different receiver
    setMessages([]);

    // Request conversation history for this specific chat
    socket.emit("getConversation", {
      senderId,
      receiverId,
    });
  }, [
    receiverId,
    senderId,
    socket,
    isConnected,
    userInfo?.username,
    joinPrivateChat,
  ]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected) return;
    const messageText = newMessage.trim();
    // Emit message to server
    socket.emit("sendMessage", {
      senderId,
      receiverId,
      message: messageText,
    });
    setNewMessage("");
  };

  const addEmoji = (emoji) => {
    setNewMessage((prev) => {
      const newMsg = prev + emoji;
      return newMsg;
    });
    setShowEmojiPicker(false);
  };

  return (
    <>
      <section className="min-h-[calc(100dvh-56px)] lg:min-h-dvh bg-white dark:bg-gray-950">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/70 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src={receiverClient?.avatarUrl || "/user-avatar.png"}
              alt={`${receiverClient?.username || "User"} avatar`}
              className="h-9 w-9 rounded-full"
            />
            <div>
              <p className="font-semibold leading-tight">
                {receiverClient?.username}
              </p>
              {!isConnected && (
                <p className="text-xs text-amber-500 dark:text-amber-400 leading-tight">
                  Reconnecting...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[calc(100dvh-56px-64px-16px)] lg:h-[calc(100dvh-64px-80px-16px)] overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 dark:bg-gray-900">
          {messages?.map((m) => (
            <MessageBubble
              key={m.id}
              from={m.from}
              text={m.text}
              time={m.time}
            />
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSendMessage}
          className="px-4 pb-4 pt-2 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-end gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2">
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              title="Emoji"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={20} />
            </button>
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              title="Attach"
            >
              <Paperclip size={20} />
            </button>
            <textarea
              rows={1}
              onChange={(e) => setNewMessage(e.target.value)}
              value={newMessage}
              placeholder="Type a message"
              className="min-h-[40px] max-h-32 flex-1 resize-none bg-transparent outline-none px-1 py-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={!isConnected}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-white shadow hover:opacity-95 transition disabled:opacity-50"
              title="Send"
              disabled={!isConnected}
            >
              <Send size={18} />
              <span className="sr-only">Send</span>
            </button>
          </div>
        </form>
        {showEmojiPicker && (
          <EmojiModal
            onEmojiSelect={addEmoji}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </section>
    </>
  );
};

export default ChatWindow;
