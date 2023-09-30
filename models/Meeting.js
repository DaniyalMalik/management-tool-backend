const mongoose = require('mongoose');
const { Schema } = mongoose;

const meetingSchema = new Schema(
  {
    topic: {
      type: String,
      required: [true, 'Name is required!'],
    },
    dateAndTime: {
      type: String,
      required: [true, 'Date and time is required!'],
    },
    companyId:{
      type: Schema.Types.ObjectId,
      ref: 'company',
      required: [true, 'Enter company id!'],  
    },
    type: {
      type: String,
      enum: ['Audio Call', 'Video Call', 'Face-to-Face'],
      required: [true, 'Type is required!'],
    },
    meetingAgenda: {
      type: String,
      required: [true, 'Meeting agenda is required!'],
    },
    phoneNumber: {
      type: String,
    },
    location: {
      type: String,
    },
    startUrl: {
      type: String,
    },
    joinUrl: {
      type: String,
    },
    meetingPassword: {
      type: String,
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
          enum: ['Scheduler', 'Participant'],
          required: [true, 'Role is required!'],
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('meeting', meetingSchema);
