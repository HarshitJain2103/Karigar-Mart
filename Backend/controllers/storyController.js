import asyncHandler from 'express-async-handler';
import Story from '../models/story.model.js';
import ArtisanProfile from '../models/artisanProfile.model.js';
import { refineStory } from '../services/aiTextService.js';

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

const deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  const artisanProfile = await ArtisanProfile.findOne({ userId: req.user._id });

  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }

  if (story.artisanId.toString() !== artisanProfile._id.toString()) {
    res.status(403);
    throw new Error('User not authorized to delete this story');
  }

  await story.deleteOne();
  res.json({ message: 'Story removed' });
});

const getMyStoryById = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  const artisanProfile = await ArtisanProfile.findOne({ userId: req.user._id });

  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }

  if (story.artisanId.toString() !== artisanProfile._id.toString()) {
    res.status(403);
    throw new Error('User not authorized to view this story');
  }

  res.json(story);
});

const updateStory = asyncHandler(async (req, res) => {
  const { title, content, coverImageURL, status } = req.body;
  const story = await Story.findById(req.params.id);
  const artisanProfile = await ArtisanProfile.findOne({ userId: req.user._id });

  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }

  if (story.artisanId.toString() !== artisanProfile._id.toString()) {
    res.status(403);
    throw new Error('User not authorized to update this story');
  }

  story.title = title || story.title;
  story.content = content || story.content;
  story.coverImageURL = coverImageURL || story.coverImageURL;
  story.status = status || story.status;

  const updatedStory = await story.save();
  res.json(updatedStory);
});

const refineStoryContent = asyncHandler(async (req, res) => {
  console.log('Refine request received', { user: req.user._id, body: req.body });
  const { title, content } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error('Title and content are required');
  }

  if (title.length > 500 || content.length > 10000) {
    res.status(400);
    throw new Error('Title or content too long for AI refinement');
  }

  console.log('Calling AI for title and content');
  const { title: refinedTitle, content: refinedContent } = await refineStory({ title, content });
  
  console.log('AI refinement successful');
  res.json({ refinedTitle, refinedContent });
});

export { getPublicStories, getStoryById, getMyStories, createStory, deleteStory, getMyStoryById, updateStory, refineStoryContent };