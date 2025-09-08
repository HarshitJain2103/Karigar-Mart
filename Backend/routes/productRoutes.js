import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, getProductsByArtisan } from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, createProduct);
router.route('/artisan/:artisanId').get(getProductsByArtisan);

router.route('/:id')
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

export default router;