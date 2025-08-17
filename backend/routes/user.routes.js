import express from 'express';
import {
  register,
  activateAccount,
  login,
  refreshToken,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.get('/activate/:token', activateAccount);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);



export default router;