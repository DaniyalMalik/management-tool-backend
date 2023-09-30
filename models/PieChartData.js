const mongoose = require('mongoose');
const { Schema } = mongoose;

const pieChartSchema = new Schema(
  {
    slices: [
      {
        question: {
          type: String,
        },
        rotate: {
          type: String,
          required: [true, 'Rotate is required!'],
        },
        fill: {
          type: String,
          required: [true, 'Fill is required!'],
        },
        transform: {
          type: String,
          required: [true, 'Transform is required!'],
        },
      },
    ],
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'card',
      required: [true, 'Card is required'],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('pieChart', pieChartSchema);
