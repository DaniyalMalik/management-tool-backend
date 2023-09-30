const mongoose = require('mongoose');
const { Schema } = mongoose;

const groupMessageSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'group',
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    imagePath: {
      type: String,
      default: null,
    },
    filePath: {
      type: String,
      default: null,
    },
    videoPath: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = Message = mongoose.model('groupMessage', groupMessageSchema);
