const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { UPLOAD_DIR } = require('../middleware/upload');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Multer middleware supporting two optional image fields (profile + cover)
const uploadFields = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    return cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
]);

router.get('/', protect, userController.listUsers);
router.get('/username/:username', protect, userController.getUserByUsername);
router.get('/:id', protect, userController.getUser);

router.put(
  '/profile',
  protect,
  (req, res, next) => {
    uploadFields(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message:
            err.message === 'INVALID_FILE_TYPE'
              ? 'Only JPEG, PNG, and WebP images are allowed'
              : 'Image upload failed: ' + err.message,
          error: { code: 'VALIDATION_ERROR', fields: ['profileImage', 'coverImage'] },
        });
      }
      return next();
    });
  },
  [
    body('fullName').optional().trim().isLength({ max: 100 }),
    body('bio').optional().trim().isLength({ max: 160 }),
  ],
  validate,
  userController.updateProfile
);

router.post('/follow/:id', protect, userController.followUser);
router.delete('/unfollow/:id', protect, userController.unfollowUser);

module.exports = router;
