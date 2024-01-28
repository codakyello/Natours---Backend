const mongoose = require('mongoose');
const validator = require('validator');
// const AppError = require('../utils/appError');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
    trim: true,
  },

  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },

  photo: String,
  role: {
    type: String,
    enum: ['guide', 'admin', 'lead-guide', 'user'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],

    validate: {
      // This only works on CREATE and SAVE!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords dont match',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: String,
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
  //   console.log(this);
  //   if (this.password !== this.passwordConfirm) {
  //     next(new AppError('Password dosen`t match', 400));
  //   }
  //   next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // give out the reset token to reset password.

  const resetToken = crypto.randomBytes(32).toString('hex');
  console.log(resetToken);

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 10 mins from current time
  this.passwordResetTokenExpires = Date.now() + (10 * 60) / 1000;

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
