const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    // to: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'user',
    // },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'From is required!'],
    },
    body: {
      type: String,
      required: [true, 'Body is required!'],
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'card',
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'company',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = Message = mongoose.model('comment', CommentSchema);
