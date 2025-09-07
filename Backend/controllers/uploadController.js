const uploadFile = (req, res) => {
  if (req.file) {
    // The 'multer-storage-cloudinary' middleware attaches the file info to req.file
    // The public URL is available at req.file.path
    res.status(201).json({
      message: 'Image uploaded successfully',
      imageUrl: req.file.path,
    });
  } else {
    res.status(400).json({ message: 'No file uploaded.' });
  }
};

export { uploadFile };