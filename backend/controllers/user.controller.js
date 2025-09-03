import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import ErrorResponse from '../utils/errorHandler.js';
import sendEmail from '../utils/sendEmail.js';

const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = user.getAccessToken();
  const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};

export const register = async (req, res, next) => {
  const { fullName, email, password, usn, semester, department } = req.body;
  try {
    const activationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      fullName, email, password, usn, semester, department,
      activationToken: crypto.createHash('sha256').update(activationToken).digest('hex'),
      activationTokenExpires: Date.now() + 10 * 60 * 1000,
    });
    const activationUrl = `${process.env.CLIENT_URL}/activate/${activationToken}`;
    const message = `Thank you for registering. Please activate your account by clicking this link: \n\n ${activationUrl} \n\n This link will expire in 10 minutes.`;
    await sendEmail({ to: user.email, subject: 'Account Activation', text: message });
    res.status(201).json({ success: true, message: 'Activation email sent' });
  } catch (err) { next(err); }
};

export const activateAccount = async (req, res, next) => {
  const activationToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  try {
    const user = await User.findOne({ activationToken, activationTokenExpires: { $gt: Date.now() } });
    if (!user) return next(new ErrorResponse('Invalid or expired activation token', 400));
    user.isVerified = true;
    user.activationToken = undefined;
    user.activationTokenExpires = undefined;
    await user.save();
    res.status(200).json({ success: true, message: 'Account activated successfully' });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new ErrorResponse('Please provide email and password', 400));
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) return next(new ErrorResponse('Invalid credentials', 401));
    if (!user.isVerified) return next(new ErrorResponse('Account not verified', 401));
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return next(new ErrorResponse('There is no user with that email', 404));
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested a password reset. Please click this link: \n\n ${resetUrl}`;
    await sendEmail({ to: user.email, subject: 'Password Reset Request', text: message });
    res.status(200).json({ success: true, message: 'Email sent' });
  } catch (err) {
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }
    next(new ErrorResponse('Email could not be sent', 500));
  }
};

export const resetPassword = async (req, res, next) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  try {
    const user = await User.findOne({ resetPasswordToken, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return next(new ErrorResponse('Invalid or expired token', 400));
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

export const refreshToken = async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (!token) return next(new ErrorResponse('Not authorized', 401));
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new ErrorResponse('User not found', 401));
    const accessToken = user.getAccessToken();
    res.json({ success: true, accessToken });
  } catch (err) { return next(new ErrorResponse('Invalid refresh token', 403)); }
};

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
export const getMe = async (req, res, next) => {
  // req.user is set in the protect middleware
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json(user);
};

export const logout = (req, res, next) => {
  res.cookie('refreshToken', 'none', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};