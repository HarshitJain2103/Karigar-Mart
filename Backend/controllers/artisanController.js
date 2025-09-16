import ArtisanProfile from '../models/artisanProfile.model.js';
import User from '../models/User.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import mongoose from 'mongoose';

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
      about,
      theme, 
      seo,
      media    
    } = req.body;

    const profile = new ArtisanProfile({
      userId,
      storeName,
      tagline,
      address, 
      about,
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
    
    const stats = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.artisan': new mongoose.Types.ObjectId(profile._id) } },
      {
        $group: {
          _id: null, 
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
          totalOrdersSet: { $addToSet: '$_id' }, 
        },
      },
    ]);

    const totalRevenue = stats[0]?.totalRevenue || 0;
    const totalOrders = stats[0]?.totalOrdersSet?.length || 0;

    res.status(200).json({
      profile,
      products,
      totalRevenue, 
      totalOrders,  
    });
  } catch (error) {
    console.error('Error fetching artisan dashboard:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getArtisans = async (req, res) => {
  try {
    const profiles = await ArtisanProfile.find({ status: 'PUBLISHED' })
      .populate('userId', 'firstName lastName'); 

    res.json(profiles);
  } catch (error) {
    console.error('Error fetching artisans:', error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getPublicArtisanStore = async (req, res) => {
  try {
    const profileId = req.params.id;
    const profile = await ArtisanProfile.findOne({ _id: profileId, status: 'PUBLISHED' });

    if (!profile) {
      return res.status(404).json({ message: 'Artisan store not found or is not published.' });
    }

    const products = await Product.find({ artisanId: profileId });
    res.status(200).json({ profile, products });
  } catch (error) {
    console.error('Error fetching public artisan store:', error);
    res.status(500).json({ message: "Server Error" });
  }
};

export { createArtisanProfile  , getArtisanDashboard , getArtisans , getPublicArtisanStore};