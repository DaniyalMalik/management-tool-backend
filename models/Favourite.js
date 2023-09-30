const mongoose = require('mongoose');
const { Schema } = mongoose;

const favouriteSchema = new Schema(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'board',
      required: [true, 'Board id is required!'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'User id is required!'],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('favourite', favouriteSchema);
