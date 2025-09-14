import express from 'express';
const router = express.Router();
import {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
  getOrderById,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js'; 

router.route('/create-order').post(protect, createRazorpayOrder);
router.route('/verify-payment').post(protect, verifyPaymentAndCreateOrder);
router.route('/:id').get(protect, getOrderById);

export default router;