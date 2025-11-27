import Product from '../models/product.model.js';
import ArtisanProfile from '../models/artisanProfile.model.js';
import Category from '../models/category.model.js';
import asyncHandler from 'express-async-handler';
import veoVideoService from '../services/veoVideoService.js';

const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 8;
  const page = Number(req.query.pageNumber) || 1;
  const keyword = req.query.keyword
    ? {
      $or: [
        { title: { $regex: req.query.keyword, $options: 'i' } },
        { description: { $regex: req.query.keyword, $options: 'i' } },
      ],
    }
    : {};

  const category = req.query.category ? { categoryId: req.query.category } : {};
  const count = await Product.countDocuments({ ...keyword, ...category });
  const products = await Product.find({ ...keyword, ...category })
    .populate('artisanId', 'storeName')
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate({
      path: 'artisanId',
      select: 'storeName userId',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    })
    .populate('categoryId', 'name');

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

const createProduct = async (req, res) => {
  try {
    const artisanProfile = await ArtisanProfile.findOne({ userId: req.user.id });

    if (!artisanProfile) {
      return res.status(404).json({
        message: 'Artisan profile not found. An artisan profile is required to create a product.'
      });
    }

    const {
      title,
      description,
      price,
      inventory,
      categoryId,
      imageURLs,
      generateVideo = true,
      generateDescription = false
    } = req.body;

    // Validate
    if (!title || !price || !categoryId || !imageURLs || imageURLs.length === 0) {
      return res.status(400).json({
        message: 'Title, price, category, and at least one image are required.'
      });
    }

    // Generate AI description if requested
    let finalDescription = description;
    if ((generateDescription || !description) && imageURLs.length > 0) {
      try {
        const category = await Category.findById(categoryId);
        finalDescription = await veoVideoService.generateProductDescription(
          title,
          category?.name || 'product'
        );
        console.log('[AI] Generated description:', finalDescription);
      } catch (error) {
        console.error('[AI] Description failed:', error);
        finalDescription = description || '';
      }
    }

    // Create product
    const product = new Product({
      artisanId: artisanProfile._id,
      title,
      description: finalDescription,
      price,
      stockQuantity: inventory || 1,
      categoryId,
      imageURLs: imageURLs || [],
      videoStatus: generateVideo ? 'generating' : 'not_generated'
    });

    const createdProduct = await product.save();

    // Start video generation in background
    if (generateVideo && imageURLs.length > 0) {
      generateVideoInBackground(createdProduct, imageURLs[0], artisanProfile._id);
    }

    res.status(201).json({
      success: true,
      message: generateVideo
        ? 'Product created! Video is generating (2-5 minutes).'
        : 'Product created successfully!',
      product: createdProduct
    });

  } catch (error) {
    console.error(`Error creating product: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

async function generateVideoInBackground(product, imageUrl, artisanId) {
  try {
    console.log(`[VIDEO] Starting for product: ${product._id}`);

    // Populate category for better prompts
    await product.populate('categoryId', 'name');

    const videoResult = await veoVideoService.generateMarketingVideo(
      {
        _id: product._id,
        title: product.title,
        description: product.description,
        categoryId: product.categoryId
      },
      imageUrl,
      artisanId,
      {
        aspectRatio: "9:16",
        resolution: "720p",
        durationSeconds: 8,
        includeAudio: true
      }
    );

    if (videoResult.success) {
      const finalVideoUrl = videoResult.videoUrlWithAudio || videoResult.videoUrl;

      // Save video + audio metadata
      product.marketingVideo = {
        url: finalVideoUrl,  
        baseVideoUrl: videoResult.videoUrl,  
        prompt: videoResult.videoPrompt,
        generatedAt: new Date(),
        duration: 8,
        aspectRatio: "9:16",
        audioUrl: videoResult.audioUrl || null,
        audioScript: videoResult.audioScript || null,
        hasAudio: !!videoResult.audioUrl
      };
      product.videoStatus = 'completed';

      console.log(`[VIDEO] ✅ Success: ${product._id}`);
      console.log(`[VIDEO] Final URL: ${finalVideoUrl}`);
      console.log(`[AUDIO] ${videoResult.audioUrl ? '✅ With audio' : '⚠️ No audio'}`);
    } else {
      console.error(`[VIDEO] ❌ Failed: ${product._id}`, videoResult.error);
      product.videoStatus = 'failed';
    }

    await product.save();

  } catch (error) {
    console.error(`[VIDEO] ❌ Error for ${product._id}:`, error);
    try {
      product.videoStatus = 'failed';
      await product.save();
    } catch { }
  }
}

const regenerateProductVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const artisanProfile = await ArtisanProfile.findOne({ userId: req.user.id });

    const product = await Product.findOne({
      _id: id,
      artisanId: artisanProfile._id
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found or unauthorized'
      });
    }

    if (!product.imageURLs || product.imageURLs.length === 0) {
      return res.status(400).json({
        message: 'Product needs at least one image'
      });
    }

    product.videoStatus = 'generating';
    await product.save();

    generateVideoInBackground(product, product.imageURLs[0], artisanProfile._id);

    res.json({
      success: true,
      message: 'Video regeneration started. Check back in 2-5 minutes!'
    });

  } catch (error) {
    console.error('Regeneration error:', error);
    res.status(500).json({
      message: 'Failed to regenerate video',
      error: error.message
    });
  }
};

const updateProduct = asyncHandler(async (req, res) => {
  const { title, description, price, inventory, categoryId, imageURLs } = req.body;

  const product = await Product.findById(req.params.id);
  const artisanProfile = await ArtisanProfile.findOne({ userId: req.user.id });

  if (product && artisanProfile) {
    if (product.artisanId.toString() !== artisanProfile._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this product');
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price !== undefined ? price : product.price;
    product.categoryId = categoryId || product.categoryId;
    product.stockQuantity = inventory !== undefined ? inventory : product.stockQuantity;
    product.imageURLs = imageURLs || product.imageURLs;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  const artisanProfile = await ArtisanProfile.findOne({ userId: req.user.id });

  if (product && artisanProfile) {
    if (product.artisanId.toString() !== artisanProfile._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this product');
    }

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
};

const getProductsByArtisan = async (req, res) => {
  try {
    const artisanProfile = await ArtisanProfile.findById(req.params.artisanId);

    if (!artisanProfile) {
      return res.status(404).json({ message: 'Artisan store not found' });
    }

    const products = await Product.find({ artisanId: req.params.artisanId });

    res.status(200).json({
      profile: artisanProfile,
      products: products,
    });

  } catch (error) {
    console.error(`Error fetching artisan's products: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

/*
 * SSE endpoint for real-time video status updates
 * Streams updates when video status changes
 * Auto-closes when all videos are completed
 */
const streamVideoStatus = asyncHandler(async (req, res) => {
  const { productIds } = req.query; // Comma-separated product IDs

  if (!productIds) {
    res.status(400);
    throw new Error('productIds query parameter required');
  }

  const ids = productIds.split(',').filter(Boolean);

  if (ids.length === 0) {
    res.status(400);
    throw new Error('At least one product ID required');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // For Nginx

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', productIds: ids })}\n\n`);

  let pollInterval;
  let pollCount = 0;
  const maxPolls = 72;

  // Poll database every 10 seconds
  pollInterval = setInterval(async () => {
    pollCount++;

    try {
      // Fetch current status of all products
      const products = await Product.find({ _id: { $in: ids } })
        .select('_id videoStatus marketingVideo.url marketingVideo.generatedAt')
        .lean();

      // Check if any are still generating
      const stillGenerating = products.filter(p => p.videoStatus === 'generating');

      // Send status update
      const update = {
        type: 'status',
        timestamp: new Date().toISOString(),
        pollCount,
        products: products.map(p => ({
          productId: p._id.toString(),
          videoStatus: p.videoStatus,
          videoUrl: p.marketingVideo?.url || null,
          generatedAt: p.marketingVideo?.generatedAt || null
        }))
      };

      res.write(`data: ${JSON.stringify(update)}\n\n`);

      // Stop if all are completed/failed OR exceeded max polls
      if (stillGenerating.length === 0 || pollCount >= maxPolls) {
        clearInterval(pollInterval);

        res.write(`data: ${JSON.stringify({
          type: 'complete',
          reason: stillGenerating.length === 0 ? 'all_done' : 'timeout'
        })}\n\n`);

        res.end();
      }

    } catch (error) {
      console.error('[SSE] Polling error:', error);
      clearInterval(pollInterval);

      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: error.message
      })}\n\n`);

      res.end();
    }
  }, 10000);

  // Clean up on client disconnect
  req.on('close', () => {
    console.log('[SSE] Client disconnected');
    clearInterval(pollInterval);
    res.end();
  });
});

export {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByArtisan,
  getProductById,
  regenerateProductVideo,
  streamVideoStatus
};