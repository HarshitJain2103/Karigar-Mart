import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

const getUserWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  const cleanedList = user.wishlist.filter(item => item !== null);

  // Update DB if any nulls were found
  if (user.wishlist.length !== cleanedList.length) {
    user.wishlist = cleanedList;
    await user.save();
  }

  res.json(cleanedList);
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const user = await User.findById(req.user._id);

  if (!user.wishlist.includes(productId)) {
    user.wishlist.push(productId);
  }

  await user.save();
  await user.populate('wishlist');
  const cleanedList = user.wishlist.filter(item => item !== null);

  // Update if nulls were found
  if (user.wishlist.length !== cleanedList.length) {
    user.wishlist = cleanedList;
    await user.save();
  }

  res.status(201).json(cleanedList);
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  await user.save();
  await user.populate('wishlist');
  const cleanedList = user.wishlist.filter(item => item !== null);

  // Update if nulls were found
  if (user.wishlist.length !== cleanedList.length) {
    user.wishlist = cleanedList;
    await user.save();
  }

  res.json(cleanedList);
});

const getUserCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product');
  const cleanedCart = user.cart.filter(item => item.product !== null);

  // Update DB if any nulls were found
  if (user.cart.length !== cleanedCart.length) {
    user.cart = cleanedCart;
    await user.save();
  }

  res.json(cleanedCart);
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const user = await User.findById(req.user._id);

  const existingItem = user.cart.find(item => item.product.toString() === productId);

  if (existingItem) {
    existingItem.quantity = quantity;
  } else {
    user.cart.push({ product: productId, quantity });
  }

  await user.save();

  await user.populate('cart.product');

  const cleanedCart = user.cart.filter(item => item.product !== null);

  if (user.cart.length !== cleanedCart.length) {
    const freshUser = await User.findById(req.user._id);
    freshUser.cart = freshUser.cart.filter(item => item.product !== null);
    await freshUser.save();
  }

  res.status(201).json(cleanedCart);
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id);
  user.cart = user.cart.filter(item => item.product.toString() !== productId);
  await user.save();

  await user.populate('cart.product');
  const cleanedCart = user.cart.filter(item => item.product !== null);

  // Update if nulls were found
  if (user.cart.length !== cleanedCart.length) {
    user.cart = cleanedCart;
    await user.save();
  }

  res.json(cleanedCart);
});

const clearUserCart = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { cart: [] } },
    { new: true }
  );
  res.json(user.cart);
});

export {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  getUserCart,
  addToCart,
  removeFromCart,
  clearUserCart,
};