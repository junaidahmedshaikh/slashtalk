const { getDB } = require("../configs/db");
const { ObjectId } = require("mongodb");

const GROUPS_COLLECTION = "groups";

// Create a new group
const createGroup = async (groupData) => {
  try {
    const db = getDB();
    if (!db) {
      throw new Error("Database not connected");
    }

    const group = {
      name: groupData.name,
      description: groupData.description || "",
      avatarUrl: groupData.avatarUrl || "/group-avatar.png",
      createdBy: new ObjectId(groupData.createdBy),
      members: groupData.members.map(id => new ObjectId(id)),
      admins: [new ObjectId(groupData.createdBy)],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(GROUPS_COLLECTION).insertOne(group);
    
    return {
      _id: result.insertedId,
      ...group,
      createdBy: group.createdBy.toString(),
      members: group.members.map(id => id.toString()),
      admins: group.admins.map(id => id.toString())
    };
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

// Get group by ID
const getGroupById = async (groupId) => {
  try {
    const db = getDB();
    if (!db) {
      throw new Error("Database not connected");
    }

    const group = await db
      .collection(GROUPS_COLLECTION)
      .aggregate([
        {
          $match: { _id: new ObjectId(groupId) }
        },
        {
          $lookup: {
            from: "users",
            localField: "members",
            foreignField: "_id",
            as: "memberDetails"
          }
        },
        {
          $project: {
            name: 1,
            description: 1,
            avatarUrl: 1,
            createdBy: 1,
            admins: 1,
            createdAt: 1,
            updatedAt: 1,
            members: {
              $map: {
                input: "$memberDetails",
                as: "member",
                in: {
                  _id: "$$member._id",
                  username: "$$member.username",
                  avatarUrl: "$$member.avatarUrl"
                }
              }
            }
          }
        }
      ])
      .toArray();

    return group[0] || null;
  } catch (error) {
    console.error("Error getting group:", error);
    throw error;
  }
};

// Get all groups for a user
const getUserGroups = async (userId) => {
  try {
    const db = getDB();
    if (!db) {
      throw new Error("Database not connected");
    }

    const groups = await db
      .collection(GROUPS_COLLECTION)
      .find({
        members: new ObjectId(userId)
      })
      .sort({ updatedAt: -1 })
      .toArray();

    return groups.map(group => ({
      _id: group._id,
      name: group.name,
      description: group.description,
      avatarUrl: group.avatarUrl,
      createdBy: group.createdBy.toString(),
      members: group.members.map(id => id.toString()),
      admins: group.admins.map(id => id.toString()),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    }));
  } catch (error) {
    console.error("Error getting user groups:", error);
    throw error;
  }
};

// Add member to group
const addMemberToGroup = async (groupId, userId) => {
  try {
    const db = getDB();
    if (!db) {
      throw new Error("Database not connected");
    }

    const result = await db
      .collection(GROUPS_COLLECTION)
      .updateOne(
        { _id: new ObjectId(groupId) },
        {
          $addToSet: { members: new ObjectId(userId) },
          $set: { updatedAt: new Date() }
        }
      );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error adding member to group:", error);
    throw error;
  }
};

// Remove member from group
const removeMemberFromGroup = async (groupId, userId) => {
  try {
    const db = getDB();
    if (!db) {
      throw new Error("Database not connected");
    }

    const result = await db
      .collection(GROUPS_COLLECTION)
      .updateOne(
        { _id: new ObjectId(groupId) },
        {
          $pull: { members: new ObjectId(userId) },
          $set: { updatedAt: new Date() }
        }
      );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error removing member from group:", error);
    throw error;
  }
};

// Update group
const updateGroup = async (groupId, updateData) => {
  try {
    const db = getDB();
    if (!db) {
      throw new Error("Database not connected");
    }

    const update = {
      ...updateData,
      updatedAt: new Date()
    };

    const result = await db
      .collection(GROUPS_COLLECTION)
      .updateOne(
        { _id: new ObjectId(groupId) },
        { $set: update }
      );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error updating group:", error);
    throw error;
  }
};

// Add admin to group
const addAdminToGroup = async (groupId, userId) => {
  try {
    const db = getDB();
    if (!db) {
      throw new Error("Database not connected");
    }

    const result = await db
      .collection(GROUPS_COLLECTION)
      .updateOne(
        { _id: new ObjectId(groupId) },
        {
          $addToSet: { admins: new ObjectId(userId) },
          $set: { updatedAt: new Date() }
        }
      );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error adding admin to group:", error);
    throw error;
  }
};

module.exports = {
  createGroup,
  getGroupById,
  getUserGroups,
  addMemberToGroup,
  removeMemberFromGroup,
  updateGroup,
  addAdminToGroup
};