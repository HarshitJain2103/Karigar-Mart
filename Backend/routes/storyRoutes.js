import express from 'express';
const router = express.Router();
import { protect, isArtisan } from '../middleware/authMiddleware.js'; 
import { getPublicStories, getStoryById, getMyStories, createStory } from '../controllers/storyController.js';

router.route('/')
    .get(getPublicStories) 
    .post(protect, isArtisan, createStory); 

router.route('/my-stories').get(protect, isArtisan, getMyStories);
router.route('/:id').get(getStoryById);

export default router;