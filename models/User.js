const mongoose = require('mongoose');
const { Schema } = mongoose;
const crypto = require('crypto');

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please enter a valid email address',
      ],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    attachmentsSize: {
      type: String,
      default: 0,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required!'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required!'],
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    imagePath: {
      type: String,
      default: null,
    },
    registeredAt: {
      type: String,
      default: '',
    },
    subscribed: {
      type: Boolean,
      default: false,
    },
    employId: {
      type: Schema.Types.ObjectId,
      ref: 'company',
      default: null,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'company',
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerifyToken: String,
    emailVerifyExpire: Date,
  },
  {
    timestamps: true,
  },
);

// Encrypting password
// UserSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) {
//     next();
//   }

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// Creating jwt
// UserSchema.methods.getSignedJwtToken = function () {
//   return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRE,
//   });
// };

//Comparing passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getForgotPasswordToken = async function () {
  const resetToken = await crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = await crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  // this.save({ validateBeforeSave: false });

  return resetToken;
};

UserSchema.methods.getVerifyToken = async function () {
  const resetToken = await crypto.randomBytes(20).toString('hex');

  this.emailVerifyToken = await crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.emailVerifyExpire = Date.now() + 10 * 60 * 1000;

  // this.save({ validateBeforeSave: false });

  return resetToken;
};

module.exports = mongoose.model('user', UserSchema);
