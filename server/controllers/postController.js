const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const postService = require('../services/postService');

const getFeed = asyncHandler(async (req, res) => {
  const { page, limit, user } = req.query;
  const result = await postService.getFeed({
    page,
    limit,
    userFilter: user,
    currentUserId: req.user._id,
  });
  sendSuccess(res, 200, 'Feed fetched', result.posts, result.pagination);
});

const createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user._id, req.body, req.file);
  sendSuccess(res, 201, 'Post created successfully', post);
});

const getPost = asyncHandler(async (req, res) => {
  const post = await postService.getPostById(req.params.id, req.user._id);
  sendSuccess(res, 200, 'Post fetched', post);
});

const updatePost = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(req.params.id, req.user._id, req.body);
  sendSuccess(res, 200, 'Post updated successfully', post);
});

const deletePost = asyncHandler(async (req, res) => {
  const result = await postService.deletePost(req.params.id, req.user._id);
  sendSuccess(res, 200, 'Post deleted successfully', result);
});

const likePost = asyncHandler(async (req, res) => {
  const result = await postService.likePost(req.params.id, req.user._id);
  sendSuccess(res, 200, 'Post liked', result);
});

const unlikePost = asyncHandler(async (req, res) => {
  const result = await postService.unlikePost(req.params.id, req.user._id);
  sendSuccess(res, 200, 'Post unliked', result);
});

module.exports = {
  getFeed,
  createPost,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
};
