const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required!'],
    },
    description: {
      type: String,
      required: [true, 'Description is required!'],
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'company',
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'From is required!'],
    },
    for: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'user',
          required: [true, 'For is required!'],
        },
        viewed: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('notification', notificationSchema);
