const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const { validateToken } = require('../utils/validateToken');
const sendEmail = require('../email');
const crypto = require('crypto');

const createSendToken = (user, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(200).json({
    status: 'success',
    token,
    data: { user },
  });
};
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.singup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role } = req.body;

  const newUser = await User.create({
    name,
    password,
    passwordConfirm,
    email,
    role,
  });

  createSendToken(newUser, res);
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

  createSendToken(user, res);
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

  console.log(decoded.id);
  const currentUser = await User.findById(decoded.id);
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

exports.restrict = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      throw new AppError('You do not have permission for this operation', 403);
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) throw new AppError('Please provide a email', 400);

  const user = await User.findOne({ email });

  // send an email to user if exists
  if (!user)
    throw new AppError('There is no user with this email address', 400);

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a request with your new password and passwordConfirm to : ${resetURL}.\nIf you didn't forget your password, please ignore thie email!`;

  console.log('waiting for email to send');
  try {
    await sendEmail({
      message,
      email: user.email,
      subject: 'Reset Your Password (valid for 10 minutes)',
    });
    res.status(200).json({
      status: 'success',
      message: 'Mail successfully sent',
    });
  } catch (err) {
    // user.passwordResetToken = undefined;
    // user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // throw new AppError(
    //   'There was an error sending the email. Try again later!',
    //   500
    // );
    throw new AppError(err.message, 500);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // passwordResetTokenExpires: { $gt: Date.now() },
  });

  if (!user) throw new AppError('Token is invalid or has expired', 400);

  // encrypt the token and find it in db.

  const { password, passwordConfirm } = req.body;

  if (!password) throw new AppError('Please provide a password,', 400);

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.changedPasswordAfter = undefined;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  // find and delete the user with the email

  createSendToken(user, res);
});
