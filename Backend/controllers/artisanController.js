import ArtisanProfile from '../models/artisanProfile.model.js';
import User from '../models/User.js';
import Product from '../models/product.model.js';

const createArtisanProfile = async (req, res) => {
  try {
    const userId = req.user.id; 

    const existingProfile = await ArtisanProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ message: 'Artisan profile already exists for this user.' });
    }

    const {
      storeName,
      tagline,
      address, 
      story,
      theme, 
      seo,
      media    
    } = req.body;

    const profile = new ArtisanProfile({
      userId,
      storeName,
      tagline,
      address, 
      story,
      theme,
      seo,
      media,   
      status: 'PUBLISHED', 
    });

    const createdProfile = await profile.save();

    await User.findByIdAndUpdate(userId, { role: 'ARTISAN' });

    res.status(201).json(createdProfile);

  } catch (error) {
    console.error('Error creating artisan profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

const getArtisanDashboard = async (req, res) => {
  try {
    const profile = await ArtisanProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: 'Artisan profile not found.' });
    }

    const products = await Product.find({ artisanId: profile._id });

    res.status(200).json({
      profile,
      products,
    });
  } catch (error) {
    console.error('Error fetching artisan dashboard:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export { createArtisanProfile  , getArtisanDashboard};