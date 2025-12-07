import express from 'express';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProductsByArtisan, 
  getProductById,
  regenerateProductVideo,
  streamVideoStatus,
  getReels  
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, createProduct);
router.get('/reels', getReels);
router.post('/:id/regenerate-video', protect, regenerateProductVideo);
router.get('/video-status/stream', streamVideoStatus);

router.route('/artisan/:artisanId').get(getProductsByArtisan);
router.route('/:id')
  .get(getProductById)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

export default router;