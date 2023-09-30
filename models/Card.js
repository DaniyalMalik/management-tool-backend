const mongoose = require('mongoose');
const { Schema } = mongoose;

const cardSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    listId: {
      type: Schema.Types.ObjectId,
      ref: 'list',
      required: [true, 'List Id is required!'],
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'board',
      required: [true, 'Board Id is required!'],
    },
    order: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    imagePath: {
      type: Array,
      default: [],
    },
    filePath: {
      type: Array,
      default: [],
    },
    videoPath: {
      type: Array,
      default: [],
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'company',
      default: null,
    },
    pieChartId: {
      type: Schema.Types.ObjectId,
      ref: 'pieChart',
      default: null,
    },
    commentId: {
      type: Schema.Types.ObjectId,
      ref: 'comment',
      default: null,
    },
    user: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'user',
          required: [true, 'User id is required!'],
        },
        role: {
          type: String,
          required: [true, 'User role is required!'],
          enum: ['Viewer', 'Editor'],
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('card', cardSchema);
