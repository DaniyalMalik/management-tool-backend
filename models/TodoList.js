const mongoose = require('mongoose');
const { Schema } = mongoose;

const todoListSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required!'],
    },
    subTodos: [
      {
        name: {
          type: String,
          required: [true, 'Sub todo name is required!'],
        },
        done: {
          type: Boolean,
          default: false,
        },
      },
    ],
    description: {
      type: String,
      required: [true, 'Description is required!'],
    },
    done: {
      type: Boolean,
      default: false,
    },
    imagePath: {
      type: Array,
      default: [],
    },
    filePath: {
      type: Array,
      default: [],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'User id is required!'],
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'company',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('todolist', todoListSchema);
