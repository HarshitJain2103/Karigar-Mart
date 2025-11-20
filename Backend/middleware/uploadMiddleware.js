import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const allowed_formats = ['jpg', 'png', 'jpeg', 'webp'];

    if (req.cloudinaryFolder) {
      return {
        folder: req.cloudinaryFolder,
        allowed_formats,
      };
    }

    const userId = req.user?.id || 'anonymous';
    const uploadType = req.body?.upload_type || 'products';

    return {
      folder: `karigar-mart/artisans/${userId}/${uploadType}`,
      allowed_formats,
    };
  },
});

const upload = multer({ storage: storage });

export default upload;