const mongoose = require('mongoose');
const { Schema } = mongoose;

const archiveSchema = new Schema(
  {
    type: {
      type: String,
      required: [true, 'Enter type!'],
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'card',
    },
    path: {
      type: String,
      required: [true, 'Enter path!'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'Enter user id!'],
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

module.exports = mongoose.model('archive', archiveSchema);
