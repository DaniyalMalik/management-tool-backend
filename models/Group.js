const mongoose = require('mongoose');
const { Schema } = mongoose;

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Enter group name!'],
    },
    lastMessage: {
      type: String,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    newMessagesCount: {
      type: Number,
      default: 0,
    },
    imagePath: {
      type: String,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'user',
      required: [true, 'Enter participants!'],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = Conversation = mongoose.model('group', groupSchema);
