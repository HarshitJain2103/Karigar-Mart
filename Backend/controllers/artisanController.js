import ArtisanProfile from '../models/artisanProfile.model.js';
import User from '../models/User.js';

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

export { createArtisanProfile };