import Product from '../models/product.model.js';
import ArtisanProfile from '../models/artisanProfile.model.js';
import asyncHandler from 'express-async-handler';

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
      return res.status(404).json({ message: 'Artisan profile not found. An artisan profile is required to create a product.' });
    }

    const { title, description, price, inventory, categoryId, imageURLs } = req.body;

    const product = new Product({
      artisanId: artisanProfile._id, 
      title,
      description,
      price,
      stockQuantity : inventory,
      categoryId,
      imageURLs: imageURLs || [], 
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error(`Error creating product: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
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

export { getProducts, createProduct , updateProduct , deleteProduct , getProductsByArtisan , getProductById};
