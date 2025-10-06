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

  useEffect(() => {
    if (!userId) return;

    const socket = io(BACKEND_BASE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);

      if (currentRoomRef.current) {
        const { type, ...roomData } = currentRoomRef.current;
        if (type === "private") {
          socket.emit("joinChat", roomData);
        } else if (type === "group") {
          socket.emit("joinGroup", roomData);
        }
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    socket.on("reconnect", () => {
      setIsConnected(true);
    });

    socket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed");
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!socket.connected) {
          socket.connect();
        }
        if (currentRoomRef.current) {
          const { type, ...roomData } = currentRoomRef.current;
          if (type === "private") {
            socket.emit("joinChat", roomData);
          } else if (type === "group") {
            socket.emit("joinGroup", roomData);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleFocus = () => {
      if (!socket.connected) {
        socket.connect();
      }
    };

    window.addEventListener("focus", handleFocus);

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

  const joinPrivateChat = (senderId, receiverId, username) => {
    if (!socketRef.current) return;

    if (currentRoomRef.current?.type === "group") {
      socketRef.current.emit("leaveGroup", {
        groupId: currentRoomRef.current.groupId,
      });
    } else if (currentRoomRef.current?.type === "private") {
      socketRef.current.emit("leaveRoom");
    }

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

  const joinGroupChat = (userId, groupId, username) => {
    if (!socketRef.current) return;

    if (currentRoomRef.current?.type === "group") {
      socketRef.current.emit("leaveGroup", {
        groupId: currentRoomRef.current.groupId,
      });
    } else if (currentRoomRef.current?.type === "private") {
      socketRef.current.emit("leaveRoom");
    }

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
