import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import Rating from '../ui-elements/Rating'; 

export default function ProductCard({ product, onAddToCart }) {
  
  const handleAddToCartClick = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    if (onAddToCart) {
      onAddToCart();
    } else {
      alert('Added to cart! (Functionality to be connected)');
    }
  };

  return (
    <Card className="overflow-hidden group transition-shadow duration-300 hover:shadow-lg">
      <Link to={`/products/${product._id}`}>
        <div className="relative">
          <div className="aspect-square w-full overflow-hidden bg-gray-100">
            
            <img 
              src={product.imageURLs[0]} 
              alt={product.title} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Wishlist"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        <CardContent className="p-4 space-y-2">
          <p className="text-sm text-muted-foreground truncate">{product.artisanId?.storeName || 'Karigar Mart'}</p>
          <h3 className="font-semibold text-lg truncate">{product.title}</h3>
          <div className="flex justify-between items-center">
            <span className="font-bold text-xl">₹{product.price}</span>
            <Rating value={product.averageRating || 0} />
          </div>
          <Button className="w-full mt-2" onClick={handleAddToCartClick}>
            Add to Cart
          </Button>
        </CardContent>
      </Link>
    </Card>
  );
}