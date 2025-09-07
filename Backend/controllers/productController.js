import Product from '../models/product.model.js';
import ArtisanProfile from '../models/artisanProfile.model.js';

const getProducts = async (req, res) => {
  try {
    // Find all products in the database
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

    const { title, description, price, stockQuantity, categoryId, imageURLs } = req.body;

    const product = new Product({
      artisanId: artisanProfile._id, 
      title,
      description,
      price,
      stockQuantity,
      categoryId,
      imageURLs: imageURLs || [], 
    });

    // Save the new product to the database.
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error(`Error creating product: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

export { getProducts, createProduct };
