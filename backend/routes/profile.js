import express from 'express';
import protect from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
