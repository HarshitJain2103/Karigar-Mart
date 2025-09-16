import asyncHandler from 'express-async-handler';
import Story from '../models/story.model.js';
import ArtisanProfile from '../models/artisanProfile.model.js';

const getPublicStories = asyncHandler(async (req, res) => {
  const stories = await Story.find({ status: 'PUBLISHED' })
    .populate('artisanId', 'storeName') 
    .sort({ createdAt: -1 });
  res.json(stories);
});

const getStoryById = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id)
    .populate('artisanId', 'storeName userId');

  if (story && story.status === 'PUBLISHED') {
    res.json(story);
  } else {
    res.status(404);
    throw new Error('Story not found or not published');
  }
});

const getMyStories = asyncHandler(async (req, res) => {
    const artisanProfile = await ArtisanProfile.findOne({ userId: req.user._id });
    if (!artisanProfile) {
        res.status(404);
        throw new Error('Artisan profile not found');
    }
    const stories = await Story.find({ artisanId: artisanProfile._id }).sort({ createdAt: -1 });
    res.json(stories);
});

const createStory = asyncHandler(async (req, res) => {
    const { title, content, coverImageURL } = req.body;
    const artisanProfile = await ArtisanProfile.findOne({ userId: req.user._id });

    const story = new Story({
        title,
        content,
        coverImageURL,
        artisanId: artisanProfile._id,
        status: 'PUBLISHED', 
    });

    const createdStory = await story.save();
    res.status(201).json(createdStory);
});

export { getPublicStories, getStoryById, getMyStories, createStory };