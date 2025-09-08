export const uploadImage = async (file, token, uploadType = 'products') => {
  const formData = new FormData();
  // Ensure the text field 'upload_type' is appended before the file
  formData.append('upload_type', uploadType);
  formData.append('image', file);

  try {
    const response = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || 'Image upload failed.');
    }

    const data = await response.json();
    return data.imageUrl; // Return the secure URL from Cloudinary
  } catch (error) {
    console.error('Upload service error:', error);
    throw error;
  }
};