import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import categories from './data/categories.js';
import Category from './models/category.model.js';


dotenv.config();
connectDB();

const importData = async () => {
  try {
    await Category.deleteMany();
    await Category.insertMany(categories);

    console.log('✅ Data Imported Successfully!');
    process.exit(); 
  } catch (error) {
    console.error(`❌ Error with data import: ${error}`);
    process.exit(1); 
  }
};

// Function to destroy data
const destroyData = async () => {
  try {
    // Clear all categories
    await Category.deleteMany();

    console.log('✅ Data Destroyed Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error with data destruction: ${error}`);
    process.exit(1);
  }
};

// This allows us to run the script with arguments from the command line
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}