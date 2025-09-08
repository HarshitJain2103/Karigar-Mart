import cloudinary from '../config/cloudinary.js';
import ArtisanProfile from '../models/artisanProfile.model.js';
import Product from '../models/product.model.js';

// This function will get all image URLs currently stored in your database
async function getDatabaseImageUrls() {
  const urls = new Set();

  // 1. Get URLs from Artisan Profiles
  const profiles = await ArtisanProfile.find({}, 'media.heroImageURL media.galleryImageURLs');
  for (const profile of profiles) {
    if (profile.media.heroImageURL) {
      urls.add(profile.media.heroImageURL);
    }
    for (const url of profile.media.galleryImageURLs) {
      urls.add(url);
    }
  }

  // 2. Get URLs from Products
  const products = await Product.find({}, 'imageURLs');
  for (const product of products) {
    for (const url of product.imageURLs) {
      urls.add(url);
    }
  }

  return urls;
}

// This function gets the public_id from a full Cloudinary URL
function getPublicIdFromUrl(url) {
    // Example URL: https://res.cloudinary.com/daysorzbe/image/upload/v1757240969/karigar-mart/artisans/USER_ID/products/FILENAME.jpg
    // We want to extract: karigar-mart/artisans/USER_ID/products/FILENAME
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const versionAndPath = parts[1];
    const pathParts = versionAndPath.split('/');
    pathParts.shift(); // Remove the version (e.g., v1757240969)
    const publicIdWithExtension = pathParts.join('/');
    
    // Remove the file extension (.jpg, .png, etc.)
    return publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
}


// The main cleanup function
export const runCloudinaryCleanup = async () => {
  console.log('Starting Cloudinary cleanup...');
  try {
    const dbUrls = await getDatabaseImageUrls();
    const dbPublicIds = new Set(Array.from(dbUrls).map(getPublicIdFromUrl).filter(id => id));

    // Get all assets from your 'karigar-mart' folder in Cloudinary
    let next_cursor = null;
    const cloudinaryPublicIds = new Set();
    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'karigar-mart/artisans', // Only search in our main folder
        max_results: 500,
        next_cursor: next_cursor,
      });

      for (const resource of result.resources) {
        cloudinaryPublicIds.add(resource.public_id);
      }
      next_cursor = result.next_cursor;
    } while (next_cursor);
    
    // Compare the lists to find orphans
    const orphansToDelete = [];
    for (const cloudinaryId of cloudinaryPublicIds) {
      if (!dbPublicIds.has(cloudinaryId)) {
        orphansToDelete.push(cloudinaryId);
      }
    }
    
    if (orphansToDelete.length > 0) {
      console.log(`Found ${orphansToDelete.length} orphaned images to delete.`);
      // Delete the orphans from Cloudinary in batches of 100
      await cloudinary.api.delete_resources(orphansToDelete);
      console.log('Successfully deleted orphaned images.');
    } else {
      console.log('No orphaned images found. Your Cloudinary account is clean!');
    }

  } catch (error) {
    console.error('Error during Cloudinary cleanup:', error);
  }
};