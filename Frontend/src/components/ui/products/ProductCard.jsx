import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart } from 'lucide-react';
import Rating from '../ui-elements/Rating'; 
import useAuthStore from '@/stores/authStore';
import useCartStore from '@/stores/cartStore';
import { useToast } from "@/hooks/use-toast";

export default function ProductCard({ product }) {
  const { toast } = useToast();
  const token = useAuthStore((state) => state.token);
  const wishlist = useAuthStore((state) => state.wishlist);
  const toggleWishlist = useAuthStore((state) => state.toggleWishlist);
  const cartItems = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const isWishlisted = useMemo(() => 
    wishlist.some(item => item._id === product._id), 
    [wishlist, product._id]
  );

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return alert('Please log in to manage your wishlist.');
    toggleWishlist(product._id);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return alert('Please log in to add items to your cart.');
    
    const isAlreadyInCart = cartItems.some(item => item.product._id === product._id);

    if (isAlreadyInCart) {
      toast({
        title: "Already in Cart",
        description: `"${product.title}" is already in your cart.`,
        variant: "default",
      });
    } else {
      addToCart(product, 1);
      toast({
        title: "Added to Cart!",
        description: `"${product.title}" has been added to your cart.`,
      });
    }
  };

  return (
    <Card className="overflow-hidden group transition-shadow duration-300 hover:shadow-lg">
      <div className="relative">
        <Link to={`/products/${product._id}`}>
          <div className="aspect-square w-full overflow-hidden bg-gray-100">
            <img 
              src={product.imageURLs[0]} 
              alt={product.title} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          aria-label="Toggle Wishlist"
          onClick={handleToggleWishlist}
        >
          <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </Button>
      </div>
      <CardContent className="p-4 space-y-2">
        <p className="text-sm text-muted-foreground truncate">{product.artisanId?.storeName || 'Karigar Mart'}</p>
        <h3 className="font-semibold text-lg truncate">{product.title}</h3>
        <div className="flex justify-between items-center">
          <span className="font-bold text-xl">₹{product.price}</span>
          <Rating value={product.averageRating || 0} />
        </div>
        <Button className="w-full mt-2" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}