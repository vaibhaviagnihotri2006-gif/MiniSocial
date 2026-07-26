const express = require('express');
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// DELETE /api/comments/:id
router.delete('/:id', protect, commentController.deleteComment);

module.exports = router;
