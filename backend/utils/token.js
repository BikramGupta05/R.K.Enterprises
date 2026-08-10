import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const createAccessToken = (user) => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET is not defined');
  }

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '15m'
    }
  );
};

const createRefreshToken = () => crypto.randomBytes(64).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };

  res.cookie('refreshToken', token, cookieOptions);
};

export { createAccessToken, createRefreshToken, hashToken, createTokenCookie };
