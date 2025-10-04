import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { BACKEND_BASE_URL } from "../utils/constant";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children, userId, username }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const currentRoomRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!userId) return;

    // Create socket with reconnection options
    const socket = io(BACKEND_BASE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      //   console.log("Socket connected:", socket.id);
      setIsConnected(true);

      // Rejoin previous room if exists
      if (currentRoomRef.current) {
        const { type, ...roomData } = currentRoomRef.current;
        if (type === "private") {
          socket.emit("joinChat", roomData);
        } else if (type === "group") {
          socket.emit("joinGroup", roomData);
        }
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("Reconnection attempt:", attemptNumber);
    });

    socket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("Reconnection failed");
    });

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        //   console.log("Page visible - checking connection");
        if (!socket.connected) {
          socket.connect();
        }
        // Rejoin current room
        if (currentRoomRef.current) {
          const { type, ...roomData } = currentRoomRef.current;
          if (type === "private") {
            socket.emit("joinChat", roomData);
          } else if (type === "group") {
            socket.emit("joinGroup", roomData);
          }
        }
      } else {
        //   console.log("Page hidden");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Handle focus/blur
    const handleFocus = () => {
      if (!socket.connected) {
        socket.connect();
      }
    };

    window.addEventListener("focus", handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]);

  // Join private chat room
  const joinPrivateChat = (senderId, receiverId, username) => {
    if (!socketRef.current) return;

    // Leave previous room
    if (currentRoomRef.current?.type === "group") {
      socketRef.current.emit("leaveGroup", {
        groupId: currentRoomRef.current.groupId,
      });
    } else if (currentRoomRef.current?.type === "private") {
      socketRef.current.emit("leaveRoom");
    }

    // Join new room
    currentRoomRef.current = {
      type: "private",
      username,
      senderId,
      receiverId,
    };

    socketRef.current.emit("joinChat", {
      username,
      senderId,
      receiverId,
    });
  };

  // Join group chat room
  const joinGroupChat = (userId, groupId, username) => {
    if (!socketRef.current) return;

    // Leave previous room
    if (currentRoomRef.current?.type === "group") {
      socketRef.current.emit("leaveGroup", {
        groupId: currentRoomRef.current.groupId,
      });
    } else if (currentRoomRef.current?.type === "private") {
      socketRef.current.emit("leaveRoom");
    }

    // Join new room
    currentRoomRef.current = {
      type: "group",
      username,
      userId,
      groupId,
    };

    socketRef.current.emit("joinGroup", {
      username,
      userId,
      groupId,
    });
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    joinPrivateChat,
    joinGroupChat,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
