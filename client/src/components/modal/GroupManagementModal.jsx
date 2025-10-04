import { useState, useEffect } from "react";
import {
  X,
  Users,
  Settings,
  UserPlus,
  UserMinus,
  Crown,
  Search,
} from "lucide-react";
import { BACKEND_BASE_URL } from "../../utils/constant";

export const GroupManagementModal = ({
  group,
  currentUser,
  onClose,
  onGroupUpdated,
}) => {
  const [activeTab, setActiveTab] = useState("members"); // 'members', 'settings'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Group settings
  const [groupSettings, setGroupSettings] = useState({
    name: "",
    description: "",
    avatarUrl: "",
  });

  useEffect(() => {
    if (group) {
      setGroupSettings({
        name: group.name || "",
        description: group.description || "",
        avatarUrl: group.avatarUrl || "",
      });
    }
  }, [group]);

  const isAdmin = group?.admins?.some(
    (adminId) => adminId.toString() === currentUser?._id
  );

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/user/search?query=${encodeURIComponent(
          query
        )}&limit=10`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();
      if (data.success) {
        // Filter out users who are already members
        const filteredResults = data.data.filter(
          (user) => !group?.members?.some((member) => member._id === user._id)
        );
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/groups/${group._id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess("Member added successfully");
        onGroupUpdated?.();
        setSearchQuery("");
        setSearchResults([]);
      } else {
        setError(data.message || "Failed to add member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/groups/${group._id}/members/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess("Member removed successfully");
        onGroupUpdated?.();
      } else {
        setError(data.message || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async (userId) => {
    if (!confirm("Are you sure you want to promote this member to admin?"))
      return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/groups/${group._id}/admins`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess("Member promoted to admin successfully");
        onGroupUpdated?.();
      } else {
        setError(data.message || "Failed to promote member");
      }
    } catch (error) {
      console.error("Error promoting member:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/groups/${group._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(groupSettings),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Group updated successfully");
        onGroupUpdated?.();
      } else {
        setError(data.message || "Failed to update group");
      }
    } catch (error) {
      console.error("Error updating group:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setGroupSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users size={20} />
            {group?.name} - Management
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === "members"
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Users size={16} className="inline mr-2" />
            Members
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "settings"
                  ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Settings size={16} className="inline mr-2" />
              Settings
            </button>
          )}
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
              {success}
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-4">
              {/* Add Member Section */}
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Add New Member
                  </label>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearchUsers(e.target.value);
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Search users to add..."
                    />
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatarUrl || "/user-avatar.png"}
                              alt={user.username}
                              className="h-8 w-8 rounded-full"
                            />
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddMember(user._id)}
                            disabled={loading}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm flex items-center gap-1"
                          >
                            <UserPlus size={14} />
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Current Members */}
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Current Members ({group?.members?.length || 0})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {group?.members?.map((member) => {
                    const isMemberAdmin = group?.admins?.some(
                      (adminId) => adminId.toString() === member._id
                    );
                    const isCurrentUser = member._id === currentUser?._id;

                    return (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatarUrl || "/user-avatar.png"}
                            alt={member.username}
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.username}</p>
                              {isMemberAdmin && (
                                <Crown
                                  size={14}
                                  className="text-yellow-500"
                                  title="Admin"
                                />
                              )}
                            </div>
                            {isCurrentUser && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                (You)
                              </p>
                            )}
                          </div>
                        </div>

                        {isAdmin && !isCurrentUser && (
                          <div className="flex gap-2">
                            {!isMemberAdmin && (
                              <button
                                onClick={() => handlePromoteToAdmin(member._id)}
                                disabled={loading}
                                className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 disabled:opacity-50"
                                title="Promote to admin"
                              >
                                <Crown size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveMember(member._id)}
                              disabled={loading}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                              title="Remove member"
                            >
                              <UserMinus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && isAdmin && (
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={groupSettings.name}
                  onChange={handleSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={groupSettings.description}
                  onChange={handleSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Avatar URL
                </label>
                <input
                  type="url"
                  name="avatarUrl"
                  value={groupSettings.avatarUrl}
                  onChange={handleSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Group"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
