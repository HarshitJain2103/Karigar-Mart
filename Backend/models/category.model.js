import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  imageURL: {
    type: String, // An optional image for the category itself (for the homepage)
  },
  // For future scalability, you can add sub-categories
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null 
  }
});

const Category = mongoose.model('Category', categorySchema);

export default Category;