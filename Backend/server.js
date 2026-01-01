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
import session from 'express-session';
import passport from 'passport';
import './config/passport-setup.js';
import authRoutes from './routes/authRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL || 'http://localhost:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use('/api/auth', authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/artisans", artisanRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/onboarding', onboardingRoutes);

cron.schedule('30 2 * * *', () => {
  console.log('-------------------------------------');
  console.log('Running daily Cloudinary cleanup job...');
  runCloudinaryCleanup();
  console.log('-------------------------------------');
});


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
