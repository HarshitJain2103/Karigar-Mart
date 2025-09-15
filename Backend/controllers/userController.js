import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

const getUserWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.json(user.wishlist);
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { wishlist: productId } }, 
    { new: true }
  ).populate('wishlist');
  res.status(201).json(user.wishlist);
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { wishlist: productId } },
    { new: true }
  ).populate('wishlist');
  res.json(user.wishlist);
});


const getUserCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product');
  res.json(user.cart);
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
    const populatedUser = await user.populate('cart.product');
    res.status(201).json(populatedUser.cart);
});


const removeFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { cart: { product: productId } } },
        { new: true }
    ).populate('cart.product');
    res.json(user.cart);
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