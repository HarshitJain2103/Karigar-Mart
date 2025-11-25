// Backend/utils/cleanupCloudinary.js
// ✅ ENHANCED: Now cleans up both images AND videos

import cloudinary from '../config/cloudinary.js';
import ArtisanProfile from '../models/artisanProfile.model.js';
import Product from '../models/product.model.js';
import Story from '../models/story.model.js';
import User from '../models/User.js';

/**
 * Get all image URLs from database
 */
async function getDatabaseImageUrls() {
  const urls = new Set();

  // 1. Artisan Profile Images
  const profiles = await ArtisanProfile.find({}, 'media.heroImageURL media.galleryImageURLs');
  for (const profile of profiles) {
    if (profile.media.heroImageURL) {
      urls.add(profile.media.heroImageURL);
    }
    for (const url of profile.media.galleryImageURLs) {
      urls.add(url);
    }
  }

  // 2. Product Images
  const products = await Product.find({}, 'imageURLs');
  for (const product of products) {
    for (const url of product.imageURLs) {
      urls.add(url);
    }
  }

  // 3. Story Cover Images
  const stories = await Story.find({}, 'coverImageURL');
  for (const story of stories) {
    if (story.coverImageURL) {
      urls.add(story.coverImageURL);
    }
  }

  // 4. User Avatars
  const users = await User.find({}, 'avatar');
  for (const user of users) {
    if (user.avatar) {
      urls.add(user.avatar);
    }
  }

  return urls;
}

/**
 * ✅ NEW: Get all video URLs from database
 */
async function getDatabaseVideoUrls() {
  const urls = new Set();

  // Get product marketing videos
  const products = await Product.find(
    { 'marketingVideo.url': { $exists: true, $ne: null } },
    'marketingVideo.url'
  );

  for (const product of products) {
    if (product.marketingVideo?.url) {
      urls.add(product.marketingVideo.url);
    }
  }

  return urls;
}

/**
 * Extract Cloudinary public_id from URL
 */
function getPublicIdFromUrl(url) {
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;

  const versionAndPath = parts[1];
  const pathParts = versionAndPath.split('/');
  pathParts.shift(); // Remove version (e.g., v1234567890)
  const publicIdWithExtension = pathParts.join('/');
  
  return publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
}

/**
 * ✅ ENHANCED: Get all Cloudinary resources (images + videos)
 */
async function getAllCloudinaryResources(prefix = 'karigar-mart') {
  const publicIds = new Set();
  
  // ✅ Scan both images AND videos
  const resourceTypes = ['image', 'video'];
  
  for (const resourceType of resourceTypes) {
    let next_cursor = null;
    
    do {
      try {
        const result = await cloudinary.api.resources({
          type: 'upload',
          resource_type: resourceType, // ✅ Scan videos too
          prefix: prefix,
          max_results: 500,
          next_cursor: next_cursor,
        });

        for (const resource of result.resources) {
          publicIds.add(resource.public_id);
        }
        
        next_cursor = result.next_cursor;
      } catch (error) {
        console.error(`Error fetching ${resourceType} resources:`, error.message);
        break;
      }
    } while (next_cursor);
  }
  
  return publicIds;
}

/**
 * ✅ ENHANCED: Delete resources (works for both images and videos)
 */
async function deleteOrphanedResources(orphanIds) {
  if (orphanIds.length === 0) return;

  console.log(`Found ${orphanIds.length} orphaned resources to delete.`);
  
  // Separate images and videos
  const imageIds = [];
  const videoIds = [];
  
  for (const publicId of orphanIds) {
    // Check if it's in the product-videos folder
    if (publicId.includes('/product-videos/')) {
      videoIds.push(publicId);
    } else {
      imageIds.push(publicId);
    }
  }

  // Delete images
  if (imageIds.length > 0) {
    try {
      console.log(`Deleting ${imageIds.length} orphaned images...`);
      await cloudinary.api.delete_resources(imageIds, { resource_type: 'image' });
      console.log(`✅ Deleted ${imageIds.length} images`);
    } catch (error) {
      console.error('❌ Image deletion error:', error.message);
    }
  }

  // Delete videos
  if (videoIds.length > 0) {
    try {
      console.log(`Deleting ${videoIds.length} orphaned videos...`);
      await cloudinary.api.delete_resources(videoIds, { resource_type: 'video' });
      console.log(`✅ Deleted ${videoIds.length} videos`);
    } catch (error) {
      console.error('❌ Video deletion error:', error.message);
    }
  }
}

/**
 * ✅ MAIN CLEANUP FUNCTION
 */
export const runCloudinaryCleanup = async () => {
  console.log('-------------------------------------');
  console.log('Starting Cloudinary cleanup...');
  console.log('-------------------------------------');
  
  try {
    // Step 1: Get all URLs from database
    const dbImageUrls = await getDatabaseImageUrls();
    const dbVideoUrls = await getDatabaseVideoUrls();
    
    console.log(`📊 Database stats:`);
    console.log(`   - Images: ${dbImageUrls.size}`);
    console.log(`   - Videos: ${dbVideoUrls.size}`);
    
    // Step 2: Convert URLs to public IDs
    const dbPublicIds = new Set();
    
    for (const url of [...dbImageUrls, ...dbVideoUrls]) {
      const publicId = getPublicIdFromUrl(url);
      if (publicId) {
        dbPublicIds.add(publicId);
      }
    }
    
    // Step 3: Get all resources from Cloudinary
    const cloudinaryPublicIds = await getAllCloudinaryResources('karigar-mart');
    
    console.log(`☁️  Cloudinary stats:`);
    console.log(`   - Total resources: ${cloudinaryPublicIds.size}`);
    
    // Step 4: Find orphans (in Cloudinary but not in DB)
    const orphansToDelete = [];
    
    for (const cloudinaryId of cloudinaryPublicIds) {
      if (!dbPublicIds.has(cloudinaryId)) {
        orphansToDelete.push(cloudinaryId);
      }
    }
    
    // Step 5: Delete orphans
    if (orphansToDelete.length > 0) {
      console.log(`\n🗑️  Found ${orphansToDelete.length} orphaned resources:`);
      
      // Show first 5 as examples
      for (let i = 0; i < Math.min(5, orphansToDelete.length); i++) {
        console.log(`   - ${orphansToDelete[i]}`);
      }
      if (orphansToDelete.length > 5) {
        console.log(`   ... and ${orphansToDelete.length - 5} more`);
      }
      
      await deleteOrphanedResources(orphansToDelete);
      console.log('\n✅ Successfully deleted orphaned resources.');
    } else {
      console.log('\n✅ No orphaned resources found. Your Cloudinary account is clean!');
    }
    
    console.log('-------------------------------------');

  } catch (error) {
    console.error('❌ Error during Cloudinary cleanup:', error);
    console.log('-------------------------------------');
  }
};