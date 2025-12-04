import { getApiUrl } from '@/lib/api';
 
export const uploadImage = async (file, token, uploadType = 'products') => {
  const formData = new FormData();
  
  formData.append('upload_type', uploadType);
  formData.append('image', file);

  try {
    const response = await fetch(getApiUrl('/api/upload'), {
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