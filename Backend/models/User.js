import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Changed 'name' to 'firstName' and 'lastName' to match the signup form
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // IMPORTANT: Changed 'password' to 'passwordHash' for security clarity
    passwordHash: {
      type: String,
      required: true,
    },
    // Added the 'role' field as discussed
    role: {
      type: String,
      enum: ['CUSTOMER', 'ARTISAN'], // Restricts the role to only these two values
      default: 'CUSTOMER', // New users will be customers by default
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
