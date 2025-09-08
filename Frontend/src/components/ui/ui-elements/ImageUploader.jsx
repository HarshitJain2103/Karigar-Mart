import React, { useRef, useState } from 'react';
import useAuthStore from '@/stores/authStore';
import { uploadImage } from '@/lib/uploadService';
import { Button } from '@/components/ui/button';

export default function ImageUploader({ images = [], onChange, max = 8, single = false, uploadType }) {
  const inputRef = useRef(null);
  const token = useAuthStore((state) => state.token);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const availableSlots = max - images.length;
    if (files.length > availableSlots) {
      alert(`You can only upload ${availableSlots} more image(s). Please select fewer files.`);
      if (inputRef.current) inputRef.current.value = null;
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      if (single) {
        const url = await uploadImage(files[0], token, uploadType);
        onChange([url]);
      } else {
        let currentImages = [...images];
        for (const file of files) {
          const url = await uploadImage(file, token, uploadType);
          currentImages.push(url);
        }
        onChange(currentImages);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = null;
    }
  };

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept="image/*,.png,.jpg,.jpeg" multiple={!single} onChange={handleFileChange} className="hidden" />
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || images.length >= max}
        >
          {isUploading ? "Uploading..." : `Upload ${single ? "Image" : "Images"}`}
        </Button>
        <div className="text-sm text-muted-foreground">{images.length}/{max}</div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      
      <div className="grid grid-cols-3 gap-2 mt-2 p-2 border rounded-lg bg-slate-50 max-h-48 overflow-y-auto min-h-[6rem]">
        {images.length === 0 && <div className="col-span-3 text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg text-center">No images uploaded.</div>}
        {images.map((url, i) => (
          <div key={i} className="relative rounded overflow-hidden border">
            <img src={url} alt={`upload-${i}`} className="w-full h-24 object-cover" />
            <button type="button" aria-label="remove" className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-xs" onClick={() => onChange(images.filter((_, idx) => idx !== i))}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}