import cloudinary from '../config/cloudinary.js';
import ArtisanProfile from '../models/artisanProfile.model.js';
import Product from '../models/product.model.js';
import Story from '../models/story.model.js';

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

  const stories = await Story.find({}, 'coverImageURL');
  for (const story of stories) {
    if (story.coverImageURL) {
        urls.add(story.coverImageURL);
    }
  }

  return urls;
}

function getPublicIdFromUrl(url) {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const versionAndPath = parts[1];
    const pathParts = versionAndPath.split('/');
    pathParts.shift(); 
    const publicIdWithExtension = pathParts.join('/');
    
    return publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
}


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
        prefix: 'karigar-mart/artisans', 
        max_results: 500,
        next_cursor: next_cursor,
      });

      for (const resource of result.resources) {
        cloudinaryPublicIds.add(resource.public_id);
      }
      next_cursor = result.next_cursor;
    } while (next_cursor);
    
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