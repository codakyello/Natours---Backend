const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const { validateToken } = require('../utils/validateToken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.singup = catchAsync(async (req, res, next) => {
  console.log('here');
  const { name, email, password, passwordConfirm } = req.body;

  const newUser = await User.create({
    name,
    password,
    passwordConfirm,
    email,
  });

  const token = signToken(newUser._id);
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Manual validation since we are not using db validation because its not a db model.
  if (!email || !password)
    throw new AppError('Please provide email or password!', 400);

  const user = await User.findOne({ email }).select('+password');

  // if user check if password

  if (
    !user ||
    (await user.correctPassword(password, user.password)) === false
  ) {
    throw new AppError('Incorrect email or password', 401);
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: 'logged in',
    token,
    data: {
      user,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // Check if user is logged in if not throw an error

  // 1) Check and get if a token exists from client

  let token =
    req.headers.authorization?.startsWith('Bearer') &&
    req.headers.authorization?.split(' ').at(1);

  if (!token)
    throw new AppError(
      'You are not logged in! Please log in to gain access',
      401
    );

  // 2) validate token

  const decoded = await validateToken(token, process.env.JWT_SECRET);

  // 3) Check if user still exists

  const currentUser = await !User.findById(decoded.id);
  if (!currentUser)
    throw new AppError(
      'The user belonging to the token no longer exists!',
      401
    );

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    throw new AppError(
      'User recently changed password! Please log in again',
      401
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});
