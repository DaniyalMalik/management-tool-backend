const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'conversation',
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'To is required!'],
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'From is required!'],
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
    date: {
      type: String,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = Message = mongoose.model('messages', MessageSchema);
