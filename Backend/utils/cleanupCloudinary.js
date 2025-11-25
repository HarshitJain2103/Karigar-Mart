import cloudinary from '../config/cloudinary.js';
import ArtisanProfile from '../models/artisanProfile.model.js';
import Product from '../models/product.model.js';
import Story from '../models/story.model.js';
import User from '../models/User.js';

async function getDatabaseImageUrls() {
  const urls = new Set();

  const profiles = await ArtisanProfile.find({}, 'media.heroImageURL media.galleryImageURLs');
  for (const profile of profiles) {
    if (profile.media.heroImageURL) {
      urls.add(profile.media.heroImageURL);
    }
    for (const url of profile.media.galleryImageURLs) {
      urls.add(url);
    }
  }

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

  const users = await User.find({}, 'avatar');
  for (const user of users) {
    if (user.avatar) {
      urls.add(user.avatar);
    }
  }

  return urls;
}

//Get all video URLs from database
 
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

//Extract Cloudinary public_id from URL (handles URL encoding)
function getPublicIdFromUrl(url) {
  try {
    // Split by /upload/
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const afterUpload = parts[1];

    // Split into path components
    const pathParts = afterUpload.split('/');

    // Remove version (v1234567890)
    pathParts.shift();

    // Rejoin to get: folder/subfolder/filename.ext
    const pathWithExtension = pathParts.join('/');

    // Remove file extension
    const lastDotIndex = pathWithExtension.lastIndexOf('.');
    if (lastDotIndex === -1) return pathWithExtension;

    const publicIdRaw = pathWithExtension.substring(0, lastDotIndex);

    // URL-encode the public_id to match how Cloudinary stores it
    // This handles special characters like em-dash (–), quotes, etc.
    const publicIdEncoded = publicIdRaw
      .split('/')
      .map(segment => encodeURIComponent(decodeURIComponent(segment)))
      .join('/');

    return publicIdEncoded;

  } catch (error) {
    console.error(`Error parsing URL: ${url}`, error.message);
    return null;
  }
}


async function getAllCloudinaryResources(prefix = 'karigar-mart') {
  const resources = new Map(); 

  const resourceTypes = ['image', 'video'];

  for (const resourceType of resourceTypes) {
    let next_cursor = null;

    do {
      try {
        const result = await cloudinary.api.resources({
          type: 'upload',
          resource_type: resourceType,
          prefix: prefix,
          max_results: 500,
          next_cursor: next_cursor,
        });

        for (const resource of result.resources) {
          resources.set(resource.public_id, resourceType);
        }

        next_cursor = result.next_cursor;
      } catch (error) {
        console.error(`Error fetching ${resourceType} resources:`, error.message);
        break;
      }
    } while (next_cursor);
  }

  return resources;
}

async function deleteOrphanedResources(orphansMap) {
  if (orphansMap.size === 0) return;

  const imageIds = [];
  const videoIds = [];

  for (const [publicId, resourceType] of orphansMap) {
    if (resourceType === 'video') {
      videoIds.push(publicId);
    } else {
      imageIds.push(publicId);
    }
  }

  console.log(`Found ${orphansMap.size} orphaned resources to delete.`);

  // Delete images
  if (imageIds.length > 0) {
    try {
      console.log(`Deleting ${imageIds.length} orphaned images...`);
      await cloudinary.api.delete_resources(imageIds, {
        resource_type: 'image',
        invalidate: true  // Clear CDN cache
      });
      console.log(`✅ Deleted ${imageIds.length} images`);
    } catch (error) {
      console.error('❌ Image deletion error:', error.message);
    }
  }

  // Delete videos
  if (videoIds.length > 0) {
    try {
      console.log(`Deleting ${videoIds.length} orphaned videos...`);
      await cloudinary.api.delete_resources(videoIds, {
        resource_type: 'video',
        invalidate: true  // Clear CDN cache immediately
      });
      console.log(`✅ Deleted ${videoIds.length} videos`);
    } catch (error) {
      console.error('❌ Video deletion error:', error.message);
    }
  }
}

//MAIN CLEANUP FUNCTION
export const runCloudinaryCleanup = async () => {
  console.log('-------------------------------------');
  console.log('Starting Cloudinary cleanup...');
  console.log('-------------------------------------');

  try {
    const dbImageUrls = await getDatabaseImageUrls();
    const dbVideoUrls = await getDatabaseVideoUrls();

    console.log(`📊 Database stats:`);
    console.log(`   - Images: ${dbImageUrls.size}`);
    console.log(`   - Videos: ${dbVideoUrls.size}`);

    // Step 2: Convert URLs to public IDs (URL-encoded)
    const dbPublicIds = new Set();

    for (const url of [...dbImageUrls, ...dbVideoUrls]) {
      const publicId = getPublicIdFromUrl(url);
      if (publicId) {
        dbPublicIds.add(publicId);
      }
    }

    console.log(`   - Total public IDs extracted: ${dbPublicIds.size}`);

    // Step 3: Get all resources from Cloudinary
    const cloudinaryResources = await getAllCloudinaryResources('karigar-mart');

    console.log(`☁️  Cloudinary stats:`);
    console.log(`   - Total resources: ${cloudinaryResources.size}`);

    // Step 4: Find orphans (in Cloudinary but not in DB)
    const orphansToDelete = new Map(); // Map<public_id, resource_type>

    for (const [cloudinaryId, resourceType] of cloudinaryResources) {
      if (!dbPublicIds.has(cloudinaryId)) {
        orphansToDelete.set(cloudinaryId, resourceType);
      }
    }

    // Step 5: Show details and delete
    if (orphansToDelete.size > 0) {
      console.log(`\n🗑️  Found ${orphansToDelete.size} orphaned resources:`);

      // Show first 5 as examples
      let count = 0;
      for (const [publicId, resourceType] of orphansToDelete) {
        if (count >= 5) break;
        console.log(`   - [${resourceType}] ${publicId}`);
        count++;
      }

      if (orphansToDelete.size > 5) {
        console.log(`   ... and ${orphansToDelete.size - 5} more`);
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

//Manual cleanup test function (for debugging)

export const testCleanupDryRun = async () => {
  console.log('🧪 DRY RUN - No deletions will occur\n');

  const dbImageUrls = await getDatabaseImageUrls();
  const dbVideoUrls = await getDatabaseVideoUrls();

  let indexImg = 1;
  console.log('Sample Image URLs from DB:');
  for (const url of dbImageUrls) {
    console.log(`${indexImg++}. ${url}`)
  }
  let indexVid = 1;
  console.log("Sample video URLs from DB");
  for (const url of dbVideoUrls) {
    console.log(`${indexVid++}. ${url}`)
  }

  console.log('\nExtracted public ID:');
  const sampleUrl = [...dbVideoUrls][0];
  const publicId = getPublicIdFromUrl(sampleUrl);
  console.log(publicId);

  console.log('\nCloudinary resources:');
  const cloudinaryResources = await getAllCloudinaryResources('karigar-mart');
  for (const [id, type] of cloudinaryResources) {
    console.log(`[${type}] ${id}`);
  }
};