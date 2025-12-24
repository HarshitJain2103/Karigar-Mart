import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Play, Video, RotateCw, Loader } from 'lucide-react';
import Rating from '../ui-elements/Rating'; 
import useAuthStore from '@/stores/authStore';
import useCartStore from '@/stores/cartStore';
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from '@/lib/api';
import { useTranslation } from "@/hooks/useTranslation";

export default function ProductCard({ product }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const token = useAuthStore((state) => state.token);
  const wishlist = useAuthStore((state) => state.wishlist);
  const toggleWishlist = useAuthStore((state) => state.toggleWishlist);
  const cartItems = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);

  const [showVideo, setShowVideo] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const isWishlisted = useMemo(
    () => wishlist.some(item => item._id === product._id),
    [wishlist, product._id]
  );

  const hasVideo = !!product.marketingVideo?.url;
  const isGenerating = product.videoStatus === 'generating';

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return alert(t('productCard.loginWishlist'));
    toggleWishlist(product._id);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return alert(t('productCard.loginCart'));

    const isAlreadyInCart = cartItems.some(item => item.product._id === product._id);

    if (isAlreadyInCart) {
      toast({
        title: t('productCard.alreadyInCart'),
        description: t('productCard.alreadyInCartDesc', { title: product.title }),
      });
    } else {
      addToCart(product, 1);
      toast({
        title: t('productCard.addedToCart'),
        description: t('productCard.addedToCartDesc', { title: product.title }),
      });
    }
  };

  const handleRegenerateVideo = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) return alert(t('productCard.loginRegenerate'));

    if (!confirm(t('productCard.confirmRegenerate'))) return;

    setRegenerating(true);
    try {
      const response = await fetch(getApiUrl(`/api/products/${product._id}/regenerate-video`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t('productCard.regenStarted'),
          description: t('productCard.regenCheckBack'),
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: t('productCard.regenFailed'),
        description: error.message || t('productCard.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Card className="overflow-hidden group transition-shadow duration-300 shadow-lg hover:shadow-xl">
      <div className="relative">
        <Link to={`/products/${product._id}`}>
          <div className="aspect-square w-full overflow-hidden bg-gray-100">

            {showVideo && hasVideo ? (
              <video
                src={product.marketingVideo.url}
                controls
                autoPlay
                loop
                muted
                className="w-full h-full object-cover"
                onEnded={() => setShowVideo(false)}
              />
            ) : (
              <img
                src={product.imageURLs[0]}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}

          </div>
        </Link>

        <div className="absolute top-2 right-2 flex gap-2">
          {isGenerating && (
            <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-[10px] flex items-center gap-1 shadow-lg">
              <Loader className="w-3 h-3 animate-spin" />
              {t('productCard.generating')}
            </div>
          )}

          {hasVideo && !showVideo && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowVideo(true); }}
              className="bg-black/80 hover:bg-black text-white p-2 rounded-full transition-all shadow-lg hover:scale-110"
              title={t('productCard.playVideo')}
            >
              <Play className="w-4 h-4 fill-white" />
            </button>
          )}

          {hasVideo && showVideo && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowVideo(false); }}
              className="bg-black/80 hover:bg-black text-white px-2 py-1 rounded-full text-[10px] shadow-lg"
            >
              {t('productCard.showImage')}
            </button>
          )}
        </div>

        {hasVideo && (
          <div className="absolute bottom-2 left-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded-full text-[10px] flex items-center gap-1 shadow-lg">
            <Video className="w-3 h-3" />
            {t('productCard.marketingReel')}
          </div>
        )}

        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 left-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
          aria-label={t('productCard.toggleWishlist')}
          onClick={handleToggleWishlist}
        >
          <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </Button>
      </div>

      <CardContent className="p-4 space-y-2">
        <p className="text-sm text-muted-foreground truncate">
          {product.artisanId?.storeName || t('productCard.defaultStoreName')}
        </p>

        <h3 className="font-semibold text-lg truncate">{product.title}</h3>

        <div className="flex justify-between items-center">
          <span className="font-bold text-xl">₹{product.price}</span>
          <Rating value={product.averageRating || 0} />
        </div>

        {token && !isGenerating && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateVideo}
            disabled={regenerating}
            className="w-full text-xs mt-2"
          >
            {regenerating ? (
              <>
                <Loader className="w-3 h-3 mr-1 animate-spin" />
                {t('productCard.regenerating')}
              </>
            ) : hasVideo ? (
              <>
                <RotateCw className="w-3 h-3 mr-1" />
                {t('productCard.newVideo')}
              </>
            ) : (
              <>
                <Video className="w-3 h-3 mr-1" />
                {t('productCard.generateVideo')}
              </>
            )}
          </Button>
        )}

        <Button className="w-full mt-2" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {t('productCard.addToCart')}
        </Button>
      </CardContent>
    </Card>
  );
}