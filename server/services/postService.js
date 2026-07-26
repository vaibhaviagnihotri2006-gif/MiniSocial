const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getFeed = async ({ page = 1, limit = 20, userFilter, currentUserId }) => {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const filter = {};
  if (userFilter) filter.user = userFilter;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user'),
    Post.countDocuments(filter),
  ]);

  return {
    posts: posts.map((p) => p.toSummaryJSON(currentUserId)),
    pagination: {
      currentPage: pageNum,
      totalPages: Math.max(Math.ceil(total / limitNum), 1),
      totalPosts: total,
    },
  };
};

const createPost = async (userId, { caption }, imageFile) => {
  if (!caption || !caption.trim()) {
    throw ApiError.badRequest('Caption is required', ['caption']);
  }
  if (caption.length > 500) {
    throw ApiError.badRequest('Caption cannot exceed 500 characters', ['caption']);
  }

  const post = await Post.create({
    user: userId,
    caption: caption.trim(),
    image: imageFile ? `/uploads/${imageFile.filename}` : null,
  });

  const populated = await post.populate('user');
  return populated.toSummaryJSON(userId);
};

const getPostById = async (postId, currentUserId) => {
  if (!isValidId(postId)) throw ApiError.notFound('Post not found');
  const post = await Post.findById(postId).populate('user');
  if (!post) throw ApiError.notFound('Post not found');
  return post.toSummaryJSON(currentUserId);
};

const getPostOwned = async (postId) => {
  if (!isValidId(postId)) throw ApiError.notFound('Post not found');
  const post = await Post.findById(postId);
  if (!post) throw ApiError.notFound('Post not found');
  return post;
};

const updatePost = async (postId, userId, { caption }) => {
  const post = await getPostOwned(postId);

  if (post.user.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only edit your own posts');
  }
  if (!caption || !caption.trim()) {
    throw ApiError.badRequest('Caption is required', ['caption']);
  }
  if (caption.length > 500) {
    throw ApiError.badRequest('Caption cannot exceed 500 characters', ['caption']);
  }

  post.caption = caption.trim();
  await post.save();
  const populated = await post.populate('user');
  return populated.toSummaryJSON(userId);
};

const deletePost = async (postId, userId) => {
  const post = await getPostOwned(postId);

  if (post.user.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only delete your own posts');
  }

  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
  return { id: postId };
};

const likePost = async (postId, userId) => {
  const post = await getPostOwned(postId);
  await Post.updateOne({ _id: post._id }, { $addToSet: { likes: userId } });
  const updated = await Post.findById(post._id);
  return { likeCount: updated.likes.length, likedByMe: true };
};

const unlikePost = async (postId, userId) => {
  const post = await getPostOwned(postId);
  await Post.updateOne({ _id: post._id }, { $pull: { likes: userId } });
  const updated = await Post.findById(post._id);
  return { likeCount: updated.likes.length, likedByMe: false };
};

module.exports = {
  getFeed,
  createPost,
  getPostById,
  getPostOwned,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
};
