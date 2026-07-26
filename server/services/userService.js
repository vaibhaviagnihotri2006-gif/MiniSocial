const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const { escapeRegex } = require('../utils/sanitize');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const searchUsers = async ({ search, page = 1, limit = 20 }) => {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const filter = {};
  if (search && search.trim()) {
    const safe = escapeRegex(search.trim());
    const regex = new RegExp(safe, 'i');
    filter.$or = [{ username: regex }, { fullName: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map((u) => u.toPublicJSON()),
    pagination: {
      currentPage: pageNum,
      totalPages: Math.max(Math.ceil(total / limitNum), 1),
      totalUsers: total,
    },
  };
};

const getUserById = async (id) => {
  if (!isValidId(id)) throw ApiError.notFound('User not found');
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  const postCount = await Post.countDocuments({ user: id });
  return { ...user.toPublicJSON(), postCount };
};

const getUserByUsername = async (username) => {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) throw ApiError.notFound('User not found');

  const postCount = await Post.countDocuments({ user: user._id });
  return { ...user.toPublicJSON(), postCount };
};

const updateProfile = async (userId, updates, uploadedFiles = {}) => {
  const allowed = ['fullName', 'bio'];
  const payload = {};

  allowed.forEach((key) => {
    if (updates[key] !== undefined) payload[key] = updates[key];
  });

  if (uploadedFiles.profileImage) {
    payload.profileImage = `/uploads/${uploadedFiles.profileImage[0].filename}`;
  }
  if (uploadedFiles.coverImage) {
    payload.coverImage = `/uploads/${uploadedFiles.coverImage[0].filename}`;
  }

  if (payload.bio !== undefined && payload.bio.length > 160) {
    throw ApiError.badRequest('Bio cannot exceed 160 characters', ['bio']);
  }
  if (payload.fullName !== undefined && !payload.fullName.trim()) {
    throw ApiError.badRequest('Full name cannot be empty', ['fullName']);
  }

  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  if (!user) throw ApiError.notFound('User not found');
  return user.toPublicJSON();
};

const followUser = async (currentUserId, targetId) => {
  if (!isValidId(targetId)) throw ApiError.notFound('User not found');
  if (currentUserId.toString() === targetId.toString()) {
    throw ApiError.badRequest('You cannot follow yourself');
  }

  const target = await User.findById(targetId);
  if (!target) throw ApiError.notFound('User not found');

  await Promise.all([
    User.updateOne({ _id: currentUserId }, { $addToSet: { following: targetId } }),
    User.updateOne({ _id: targetId }, { $addToSet: { followers: currentUserId } }),
  ]);

  const updatedTarget = await User.findById(targetId);
  return {
    followingId: targetId,
    followersCount: updatedTarget.followers.length,
  };
};

const unfollowUser = async (currentUserId, targetId) => {
  if (!isValidId(targetId)) throw ApiError.notFound('User not found');

  const target = await User.findById(targetId);
  if (!target) throw ApiError.notFound('User not found');

  await Promise.all([
    User.updateOne({ _id: currentUserId }, { $pull: { following: targetId } }),
    User.updateOne({ _id: targetId }, { $pull: { followers: currentUserId } }),
  ]);

  const updatedTarget = await User.findById(targetId);
  return {
    followingId: targetId,
    followersCount: updatedTarget.followers.length,
  };
};

module.exports = {
  searchUsers,
  getUserById,
  getUserByUsername,
  updateProfile,
  followUser,
  unfollowUser,
};
