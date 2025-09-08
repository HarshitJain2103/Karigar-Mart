import express from 'express';
import { createArtisanProfile , getArtisanDashboard} from '../controllers/artisanController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.route('/').post(protect, createArtisanProfile);
router.route('/dashboard').get(protect, getArtisanDashboard);

export default router;