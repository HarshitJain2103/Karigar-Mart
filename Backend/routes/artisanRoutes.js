import express from 'express';
import { createArtisanProfile } from '../controllers/artisanController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.route('/').post(protect, createArtisanProfile);

export default router;