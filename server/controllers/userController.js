const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const userService = require('../services/userService');

const listUsers = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query;
  const result = await userService.searchUsers({ search, page, limit });
  sendSuccess(res, 200, 'Users fetched', result.users, result.pagination);
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, 200, 'User fetched', user);
});

const getUserByUsername = asyncHandler(async (req, res) => {
  const user = await userService.getUserByUsername(req.params.username);
  sendSuccess(res, 200, 'User fetched', user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const files = req.files || {};
  const updated = await userService.updateProfile(req.user._id, req.body, files);
  sendSuccess(res, 200, 'Profile updated successfully', updated);
});

const followUser = asyncHandler(async (req, res) => {
  const result = await userService.followUser(req.user._id, req.params.id);
  sendSuccess(res, 200, 'User followed', result);
});

const unfollowUser = asyncHandler(async (req, res) => {
  const result = await userService.unfollowUser(req.user._id, req.params.id);
  sendSuccess(res, 200, 'User unfollowed', result);
});

module.exports = {
  listUsers,
  getUser,
  getUserByUsername,
  updateProfile,
  followUser,
  unfollowUser,
};
