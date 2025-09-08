import mongoose from 'mongoose';

const artisanProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  storeName: {
    type: String,
    required: true,
    trim: true,
  },
  tagline: {
    type: String,
    trim: true,
  },
  address: {
    city: { type: String, required: true },
    state: { type: String, required: true },
  },
  story: {
    type: String,
    required: true,
  },

  media: {
    heroImageURL: { type: String, required: true },
    galleryImageURLs: { 
      type: [String], 
      default: [],
      validate: [
        (val) => val.length <= 8,
      ]
    },
  },

  theme: {
    preset: { 
      type: String,
      enum: ['modern', 'classic', 'minimalist', 'rustic'],
      default: 'modern' 
    },
    color: { type: String, default: '#0f172a' },
  },

  seo: {
    metaDescription: { type: String },
    keywords: { type: [String] },
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED'],
    default: 'DRAFT',
  },
}, {
  timestamps: true,
});

const ArtisanProfile = mongoose.model('ArtisanProfile', artisanProfileSchema);

export default ArtisanProfile;