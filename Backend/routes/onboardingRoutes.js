import express from 'express';
import { onboardingChat } from '../controllers/onboardingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/chat', protect, onboardingChat);

export default router;