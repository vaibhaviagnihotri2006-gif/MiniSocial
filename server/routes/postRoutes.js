const express = require('express');
const { body } = require('express-validator');
const postController = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { singleUpload } = require('../middleware/upload');
const commentRoutes = require('./commentRoutes');

const router = express.Router();

router.get('/', protect, postController.getFeed);

router.post(
  '/',
  protect,
  singleUpload('image'),
  [
    body('caption')
      .trim()
      .notEmpty()
      .withMessage('Caption is required')
      .isLength({ max: 500 })
      .withMessage('Caption cannot exceed 500 characters'),
  ],
  validate,
  postController.createPost
);

router.get('/:id', protect, postController.getPost);

router.put(
  '/:id',
  protect,
  [
    body('caption')
      .trim()
      .notEmpty()
      .withMessage('Caption is required')
      .isLength({ max: 500 })
      .withMessage('Caption cannot exceed 500 characters'),
  ],
  validate,
  postController.updatePost
);

router.delete('/:id', protect, postController.deletePost);

router.post('/:id/like', protect, postController.likePost);
router.delete('/:id/unlike', protect, postController.unlikePost);

// Nested comment routes: /api/posts/:id/comments
router.use('/:id/comments', commentRoutes);

module.exports = router;
