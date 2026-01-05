import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  artisanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ArtisanProfile',
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  stockQuantity: {
    type: Number,
    required: true,
    default: 1,
  },
  imageURLs: {
    type: [String],
    required: true,
    validate: [
      (val) => val.length <= 8,
    ]
  },
  marketingVideo: {
    url: { type: String, default: null },
    baseVideoUrl: { type: String, default: null },
    prompt: { type: String, default: null },
    generatedAt: { type: Date, default: null },
    duration: { type: Number, default: 8 },
    aspectRatio: { type: String, default: '9:16' },
    // ✅ Audio metadata
    audioUrl: { type: String, default: null },
    audioScript: { type: String, default: null },
    hasAudio: { type: Boolean, default: false }
  },
  videoGenerationCount: {
    type: Number,
    default: 0,
  },
  videoStatus: {
    type: String,
    enum: ['not_generated', 'generating', 'completed', 'failed'],
    default: 'not_generated'
  }
}, {
  timestamps: true,
});
productSchema.index({ artisanId: 1, videoStatus: 1 });
productSchema.index({ categoryId: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;