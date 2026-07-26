const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [300, 'Comment cannot exceed 300 characters'],
    },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: -1 });

commentSchema.methods.toJSONPublic = function toJSONPublic() {
  const author =
    this.user && this.user.toPublicJSON ? this.user.toPublicJSON() : this.user;

  return {
    id: this._id,
    post: this.post,
    author,
    text: this.text,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Comment', commentSchema);
