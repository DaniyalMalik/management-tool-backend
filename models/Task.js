const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required!'],
    },
    deadline: {
      type: String,
      required: [true, 'Deadline is required!'],
    },
    description: {
      type: String,
      required: [true, 'Description is required!'],
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
      required: [true, 'Company id is required!'],
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'card',
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
          enum: ['Viewer', 'Editor'],
          required: [true, 'User role is required!'],
        },
        completed: {
          type: Boolean,
          default: false,
        },
        submittedAnswer: {
          type: String,
          default: '',
        },
        submittedImage: {
          type: Array,
          default: [],
        },
        submittedFile: {
          type: Array,
          default: [],
        },
        sumittedVideo: {
          type: Array,
          default: [],
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('task', taskSchema);
