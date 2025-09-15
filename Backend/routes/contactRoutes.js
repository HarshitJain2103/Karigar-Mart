import express from 'express';
const router = express.Router();
import { submitContactForm } from '../controllers/contactController.js';

router.route('/').post(submitContactForm);

export default router;