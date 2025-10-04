import { useState, useEffect } from "react";
import { X, User, Mail, Calendar, MessageCircle } from "lucide-react";
import { BACKEND_BASE_URL } from "../../utils/constant";

export const UserProfileViewModal = ({ userId, onClose, onStartChat }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/user/${userId}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      } else {
        setError(data.message || "Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    onStartChat?.(user);
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User size={20} />
            Profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Profile Picture and Basic Info */}
          <div className="text-center mb-6">
            <img
              src={user?.avatarUrl || "/user-avatar.png"}
              alt={user?.username}
              className="h-24 w-24 rounded-full mx-auto mb-4 border-4 border-gray-200 dark:border-gray-700"
            />
            <h3 className="text-xl font-semibold">{user?.username}</h3>
            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Mail size={16} className="text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar
                size={16}
                className="text-gray-500 dark:text-gray-400"
              />
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2">
            <button
              onClick={handleStartChat}
              className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} />
              Start Chat
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
