import express from 'express';
const router = express.Router();
import rateLimit from 'express-rate-limit';
import { protect, isArtisan } from '../middleware/authMiddleware.js'; 
import { getPublicStories, getStoryById, getMyStories, createStory, deleteStory, getMyStoryById, updateStory, refineStoryContent } from '../controllers/storyController.js';

router.route('/')
    .get(getPublicStories) 
    .post(protect, isArtisan, createStory); 

router.route('/my-stories').get(protect, isArtisan, getMyStories);
router.route('/my-stories/:id').get(protect, isArtisan, getMyStoryById);
router.route('/:id')
  .get(getStoryById) // Public
  .put(protect, isArtisan, updateStory)
  .delete(protect, isArtisan, deleteStory);

const aiRefineLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5, // limit each user to 5 requests per windowMs
  keyGenerator: (req) => req.user._id.toString(),
  message: 'Too many AI refine requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/refine', protect, isArtisan, aiRefineLimiter, refineStoryContent);

export default router;