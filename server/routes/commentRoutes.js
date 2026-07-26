const express = require('express');
const { body } = require('express-validator');
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

// mergeParams so :id (postId) from the parent router is available here
const router = express.Router({ mergeParams: true });

router.get('/', protect, commentController.listComments);

router.post(
  '/',
  protect,
  [
    body('text')
      .trim()
      .notEmpty()
      .withMessage('Comment text is required')
      .isLength({ max: 300 })
      .withMessage('Comment cannot exceed 300 characters'),
  ],
  validate,
  commentController.addComment
);

module.exports = router;
