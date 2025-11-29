import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  
    const allProducts = await Product.find({});
    console.log(`\n📊 Total products: ${allProducts.length}`);
    
    let needsMigration = 0;
    let alreadyMigrated = 0;
    let noVideoGenerated = 0;
    
    allProducts.forEach(product => {
      if (!product.marketingVideo) {
        needsMigration++;
      } else if (product.marketingVideo.url && !product.marketingVideo.baseVideoUrl) {
        needsMigration++;
      } else if (product.marketingVideo.baseVideoUrl) {
        alreadyMigrated++;
      } else {
        noVideoGenerated++;
      }
    });
    
    console.log(`\n📈 Migration Status:`);
    console.log(`   - Needs migration: ${needsMigration}`);
    console.log(`   - Already migrated: ${alreadyMigrated}`);
    console.log(`   - No video generated: ${noVideoGenerated}`);
    
    // STEP 1: Handle products without marketingVideo field at all
    console.log(`\n🔄 Step 1: Adding marketingVideo field to products without it...`);
    const step1Result = await Product.updateMany(
      { 
        marketingVideo: { $exists: false } 
      },
      { 
        $set: { 
          marketingVideo: {
            url: null,
            baseVideoUrl: null,
            prompt: null,
            generatedAt: null,
            duration: 8,
            aspectRatio: '9:16',
            audioUrl: null,
            audioScript: null,
            hasAudio: false
          },
          videoStatus: 'not_generated'
        } 
      }
    );
    console.log(`   ✅ Added marketingVideo field to ${step1Result.modifiedCount} products`);
    
    // STEP 2: Migrate old structure (url only) to new structure
    console.log(`\n🔄 Step 2: Migrating old video structure to new structure...`);
    const productsWithOldStructure = await Product.find({
      'marketingVideo.url': { $ne: null },
      'marketingVideo.baseVideoUrl': { $exists: false }
    });
    
    let migratedOldStructure = 0;
    for (const product of productsWithOldStructure) {
      await Product.updateOne(
        { _id: product._id },
        {
          $set: {
            'marketingVideo.baseVideoUrl': product.marketingVideo.url,
            'marketingVideo.audioUrl': null,
            'marketingVideo.audioScript': null,
            'marketingVideo.hasAudio': false
          }
        }
      );
      migratedOldStructure++;
    }
    console.log(`   ✅ Migrated ${migratedOldStructure} products from old structure`);
    
    // STEP 3: Add missing audio fields to products that have baseVideoUrl but no audio fields
    console.log(`\n🔄 Step 3: Adding missing audio fields to existing videos...`);
    const step3Result = await Product.updateMany(
      {
        'marketingVideo.baseVideoUrl': { $ne: null },
        'marketingVideo.audioUrl': { $exists: false }
      },
      {
        $set: {
          'marketingVideo.audioUrl': null,
          'marketingVideo.audioScript': null,
          'marketingVideo.hasAudio': false
        }
      }
    );
    console.log(`   ✅ Added audio fields to ${step3Result.modifiedCount} products`);
    
    // STEP 4: Ensure all products without videos have complete null structure
    console.log(`\n🔄 Step 4: Ensuring complete null structure for products without videos...`);
    const step4Result = await Product.updateMany(
      {
        $or: [
          { 'marketingVideo.url': null },
          { 'marketingVideo.url': { $exists: false } }
        ]
      },
      {
        $set: {
          'marketingVideo.url': null,
          'marketingVideo.baseVideoUrl': null,
          'marketingVideo.prompt': null,
          'marketingVideo.generatedAt': null,
          'marketingVideo.duration': 8,
          'marketingVideo.aspectRatio': '9:16',
          'marketingVideo.audioUrl': null,
          'marketingVideo.audioScript': null,
          'marketingVideo.hasAudio': false,
          videoStatus: 'not_generated'
        }
      }
    );
    console.log(`   ✅ Standardized ${step4Result.modifiedCount} products without videos`);
    
    // STEP 5: Fix videoStatus for products with videos
    console.log(`\n🔄 Step 5: Fixing videoStatus for completed videos...`);
    const step5Result = await Product.updateMany(
      {
        'marketingVideo.baseVideoUrl': { $ne: null },
        videoStatus: { $ne: 'completed' }
      },
      {
        $set: {
          videoStatus: 'completed'
        }
      }
    );
    console.log(`   ✅ Fixed videoStatus for ${step5Result.modifiedCount} products`);
    
    // VERIFICATION: Check final state
    console.log(`\n\n📋 VERIFICATION - Final State:`);
    const finalProducts = await Product.find({});
    
    let withCompleteStructure = 0;
    let withVideos = 0;
    let withAudio = 0;
    let withoutVideos = 0;
    
    finalProducts.forEach(product => {
      const mv = product.marketingVideo;
      
      // Check if has complete structure
      if (mv && 
          mv.hasOwnProperty('url') && 
          mv.hasOwnProperty('baseVideoUrl') &&
          mv.hasOwnProperty('audioUrl') &&
          mv.hasOwnProperty('audioScript') &&
          mv.hasOwnProperty('hasAudio')) {
        withCompleteStructure++;
      }
      
      if (mv && mv.baseVideoUrl) {
        withVideos++;
        if (mv.hasAudio) {
          withAudio++;
        }
      } else {
        withoutVideos++;
      }
    });
    
    console.log(`   - Total products: ${finalProducts.length}`);
    console.log(`   - With complete structure: ${withCompleteStructure}`);
    console.log(`   - With generated videos: ${withVideos}`);
    console.log(`   - With audio: ${withAudio}`);
    console.log(`   - Without videos: ${withoutVideos}`);
    
    // Sample output of migrated product
    console.log(`\n\n📦 Sample Migrated Product Structure:`);
    const sampleProduct = await Product.findOne({ 'marketingVideo.baseVideoUrl': { $ne: null } });
    if (sampleProduct) {
      console.log(JSON.stringify({
        _id: sampleProduct._id,
        title: sampleProduct.title,
        marketingVideo: sampleProduct.marketingVideo,
        videoStatus: sampleProduct.videoStatus
      }, null, 2));
    }
    
    const sampleNoVideo = await Product.findOne({ 'marketingVideo.baseVideoUrl': null });
    if (sampleNoVideo) {
      console.log(`\n📦 Sample Product Without Video:`);
      console.log(JSON.stringify({
        _id: sampleNoVideo._id,
        title: sampleNoVideo.title,
        marketingVideo: sampleNoVideo.marketingVideo,
        videoStatus: sampleNoVideo.videoStatus
      }, null, 2));
    }
    
    console.log(`\n\n✅✅✅ Migration completed successfully!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateProducts();