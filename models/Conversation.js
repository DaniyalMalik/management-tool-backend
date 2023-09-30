const mongoose = require('mongoose');
const { Schema } = mongoose;

const ConversationSchema = new Schema(
  {
    recipients: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    lastMessage: {
      type: String,
      default: '',
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    newMessagesCount: {
      type: Number,
      default: 0,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = Conversation = mongoose.model(
  'conversation',
  ConversationSchema,
);
