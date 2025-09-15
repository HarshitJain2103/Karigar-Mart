import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from 'cors';
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import artisanRoutes from "./routes/artisanRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import orderRoutes from './routes/orderRoutes.js';
import cron from 'node-cron';
import { runCloudinaryCleanup } from './utils/cleanupCloudinary.js';
import contactRoutes from './routes/contactRoutes.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories" , categoryRoutes);
app.use("/api/artisans" , artisanRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);

cron.schedule('*/5 * * * *', () => {
  console.log('-------------------------------------');
  console.log('Running daily Cloudinary cleanup job...');
  runCloudinaryCleanup();
  console.log('-------------------------------------');
});


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
