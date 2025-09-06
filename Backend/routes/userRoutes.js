import express from "express";
import User from "../models/User.js";

const router = express.Router();

// @route POST /api/users
// @desc Create a new user
router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = new User({ name, email, password });
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
