const {
  createGroup,
  getGroupById,
  getUserGroups,
  addMemberToGroup,
  removeMemberFromGroup,
  updateGroup,
  addAdminToGroup,
} = require("../models/groupModel");

// Create a new group
const createGroupAPI = async (req, res) => {
  try {
    const { name, description, avatarUrl, members } = req.body;
    const createdBy = req.userId; // From auth middleware

    if (!name || !members || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Group name and members are required",
      });
    }

    // Add creator to members if not already included
    const allMembers = [...new Set([...members, createdBy])];

    const group = await createGroup({
      name,
      description,
      avatarUrl,
      createdBy,
      members: allMembers,
    });

    res.status(201).json({
      success: true,
      data: group,
      message: "Group created successfully",
    });
  } catch (error) {
    console.error("Error in createGroupAPI:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create group",
    });
  }
};

// Get group details
const getGroupDetailsAPI = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
    }

    const group = await getGroupById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error in getGroupDetailsAPI:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group details",
    });
  }
};

// Get all groups for a user
const getUserGroupsAPI = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const groups = await getUserGroups(userId);

    res.json({
      success: true,
      data: groups,
      count: groups.length,
    });
  } catch (error) {
    console.error("Error in getUserGroupsAPI:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user groups",
    });
  }
};

// Enhanced add member to group with admin validation
const addMemberAPI = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.userId;

    if (!groupId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Group ID and User ID are required",
      });
    }

    // Check if current user is admin of the group
    const group = await getGroupById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const isAdmin = group.admins.some(
      (adminId) => adminId.toString() === currentUserId
    );
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only group admins can add members",
      });
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(
      (memberId) => memberId.toString() === userId
    );
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this group",
      });
    }

    const success = await addMemberToGroup(groupId, userId);

    if (success) {
      res.json({
        success: true,
        message: "Member added successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to add member",
      });
    }
  } catch (error) {
    console.error("Error in addMemberAPI:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add member",
    });
  }
};

// Enhanced remove member with admin validation
const removeMemberAPI = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const currentUserId = req.userId;

    if (!groupId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Group ID and User ID are required",
      });
    }

    // Check if current user is admin of the group
    const group = await getGroupById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const isAdmin = group.admins.some(
      (adminId) => adminId.toString() === currentUserId
    );
    const isRemovingSelf = userId === currentUserId;

    if (!isAdmin && !isRemovingSelf) {
      return res.status(403).json({
        success: false,
        message: "Only group admins can remove other members",
      });
    }

    // Prevent removing the last admin
    if (
      isAdmin &&
      group.admins.length === 1 &&
      group.admins[0].toString() === userId
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove the last admin from the group",
      });
    }

    const success = await removeMemberFromGroup(groupId, userId);

    if (success) {
      res.json({
        success: true,
        message: "Member removed successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to remove member",
      });
    }
  } catch (error) {
    console.error("Error in removeMemberAPI:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove member",
    });
  }
};

// Enhanced update group with admin validation
const updateGroupAPI = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, avatarUrl } = req.body;
    const currentUserId = req.userId;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
    }

    // Check if current user is admin of the group
    const group = await getGroupById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const isAdmin = group.admins.some(
      (adminId) => adminId.toString() === currentUserId
    );
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only group admins can update group details",
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    const success = await updateGroup(groupId, updateData);

    if (success) {
      res.json({
        success: true,
        message: "Group updated successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to update group",
      });
    }
  } catch (error) {
    console.error("Error in updateGroupAPI:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update group",
    });
  }
};

// Add new function to promote member to admin
const promoteToAdminAPI = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.userId;

    if (!groupId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Group ID and User ID are required",
      });
    }

    // Check if current user is admin of the group
    const group = await getGroupById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const isAdmin = group.admins.some(
      (adminId) => adminId.toString() === currentUserId
    );
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only group admins can promote members",
      });
    }

    // Check if user is a member
    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId
    );
    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this group",
      });
    }

    // Check if user is already an admin
    const isAlreadyAdmin = group.admins.some(
      (adminId) => adminId.toString() === userId
    );
    if (isAlreadyAdmin) {
      return res.status(400).json({
        success: false,
        message: "User is already an admin",
      });
    }

    const success = await addAdminToGroup(groupId, userId);

    if (success) {
      res.json({
        success: true,
        message: "Member promoted to admin successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to promote member",
      });
    }
  } catch (error) {
    console.error("Error in promoteToAdminAPI:", error);
    res.status(500).json({
      success: false,
      message: "Failed to promote member",
    });
  }
};

module.exports = {
  createGroupAPI,
  getGroupDetailsAPI,
  getUserGroupsAPI,
  addMemberAPI,
  removeMemberAPI,
  updateGroupAPI,
  promoteToAdminAPI,
};
