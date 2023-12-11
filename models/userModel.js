const mongoose = require('mongoose');
const validator = require('validator');
const AppError = require('../utils/appError');
const bcrypt = require('bcryptjs');

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
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
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
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 120);
  this.passwordConfirm = undefined;
  next();
  //   console.log(this);
  //   if (this.password !== this.passwordConfirm) {
  //     next(new AppError('Password dosen`t match', 400));
  //   }
  //   next();
});

module.exports = mongoose.model('User', userSchema);
