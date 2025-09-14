import Razorpay from 'razorpay';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'firstName lastName email'
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { productId, qty } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const options = {
    amount: product.price * qty * 100, 
    currency: 'INR',
    receipt: `receipt_order_${new Date().getTime()}`,
  };

  const order = await instance.orders.create(options);

  if (!order) {
    res.status(500);
    throw new Error('Something went wrong with Razorpay');
  }

  res.status(200).json({
    ...order,
    productId: product._id,
    productName: product.title,
    productImage: product.imageURLs[0], 
  });
});

const verifyPaymentAndCreateOrder = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderItems,
    shippingAddress,
    totalPrice,
  } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {

    for (const item of orderItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.name}`);
      }

      if (product.stockQuantity < item.qty) {
        res.status(400);
        throw new Error(`Sorry, ${product.title} is out of stock. A refund will be processed.`);
      }

      product.stockQuantity -= item.qty;
      await product.save({ validateBeforeSave: true }); 
    }

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      totalPrice,
      paymentMethod: 'Razorpay',
      paymentResult: {
        id: razorpay_payment_id,
        status: 'COMPLETED',
        update_time: new Date().toISOString(),
        email_address: req.user.email,
      },
      isPaid: true,
      paidAt: Date.now(),
    });

    const createdOrder = await order.save();
    
    res.status(201).json({ success: true, orderId: createdOrder._id });

  } else {
    res.status(400).json({ success: false, message: 'Payment verification failed' });
  }
});

export { createRazorpayOrder, verifyPaymentAndCreateOrder, getOrderById };