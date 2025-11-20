import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs"; 
import jwt from "jsonwebtoken";
import { protect } from "../middleware/authMiddleware.js"; 
import upload from "../middleware/uploadMiddleware.js";
import {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  getUserCart,
  addToCart,
  removeFromCart,
  clearUserCart,
} from '../controllers/userController.js';

const router = express.Router();

const buildUserResponse = (user) => ({
  id: user._id,
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  createdAt: user.createdAt,
  phoneNumber: user.phoneNumber || null,
  address: user.address || null,
});

const setAvatarFolder = (req, res, next) => {
  req.cloudinaryFolder = `karigar-mart/users/${req.user._id}/avatars`;
  next();
};

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    //Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    //Create a new user with the hashed password
    const newUser = new User({
      firstName,
      lastName,
      email,
      passwordHash,
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET, 
      { expiresIn: '1d' } 
    );

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        role: savedUser.role,
      },
    });

  } catch (error) {
    res.status(500).json({ message: "Server error during registration.", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({ message: "Server error during login.", error: error.message });
  }
});

router.get("/profile", protect, async (req, res) => {
  if (req.user) {
    res.json(buildUserResponse(req.user));
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

router.put("/profile", protect, async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, address } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (address !== undefined) user.address = { ...user.address, ...address };

    const updatedUser = await user.save();

    res.json(buildUserResponse(updatedUser));
  } catch (error) {
    res.status(500).json({ message: "Server error during profile update.", error: error.message });
  }
});

router.put("/profile/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide current and new password." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: "Password change is not available for social logins." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error during password update.", error: error.message });
  }
});

router.post("/profile/avatar", protect, setAvatarFolder, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: "No avatar uploaded." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.avatar = req.file.path;
    await user.save();

    res.json(buildUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: "Server error while uploading avatar.", error: error.message });
  }
});

router.delete("/profile/delete", protect, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required to delete your account." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password for non-social logins
    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: "Password is incorrect." });
      }
    } else {
      // For social logins, we might want to skip password check or require different verification
      // For now, we'll require some form of verification
      return res.status(400).json({ message: "Password verification required. Please contact support if you used social login." });
    }

    // Delete user (this will cascade delete related data if foreign keys are set up)
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: "Account deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error during account deletion.", error: error.message });
  }
});

//Wishlist Routes
router
  .route('/profile/wishlist')
  .get(protect, getUserWishlist)
  .post(protect, addToWishlist);
router.route('/profile/wishlist/:productId').delete(protect, removeFromWishlist);

// Cart Routes
router
  .route('/profile/cart')
  .get(protect, getUserCart)
  .post(protect, addToCart)
  .delete(protect, clearUserCart);
router.route('/profile/cart/:productId').delete(protect, removeFromCart);

export default router;