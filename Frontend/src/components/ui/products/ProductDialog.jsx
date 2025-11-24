import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage } from '@/lib/uploadService';
import useAuthStore from '@/stores/authStore';
import ImageUploader from '../ui-elements/ImageUploader';
import { Video, Sparkles, Wand2 } from 'lucide-react';

export default function ProductDialog({ open, onOpenChange, product, onSave }) {
  const [formData, setFormData] = useState({});
  const [categories, setCategories] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [videoOptions, setVideoOptions] = useState({
    generateVideo: true,
    generateDescription: false
  });

  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    setFormData(product || {
      title: '',
      description: '',
      price: '',
      inventory: '',
      categoryId: '',
      imageURLs: []
    });
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

    const productData = {
      ...formData,
      ...videoOptions
    };

    onSave(productData);
  };

  const inputRef = useRef(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formData?._id ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {formData?._id
              ? "Modify the details of your product below."
              : "Fill in product details to add it to your store."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label htmlFor="title">Product title</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={handleChange}
              placeholder="e.g., Handwoven Cotton Scarf"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <button
                type="button"
                onClick={() => setVideoOptions(prev => ({
                  ...prev,
                  generateDescription: !prev.generateDescription
                }))}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Wand2 className="w-3 h-3" />
                {videoOptions.generateDescription ? 'AI Enabled ✨' : 'Enable AI Description'}
              </button>
            </div>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder={videoOptions.generateDescription
                ? "AI will generate a description (or write your own)"
                : "Describe your product's features and craftsmanship"}
              rows={4}
            />
            {videoOptions.generateDescription && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI will create a compelling description based on your product details
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.categoryId || ""} onValueChange={handleSelectChange}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price || ''}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="inventory">Inventory</Label>
              <Input
                id="inventory"
                type="number"
                value={formData.inventory || ''}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>
          <div>
            <Label className="text-base font-medium">Product Images</Label>
            <ImageUploader
              images={formData.imageURLs || []}
              onChange={(urls) => setFormData(prev => ({ ...prev, imageURLs: urls }))}
              uploadType="products"
              max={8}
            />
            <input
              type="file"
              multiple
              accept="image/*"
              ref={inputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="mt-2"
            >
              {isUploading ? 'Uploading...' : '+ Add Images'}
            </Button>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="generateVideo"
                checked={videoOptions.generateVideo}
                onChange={(e) => setVideoOptions(prev => ({
                  ...prev,
                  generateVideo: e.target.checked
                }))}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label
                  htmlFor="generateVideo"
                  className="flex items-center gap-2 font-medium text-gray-900 cursor-pointer"
                >
                  <Video className="w-5 h-5 text-blue-600" />
                  Generate Marketing Video
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
                    AI POWERED
                  </span>
                </label>
                <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">
                  Automatically create a professional 8-second marketing reel
                  from your product image. Perfect for Instagram Reels & TikTok!
                  <span className="text-blue-700 font-medium block mt-1">
                    ⏱️ Takes 2-5 minutes to generate
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUploading || formData.imageURLs?.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? 'Uploading...' : 'Save Product'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}