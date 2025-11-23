import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const result = await Product.updateMany(
      { 
        marketingVideo: { $exists: false } 
      },
      { 
        $set: { 
          marketingVideo: {
            url: null,
            prompt: null,
            generatedAt: null,
            duration: 8,
            aspectRatio: '9:16'
          },
          videoStatus: 'not_generated'
        } 
      }
    );
    
    console.log(`✅ Migrated ${result.modifiedCount} products`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateProducts();