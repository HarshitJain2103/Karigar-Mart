import express from 'express';
const router = express.Router();
import {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
  getOrderById,
  getMyOrders,
  createCartRazorpayOrder,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js'; 

router.route('/create-order').post(protect, createRazorpayOrder);
router.route('/create-cart-order').post(protect, createCartRazorpayOrder);
router.route('/verify-payment').post(protect, verifyPaymentAndCreateOrder);
router.route('/myorders').get(protect , getMyOrders);
router.route('/:id').get(protect, getOrderById);

export default router;