import React, { useState, useEffect , useRef} from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage } from '@/lib/uploadService'; 
import useAuthStore from '@/stores/authStore'; 
import ImageUploader from '../ui-elements/ImageUploader';

export default function ProductDialog({ open, onOpenChange, product, onSave }) {
  const [formData, setFormData] = useState({});
  const [categories, setCategories] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    setFormData(product || { title: '', description: '', price: '', inventory: '', categoryId: '', imageURLs: [] });
  }, [product]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch('http://localhost:8000/api/categories');
      const data = await response.json();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  const handleSelectChange = (value) => {
    setFormData({ ...formData, categoryId: value });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => uploadImage(file, token, 'products'));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        imageURLs: [...(prev.imageURLs || []), ...uploadedUrls]
      }));

    } catch (error) {
      alert("Image upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = (urlToDelete) => {
    setFormData(prev => ({
      ...prev,
      imageURLs: prev.imageURLs.filter(url => url !== urlToDelete)
    }));
  };

  const handleSave = () => {
    if (formData.imageURLs.length === 0) {
      return alert('Each product must have at least one image.');
    }
    onSave(formData);
  };

  const inputRef = useRef(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formData?._id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label htmlFor="title">Product title</Label>
            <Input id="title" value={formData.title || ''} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description || ''} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.categoryId || ""} onValueChange={handleSelectChange}>
              <SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1"><Label htmlFor="price">Price (₹)</Label><Input id="price" type="number" value={formData.price || ''} onChange={handleChange} /></div>
            <div className="space-y-1"><Label htmlFor="inventory">Inventory</Label><Input id="inventory" type="number" value={formData.inventory || ''} onChange={handleChange} /></div>
          </div>

          {/* IMAGE SECTION --- */}
          <div>
            <Label className="text-base font-medium">Product Images</Label>
            <ImageUploader 
                images={formData.imageURLs || []}
                onChange={(urls) => setFormData(prev => ({...prev, imageURLs: urls}))}
                uploadType="products"
                max={8} // The limit is now enforced here
            />
            <input type="file" multiple accept="image/*" ref={inputRef} onChange={handleImageUpload} className="hidden" />
            <Button variant="outline" type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
              {isUploading ? 'Uploading...' : '+ Add Images'}
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Product</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}