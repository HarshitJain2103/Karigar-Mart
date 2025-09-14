import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Star,
  Plus,
  Heart,
  Minus,
  Share2,
  Copy,
  Check,
  Shield,
  Truck,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import RelatedProducts from '@/components/ui/products/RelatedProducts';
import useAuthStore from '@/stores/authStore';
import useCartStore from '@/stores/cartStore';

function StaticRating({ rating, reviews = 0 }) {
  const displayRating = rating !== undefined ? rating : 0;
  const rounded = Math.round(displayRating);
  return (
    <div className="flex items-center gap-2" aria-label={`Rating: ${displayRating} out of 5`}>
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 transition-colors ${i < rounded ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            aria-hidden="true"
          />
        ))}
      </div>
      {reviews > 0 && (
        <span className="text-sm text-muted-foreground" aria-label={`${reviews} reviews`}>
          ({reviews} reviews)
        </span>
      )}
      <span className="sr-only">{displayRating} out of 5 stars</span>
    </div>
  );
}

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-gray-200/70 ${className}`} />;
}

function ProductSkeleton() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-sm breadcrumbs mb-4">
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-4 sticky top-24">
            <SkeletonBlock className="aspect-square w-full shadow-lg" />
            <div className="grid grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <SkeletonBlock key={i} className="aspect-square w-full" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <SkeletonBlock className="h-8 w-3/4" />
              <SkeletonBlock className="h-4 w-1/3" />
              <SkeletonBlock className="h-5 w-40" />
            </div>
            <SkeletonBlock className="h-8 w-24" />
            <SkeletonBlock className="h-24 w-full" />
            <Separator />
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-10 w-40" />
              <SkeletonBlock className="h-10 w-24" />
            </div>
            <div className="flex gap-4">
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[...Array(3)].map((_, i) => (
                <SkeletonBlock key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = useAuthStore((state) => state.token);
  const wishlist = useAuthStore((state) => state.wishlist);
  const toggleWishlist = useAuthStore((state) => state.toggleWishlist);
  const addToCart = useCartStore((state) => state.addToCart);

  // Check if the current product is in the global wishlist
  const isWishlisted = useMemo(() => 
    wishlist.some(item => item._id === productId), 
    [wishlist, productId]
  );

  const handleToggleWishlist = () => {
    if (!token) return alert('Please log in to manage your wishlist.');
    toggleWishlist(productId);
  };

  const handleAddToCart = () => {
    if (!token) return alert('Please log in to add items to your cart.');
    if (!product) return;
    addToCart(product, quantity);
  };

  const canDecrease = quantity > 1;
  const canIncrease = useMemo(
    () => (product?.stockQuantity ? quantity < product.stockQuantity : true),
    [product?.stockQuantity, quantity]
  );
  const canAddToCart = (product?.stockQuantity ?? 0) > 0;

  const productUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/product/${productId}`;
  }, [productId]);

  const nextImage = useCallback(() => {
    if (!product?.imageURLs?.length) return;
    setActiveImageIndex((i) => (i + 1) % product.imageURLs.length);
  }, [product?.imageURLs]);

  const prevImage = useCallback(() => {
    if (!product?.imageURLs?.length) return;
    setActiveImageIndex((i) => (i - 1 + product.imageURLs.length) % product.imageURLs.length);
  }, [product?.imageURLs]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nextImage, prevImage]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`http://localhost:8000/api/products/${productId}`);
        if (!response.ok) throw new Error('Product not found.');
        const data = await response.json();
        setProduct(data);
        setActiveImageIndex(0);
      } catch (err) {
        setError(err.message || 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProductData();
  }, [productId]);

  const onShare = async () => {
    try {
      setSharing(true);
      if (navigator.share) {
        await navigator.share({
          title: product?.title ?? 'Product',
          text: 'Check this out',
          url: productUrl
        });
      } else {
        await navigator.clipboard.writeText(productUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
    } finally {
      setSharing(false);
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    navigate(`/checkout?productId=${product._id}&qty=${quantity}`);
  };

  if (loading) return <ProductSkeleton />;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="text-center text-red-600 font-medium">Error: {error}</p>
        <Link to="/shop">
          <Button variant="outline">Back to Shop</Button>
        </Link>
      </div>
    );
  if (!product) return <div className="text-center py-20">Product not found.</div>;

  const images = product.imageURLs ?? [];
  const showThumbs = images.length > 1;

  const categoryId = product.categoryId?._id;
  const categoryName = product.categoryId?.name ?? 'Category';
  const artisanId = product.artisanId?._id;
  const artisanName = product.artisanId?.storeName ?? 'Artisan';

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-sm breadcrumbs mb-4">
          <ul className="flex items-center gap-2 text-muted-foreground">
            <li>
              <Link to="/" className="hover:underline">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link to="/shop" className="hover:underline">Shop</Link>
            </li>
            {categoryId && (
              <>
                <li>/</li>
                <li>
                  <Link to={`/shop?category=${categoryId}`} className="hover:underline">
                    {categoryName}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-4 lg:sticky top-24">
            <div className="aspect-square w-full bg-gray-100 rounded-xl overflow-hidden relative shadow-lg group">
              {images[activeImageIndex] ? (
                <>
                  <img
                    src={images[activeImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] will-change-transform"
                    draggable={false}
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-4 right-4 rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleToggleWishlist}
                    aria-label="Add to Wishlist"
                  >
                    <Heart className={`h-5 w-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  </Button>
                  {showThumbs && (
                    <>
                      <Button
                        onClick={prevImage}
                        size="icon"
                        variant="secondary"
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-md"
                        aria-label="Previous image"
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        onClick={nextImage}
                        size="icon"
                        variant="secondary"
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-md"
                        aria-label="Next image"
                      >
                        <ChevronRight />
                      </Button>
                    </>
                  )}
                  {showThumbs && (
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/60 text-white text-xs px-2 py-1">
                      {activeImageIndex + 1} / {images.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
            </div>

            {showThumbs && (
              <>
                <div className="grid grid-cols-5 gap-2 sm:hidden">
                  {images.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${index === activeImageIndex ? 'border-primary' : 'border-transparent hover:border-gray-300'}`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className="hidden sm:grid grid-cols-6 gap-2">
                  {images.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${index === activeImageIndex ? 'border-primary' : 'border-transparent hover:border-gray-300'}`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {(product.discountPercentage ?? 0) > 0 && (
                  <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 text-xs font-semibold px-3 py-1">
                    Save {product.discountPercentage}%
                  </span>
                )}
                {product.stockQuantity === 0 && (
                  <span className="inline-flex items-center rounded-full bg-red-50 text-red-600 text-xs font-semibold px-3 py-1">
                    Out of stock
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                {product.title}
              </h1>

              <p className="text-md text-muted-foreground">
                by{' '}
                {artisanId ? (
                  <Link to={`/store/${artisanId}`} className="text-primary hover:underline font-semibold">
                    {artisanName}
                  </Link>
                ) : (
                  <span className="font-medium">{artisanName}</span>
                )}
              </p>

              <div className="flex items-center gap-4 pt-1">
                <StaticRating rating={product.averageRating} reviews={product.reviewsCount ?? 0} />
                <button
                  onClick={onShare}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                {!navigator.share && (
                  <button
                    onClick={onCopy}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold">₹{product.price}</p>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-muted-foreground line-through">₹{product.compareAtPrice}</span>
              )}
            </div>

            {product.description && (
              <div className="prose text-gray-700 leading-relaxed">
                <p>{product.description}</p>
              </div>
            )}

            <Separator />

            <div className="flex flex-wrap items-center gap-4">
              <p className="font-medium">Quantity:</p>
              <div className="flex items-center border rounded-md">
                <Button variant="ghost" size="icon" onClick={() => canDecrease && setQuantity((q) => Math.max(1, q - 1))} disabled={!canDecrease} aria-label="Decrease quantity">
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-semibold" aria-live="polite">
                  {quantity}
                </span>
                <Button variant="ghost" size="icon" onClick={() => canIncrease && setQuantity((q) => q + 1)} disabled={!canIncrease} aria-label="Increase quantity">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{product.stockQuantity} in stock</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Button
                size="lg"
                className="w-full sm:flex-1 py-4"
                disabled={!canAddToCart}
                aria-disabled={!canAddToCart}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> {canAddToCart ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:flex-1 py-4"
                onClick={handleBuyNow}
              >
                {canAddToCart ? 'Buy Now' : 'Out of Stock'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Truck className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-semibold">Fast shipping</p>
                  <p className="text-muted-foreground">2–5 business days</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Shield className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-semibold">Secure checkout</p>
                  <p className="text-muted-foreground">SSL encrypted</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <RefreshCw className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-semibold">Easy returns</p>
                  <p className="text-muted-foreground">7-day return policy</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <details className="group border rounded-lg p-4">
                <summary className="cursor-pointer font-semibold list-none flex items-center justify-between">
                  Product details
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                    <ChevronDownIcon />
                  </span>
                </summary>
                <div className="mt-3 text-sm text-gray-700 leading-relaxed">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Handcrafted by {artisanName}</li>
                    <li>Category: {categoryName}</li>
                    <li>Ships from: India</li>
                  </ul>
                </div>
              </details>
              <details className="group border rounded-lg p-4">
                <summary className="cursor-pointer font-semibold list-none flex items-center justify-between">
                  Shipping & returns
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                    <ChevronDownIcon />
                  </span>
                </summary>
                <div className="mt-3 text-sm text-gray-700 leading-relaxed">
                  Enjoy fast shipping and hassle-free returns within 7 days of delivery.
                </div>
              </details>
              <details className="group border rounded-lg p-4">
                <summary className="cursor-pointer font-semibold list-none flex items-center justify-between">
                  Care instructions
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                    <ChevronDownIcon />
                  </span>
                </summary>
                <div className="mt-3 text-sm text-gray-700 leading-relaxed">
                  Keep in a cool, dry place. Clean gently with a soft cloth.
                </div>
              </details>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <RelatedProducts currentProductId={product._id} categoryId={categoryId} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-t p-3 sm:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Button size="lg" className="flex-1" disabled={!canAddToCart}>
            <ShoppingCart className="mr-2 h-5 w-5" /> {canAddToCart ? 'Add to Cart' : 'Out of Stock'}
          </Button>
          <Button size="lg" variant="outline" onClick={handleBuyNow}>
            {canAddToCart ? 'Buy Now' : 'Out of Stock'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}