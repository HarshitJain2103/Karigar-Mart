import express from 'express';
const router = express.Router();
import { protect, isArtisan } from '../middleware/authMiddleware.js'; 
import { getPublicStories, getStoryById, getMyStories, createStory, deleteStory, getMyStoryById, updateStory } from '../controllers/storyController.js';

router.route('/')
    .get(getPublicStories) 
    .post(protect, isArtisan, createStory); 

router.route('/my-stories').get(protect, isArtisan, getMyStories);
router.route('/my-stories/:id').get(protect, isArtisan, getMyStoryById);
router.route('/:id')
  .get(getStoryById) // Public
  .put(protect, isArtisan, updateStory)
  .delete(protect, isArtisan, deleteStory);

export default router;