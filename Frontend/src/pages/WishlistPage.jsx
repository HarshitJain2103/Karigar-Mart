import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import ProductGrid from '@/components/ui/sections/ProductGrid';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check, Filter, ArrowUpDown, Heart } from 'lucide-react';

export default function WishlistPage() {
  const wishlistItems = useAuthStore((state) => state.wishlist);

  const [filter, setFilter] = useState('all'); // all | in_stock | out_of_stock
  const [sort, setSort] = useState('featured'); // featured | price_low | price_high | rating_high | newest
  const [copied, setCopied] = useState(false);

  const totalItems = wishlistItems?.length || 0;

  const processedItems = useMemo(() => {
    if (!Array.isArray(wishlistItems)) return [];

    let list = [...wishlistItems];

    // Filter
    if (filter === 'in_stock') {
      list = list.filter((p) => (typeof p?.stockQuantity === 'number' ? p.stockQuantity > 0 : true));
    } else if (filter === 'out_of_stock') {
      list = list.filter((p) => (typeof p?.stockQuantity === 'number' ? p.stockQuantity <= 0 : false));
    }

    // Sort
    switch (sort) {
      case 'price_low':
        list.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
        break;
      case 'price_high':
        list.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
        break;
      case 'rating_high':
        list.sort((a, b) => Number(b?.averageRating || 0) - Number(a?.averageRating || 0));
        break;
      case 'newest':
        list.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
        break;
      default:
        break;
    }

    return list;
  }, [wishlistItems, filter, sort]);

  async function handleShare() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/wishlist` : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Wishlist', text: 'Check out my wishlist!', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }
    } catch {
      // ignore
    }
  }

  if (!totalItems) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
          <p className="text-muted-foreground">Your collection of saved treasures.</p>
        </div>
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
            <Heart className="h-6 w-6 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold">Your Wishlist is Empty</h2>
          <p className="text-muted-foreground mt-2">Looks like you haven&apos;t added any items yet.</p>
          <Link to="/shop">
            <Button className="mt-6">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
        <p className="text-muted-foreground">Your collection of saved treasures.</p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
          <div className="hidden sm:block text-sm text-muted-foreground">
            {filter === 'all' && 'Showing all saved items'}
            {filter === 'in_stock' && 'Showing in-stock only'}
            {filter === 'out_of_stock' && 'Showing out-of-stock only'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter */}
          <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              aria-label="Filter wishlist"
              className="bg-transparent text-sm outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="in_stock">In stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              aria-label="Sort wishlist"
              className="bg-transparent text-sm outline-none"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating_high">Rating: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          <Button variant="outline" className="gap-2" onClick={handleShare}>
            {navigator.share ? <Share2 className="h-4 w-4" /> : copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {navigator.share ? 'Share' : copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      </div>

      <ProductGrid products={processedItems} />
    </div>
  );
}