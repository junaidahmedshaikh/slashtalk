"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  Search,
  LogOut,
  Users,
  Plus,
  User,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/theme-toggle";
import { BACKEND_BASE_URL } from "../utils/constant";
import { useSelector } from "react-redux";
import ChatWindow from "../components/ChatWindow";
import GroupChatWindow from "../components/GroupChatWindow";
import ChatWindowSkeleton from "../shimmer/ChatWindowSkeleton";
import { CreateGroupModal } from "../components/modal/CreateGroupModal";
import { UserProfileModal } from "../components/modal/UserProfileModal";
import { UserProfileViewModal } from "../components/modal/UserProfileViewModal";
import { SocketProvider } from "../contexts/SocketContext";

function ChatPage() {
  const [users, setUsers] = useState([]); // raw fetched users
  const [groups, setGroups] = useState([]); // user's groups
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState();
  const [selectedGroupId, setSelectedGroupId] = useState();
  const [chatType, setChatType] = useState("private"); // 'private' or 'group'
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showUserProfileView, setShowUserProfileView] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("chats"); // 'chats' or 'groups'
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/getAllUsers`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        const users = await res.json();
        setUsers(users.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch user groups
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user?._id) return;

      try {
        const res = await fetch(
          `${BACKEND_BASE_URL}/users/${user._id}/groups`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );
        const data = await res.json();
        if (data.success) {
          setGroups(data.data);
        }
      } catch (err) {
        console.error("Error fetching groups:", err);
      }
    };

    fetchGroups();
  }, [user?._id]);

  // Filter users
  const filteredUsers = useMemo(() => {
    const q = query ? query.toLowerCase() : "";
    return Array.isArray(users)
      ? users.filter((u) =>
          u.username && typeof u.username === "string"
            ? u.username.toLowerCase().includes(q)
            : false
        )
      : [];
  }, [query, users]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    const q = query ? query.toLowerCase() : "";
    return Array.isArray(groups)
      ? groups.filter((g) =>
          g.name && typeof g.name === "string"
            ? g.name.toLowerCase().includes(q)
            : false
        )
      : [];
  }, [query, groups]);

  const handleSignOut = async () => {
    try {
      await fetch(`${BACKEND_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    setSelectedGroupId(null);
    setChatType("private");
    setSidebarOpen(false);
  };

  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setSelectedUserId(null);
    setChatType("group");
    setSidebarOpen(false);
  };

  const handleGroupCreated = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
    handleSelectGroup(newGroup._id);
  };

  const handleGroupUpdated = () => {
    // Refetch groups when they are updated
    const fetchGroups = async () => {
      if (!user?._id) return;

      try {
        const res = await fetch(
          `${BACKEND_BASE_URL}/users/${user._id}/groups`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );
        const data = await res.json();
        if (data.success) {
          setGroups(data.data);
        }
      } catch (err) {
        console.error("Error fetching groups:", err);
      }
    };

    fetchGroups();
  };

  const handleUserProfileClick = (user) => {
    setSelectedUserForProfile(user);
    setShowUserProfileView(true);
  };

  const handleStartChatFromProfile = (user) => {
    handleSelectUser(user._id);
  };

  return (
    <SocketProvider userId={user?._id} username={user?.username}>
      <div className="min-h-dvh bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/70 backdrop-blur px-4 py-3">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setSidebarOpen(true)}
            title="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUserProfile(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Profile"
            >
              <User size={20} />
            </button>
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl grid lg:grid-cols-[320px_1fr] gap-0">
          {/* Sidebar */}
          <aside
            className={`${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-80 lg:w-auto bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-4 transition-transform`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatarUrl}
                  alt="Your avatar"
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <p className="font-semibold">{user?.username || "You"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full bg-emerald-500"
                      aria-hidden
                    />{" "}
                    {"Online"}
                  </p>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </div>
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
                title="Close sidebar"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setActiveTab("chats")}
                className={`flex-1 px-3 py-2 rounded-lg transition ${
                  activeTab === "chats"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setActiveTab("groups")}
                className={`flex-1 px-3 py-2 rounded-lg transition flex items-center justify-center gap-1 ${
                  activeTab === "groups"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Users size={16} />
                Groups
              </button>
            </div>

            <div className="relative mb-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  activeTab === "chats" ? "Search users..." : "Search groups..."
                }
                className="w-full rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
            </div>

            {/* Create Group Button */}
            {activeTab === "groups" && (
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-full mb-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 transition"
              >
                <Plus size={18} />
                Create Group
              </button>
            )}

            <nav
              aria-label={activeTab === "chats" ? "Users" : "Groups"}
              className="space-y-1 overflow-auto h-[calc(100dvh-250px)] pr-1"
            >
              {activeTab === "chats" ? (
                // Users List
                filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => handleSelectUser(u._id)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                        selectedUserId === u._id
                          ? "bg-gray-100 dark:bg-gray-800"
                          : ""
                      }`}
                      title={`Chat with ${u.username}`}
                    >
                      <img
                        src={u?.avatarUrl}
                        alt={`${u.username} avatar`}
                        className="h-9 w-9 rounded-full"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{u.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {u.about}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <h1 className="text-center text-gray-500">No users found</h1>
                )
              ) : // Groups List
              filteredGroups.length > 0 ? (
                filteredGroups.map((g) => (
                  <button
                    key={g._id}
                    onClick={() => handleSelectGroup(g._id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                      selectedGroupId === g._id
                        ? "bg-gray-100 dark:bg-gray-800"
                        : ""
                    }`}
                    title={`Open ${g.name}`}
                  >
                    <div className="relative">
                      <img
                        src={g?.avatarUrl || "/group-avatar.png"}
                        alt={`${g.name} avatar`}
                        className="h-9 w-9 rounded-full"
                      />
                      <Users
                        size={12}
                        className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-950 rounded-full p-0.5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{g.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {g.members?.length || 0} members
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <h1 className="text-center text-gray-500">No groups found</h1>
              )}
            </nav>
          </aside>

          {/* Chat Window */}
          {chatType === "private" && selectedUserId ? (
            <ChatWindow selectedUserId={selectedUserId} users={users} />
          ) : chatType === "group" && selectedGroupId ? (
            <GroupChatWindow
              selectedGroupId={selectedGroupId}
              groups={groups}
              onGroupUpdated={handleGroupUpdated}
            />
          ) : (
            <ChatWindowSkeleton />
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateGroup && (
          <CreateGroupModal
            users={users.filter((u) => u._id !== user?._id)}
            onClose={() => setShowCreateGroup(false)}
            onGroupCreated={handleGroupCreated}
          />
        )}

        {/* User Profile Modal */}
        {showUserProfile && user && (
          <UserProfileModal
            user={user}
            onClose={() => setShowUserProfile(false)}
            onProfileUpdated={() => {
              // No specific action needed here, profile update is handled by socket
            }}
          />
        )}

        {/* User Profile View Modal */}
        {showUserProfileView && selectedUserForProfile && (
          <UserProfileViewModal
            userId={selectedUserForProfile._id}
            onClose={() => setShowUserProfileView(false)}
            onStartChat={handleStartChatFromProfile}
          />
        )}
      </div>
    </SocketProvider>
  );
}

export default ChatPage;
