import Category from '../models/category.model.js';

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.status(200).json(categories);
  } catch (error) {
    console.error(`Error fetching categories: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, imageURL } = req.body;

    const categoryExists = await Category.findOne({ name });

    if (categoryExists) {
      return res.status(400).json({ message: 'Category with this name already exists.' });
    }

    const category = new Category({
      name,
      imageURL,
    });

    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    console.error(`Error creating category: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

export { getCategories, createCategory };
