import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) => {
      const userId = req.user.id;
      const uploadType = req.body.upload_type || 'products';

      // Return a dynamic folder path
      return `karigar-mart/artisans/${userId}/${uploadType}`;
    },
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

export default upload;