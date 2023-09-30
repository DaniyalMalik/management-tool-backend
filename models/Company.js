const mongoose = require('mongoose');
const { Schema } = mongoose;

const CompanySchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Company email is required!'],
      unique: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please enter a valid email address',
      ],
    },
    attachmentsSize: {
      type: String,
      default: 0,
    },
    name: {
      type: String,
      required: [true, 'Company name is required!'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Company phone number is required!'],
    },
    registeredAt: {
      type: String,
      required: [true, 'Registered at is required!'],
    },
    subscription: {
      type: String,
      enum: ['Free', 'Bronze', 'Silver', 'Golden'],
      required: [true, 'Subscription is required!'],
    },
    companyOwner: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'Enter company owner!'],
    },
    locked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('company', CompanySchema);
