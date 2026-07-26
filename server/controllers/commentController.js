const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const commentService = require('../services/commentService');

const listComments = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await commentService.getComments(req.params.id, { page, limit });
  sendSuccess(res, 200, 'Comments fetched', result.comments, result.pagination);
});

const addComment = asyncHandler(async (req, res) => {
  const comment = await commentService.addComment(
    req.params.id,
    req.user._id,
    req.body
  );
  sendSuccess(res, 201, 'Comment added successfully', comment);
});

const deleteComment = asyncHandler(async (req, res) => {
  const result = await commentService.deleteComment(req.params.id, req.user._id);
  sendSuccess(res, 200, 'Comment deleted successfully', result);
});

module.exports = { listComments, addComment, deleteComment };
