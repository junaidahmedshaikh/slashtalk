require("dotenv").config();
const { getDB } = require("../configs/db");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const COLLECTION_NAME = "users";
// Functions to interact with users collection
const registerUser = async (req, res) => {
  try {
    const { username, email, password, avatarUrl } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await getDB()
      .collection(COLLECTION_NAME)
      .findOne({
        $or: [{ email: normalizedEmail }, { username: username }],
      });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "An account with this email already exists",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "This username is already taken",
        });
      }
    }

    let passwordHash = await bcrypt.hash(password, 10);
    const user = await getDB().collection(COLLECTION_NAME).insertOne({
      username,
      email: normalizedEmail,
      passwordHash,
      avatarUrl,
      createdAt: new Date(),
    });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};
// Login (authenticate + JWT)
const findUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await getDB()
    .collection(COLLECTION_NAME)
    .findOne({ email: normalizedEmail });

  if (!user) {
    return res
      .status(401)
      .json({ error: "Invalid credentials", details: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res
      .status(401)
      .json({ error: "Invalid credentials", details: "Password mismatch" });
  }
  const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY);
  res.cookie("token", jwtToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
  res.json({
    message: "Login Successful",
    data: { _id: user._id, username: user.username, avatarUrl: user.avatarUrl },
  });
};

const logoutUser = async (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};

const verifyUser = async (req, res) => {
  try {
    const user = await getDB()
      .collection(COLLECTION_NAME)
      .findOne({ _id: new ObjectId(req.userId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { username, avatarUrl, email } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check if username or email is already taken by another user
    if (username || email) {
      const normalizedEmail = email ? email.trim().toLowerCase() : null;
      const existingUser = await getDB()
        .collection(COLLECTION_NAME)
        .findOne({
          _id: { $ne: new ObjectId(userId) },
          $or: [
            ...(username ? [{ username: username }] : []),
            ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ],
        });

      if (existingUser) {
        if (existingUser.email === normalizedEmail) {
          return res.status(400).json({
            success: false,
            message: "An account with this email already exists",
          });
        } else if (existingUser.username === username) {
          return res.status(400).json({
            success: false,
            message: "This username is already taken",
          });
        }
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;
    if (email) updateData.email = email.trim().toLowerCase();
    updateData.updatedAt = new Date();

    const result = await getDB()
      .collection(COLLECTION_NAME)
      .updateOne({ _id: new ObjectId(userId) }, { $set: updateData });

    if (result.modifiedCount > 0) {
      // Get updated user data
      const updatedUser = await getDB()
        .collection(COLLECTION_NAME)
        .findOne({ _id: new ObjectId(userId) });

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          avatarUrl: updatedUser.avatarUrl,
          updatedAt: updatedUser.updatedAt,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to update profile",
      });
    }
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// Get user by ID (for profile viewing)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await getDB()
      .collection(COLLECTION_NAME)
      .findOne(
        { _id: new ObjectId(userId) },
        { projection: { passwordHash: 0 } } // Exclude password hash
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};

// Search users (for adding to groups)
const searchUsers = async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;
    const currentUserId = req.userId;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const searchRegex = new RegExp(query.trim(), "i");
    const users = await getDB()
      .collection(COLLECTION_NAME)
      .find(
        {
          _id: { $ne: new ObjectId(currentUserId) }, // Exclude current user
          $or: [{ username: searchRegex }, { email: searchRegex }],
        },
        {
          projection: { _id: 1, username: 1, avatarUrl: 1, email: 1 },
          limit: parseInt(limit),
        }
      )
      .toArray();

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Error in searchUsers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search users",
    });
  }
};

module.exports = {
  registerUser,
  findUser,
  logoutUser,
  verifyUser,
  updateUserProfile,
  getUserById,
  searchUsers,
};
