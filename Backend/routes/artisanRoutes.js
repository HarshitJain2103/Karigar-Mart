import express from 'express';
import { createArtisanProfile , getArtisanDashboard , getArtisans , getPublicArtisanStore} from '../controllers/artisanController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.route('/').get(getArtisans); 
router.route('/').post(protect, createArtisanProfile);
router.route('/dashboard').get(protect, getArtisanDashboard);
router.route('/:id/public').get(getPublicArtisanStore);

export default router;