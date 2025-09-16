import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  artisanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ArtisanProfile',
    required: true,
  },
  coverImageURL: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED'],
    default: 'PUBLISHED',
  },
}, {
  timestamps: true,
});

const Story = mongoose.model('Story', storySchema);

export default Story;