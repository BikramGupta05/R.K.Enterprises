import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { createAccessToken, createRefreshToken, hashToken, createTokenCookie } from '../utils/token.js';
import { sendResetPasswordEmail } from '../utils/email.js';
import passport from '../passport/google.js';
import {
  registerValidation,
  loginValidation,
  emailValidation,
  resetPasswordValidation,
  validateRequest
} from '../middleware/validation.js';

const router = express.Router();

// Per-email rate limiter for password reset requests to avoid abuse. Uses the email from the request body
// as the rate key when present, otherwise falls back to the request IP.
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // limit each email to 5 requests per window
  keyGenerator: (req) => (req.body?.email ? String(req.body.email).toLowerCase() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many password reset requests for this email. Please try again later.'
});

router.post('/register', registerValidation, validateRequest, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email address is already registered' });
    }

    const user = await User.create({ name, email, password });
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken();
    user.refreshToken = hashToken(refreshToken);
    await user.save();
    createTokenCookie(res, refreshToken);

    res.status(201).json({ message: 'Registration successful', accessToken });
  } catch (error) {
    next(error);
  }
});

router.post('/login', loginValidation, validateRequest, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken();
    user.refreshToken = hashToken(refreshToken);
    await user.save();
    createTokenCookie(res, refreshToken);

    res.json({ message: 'Login successful', accessToken });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const hashed = hashToken(refreshToken);
      await User.findOneAndUpdate({ refreshToken: hashed }, { refreshToken: null });
    }

    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh-token', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      console.warn('Refresh token request missing cookie');
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    const hashed = hashToken(token);
    const user = await User.findOne({ refreshToken: hashed });
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken();
    user.refreshToken = hashToken(newRefreshToken);
    await user.save();
    createTokenCookie(res, newRefreshToken);

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', forgotPasswordLimiter, emailValidation, validateRequest, async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond with the same message to avoid user enumeration even if user is not found.
    if (!user) {
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const emailResult = await sendResetPasswordEmail({ to: email, resetUrl });

    // If email sending fails in production the user will not get a message, but for security
    // we still respond with the same generic message.
    if (!emailResult.success) {
      console.warn('Password reset email failed to send for', email, 'reason:', emailResult.reason);
    }

    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', resetPasswordValidation, validateRequest, async (req, res, next) => {
  try {
    const { email, token, password } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Reset token is missing' });
    }

    const hashedToken = hashToken(token);

    // Lookup by token only (do not trust client-supplied email). This prevents cases
    // where a different email is supplied by the client while using a valid token.
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired' });
    }

    // Optional: ensure email (if provided) matches the token owner. If client supplied
    // an email that does not match the token owner, treat it as invalid.
    if (email && user.email !== email) {
      return res.status(400).json({ message: 'Reset token does not match the provided email' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = null;
    await user.save();

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    next(error);
  }
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google`
  }),
  async (req, res, next) => {
    try {
      const user = req.user;
      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken();
      user.refreshToken = hashToken(refreshToken);
      await user.save();
      createTokenCookie(res, refreshToken);

      res.redirect(`${process.env.FRONTEND_URL}/oauth-success?auth=google`);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
