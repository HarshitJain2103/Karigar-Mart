import Product from '../models/product.model.js';
import ArtisanProfile from '../models/artisanProfile.model.js';
import asyncHandler from 'express-async-handler';

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('artisanId', 'storeName')
      .populate('categoryId', 'name');
      
    res.status(200).json(products);
  } catch (error) {
    console.error(`Error fetching products: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

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

export { getProducts, createProduct , updateProduct , deleteProduct , getProductsByArtisan};
