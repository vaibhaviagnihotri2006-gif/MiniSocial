const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getComments = async (postId, { page = 1, limit = 20 }) => {
  if (!isValidId(postId)) throw ApiError.notFound('Post not found');
  const post = await Post.findById(postId);
  if (!post) throw ApiError.notFound('Post not found');

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [comments, total] = await Promise.all([
    Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user'),
    Comment.countDocuments({ post: postId }),
  ]);

  return {
    comments: comments.map((c) => c.toJSONPublic()),
    pagination: {
      currentPage: pageNum,
      totalPages: Math.max(Math.ceil(total / limitNum), 1),
      totalComments: total,
    },
  };
};

const addComment = async (postId, userId, { text }) => {
  if (!isValidId(postId)) throw ApiError.notFound('Post not found');
  const post = await Post.findById(postId);
  if (!post) throw ApiError.notFound('Post not found');

  if (!text || !text.trim()) {
    throw ApiError.badRequest('Comment text is required', ['text']);
  }
  if (text.length > 300) {
    throw ApiError.badRequest('Comment cannot exceed 300 characters', ['text']);
  }

  const comment = await Comment.create({
    post: postId,
    user: userId,
    text: text.trim(),
  });

  await Post.updateOne({ _id: postId }, { $push: { comments: comment._id } });

  const populated = await comment.populate('user');
  return populated.toJSONPublic();
};

const deleteComment = async (commentId, userId) => {
  if (!isValidId(commentId)) throw ApiError.notFound('Comment not found');
  const comment = await Comment.findById(commentId);
  if (!comment) throw ApiError.notFound('Comment not found');

  const post = await Post.findById(comment.post);

  const isCommentAuthor = comment.user.toString() === userId.toString();
  const isPostAuthor = post && post.user.toString() === userId.toString();

  if (!isCommentAuthor && !isPostAuthor) {
    throw ApiError.forbidden('You cannot delete this comment');
  }

  await comment.deleteOne();
  if (post) {
    await Post.updateOne({ _id: post._id }, { $pull: { comments: comment._id } });
  }

  return { id: commentId };
};

module.exports = { getComments, addComment, deleteComment };
