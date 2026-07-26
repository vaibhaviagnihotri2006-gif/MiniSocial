const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caption: {
      type: String,
      required: [true, 'Caption is required'],
      trim: true,
      maxlength: [500, 'Caption cannot exceed 500 characters'],
    },
    image: {
      type: String,
      default: null,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ user: 1, createdAt: -1 });

postSchema.methods.toSummaryJSON = function toSummaryJSON(currentUserId) {
  const author =
    this.user && this.user.toPublicJSON ? this.user.toPublicJSON() : this.user;

  return {
    id: this._id,
    author,
    caption: this.caption,
    image: this.image,
    likeCount: this.likes.length,
    commentCount: this.comments.length,
    likedByMe: currentUserId
      ? this.likes.some((id) => id.toString() === currentUserId.toString())
      : false,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Post', postSchema);
