const mongoose = require('mongoose');
const { Schema } = mongoose;

const boardSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subType: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ['Custom', 'Template'],
      default: 'Custom',
    },
    budget: {
      type: String,
      default: 0,
    },
    used: {
      type: String,
      default: 0,
    },
    left: {
      type: String,
      default: 0,
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
          enum: ['Admin', 'Viewer', 'Editor'],
          required: true,
        },
        favourite: {
          type: Boolean,
          default: false,
        },
      },
    ],
    image: {
      color: {
        type: String,
        required: true,
      },
      thumb: {
        type: String,
        default: '',
      },
      full: {
        type: String,
        default: '',
      },
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

module.exports = mongoose.model('board', boardSchema);
