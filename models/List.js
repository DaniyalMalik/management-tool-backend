const mongoose = require('mongoose');
const { Schema } = mongoose;

const listSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'board',
      required: true,
    },
    order: {
      type: String,
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'company',
      default: null,
    },
    color: {
      type: String,
      default: '#ffffff',
    },
    user: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'user',
          required: true,
        },
        role: {
          type: String,
          required: true,
          enum: ['Viewer', 'Editor'],
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('list', listSchema);
