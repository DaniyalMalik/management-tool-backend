const mongoose = require('mongoose');
const { Schema } = mongoose;

const adminSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required!'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please enter a valid email address',
      ],
    },
    name: {
      type: String,
      required: [true, 'Email is required!'],
    },
    password: {
      type: String,
      required: [true, 'Password is required!'],
      select: false,
      minlength: 6,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('admin', adminSchema);
