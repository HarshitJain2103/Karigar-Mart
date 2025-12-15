import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, MessageCircle, ShoppingCart, ChevronDown, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useAuthStore from '@/stores/authStore';
import useCartStore from '@/stores/cartStore';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

export default function ReelCard({ reel, isActive, autoPlay = true }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const videoRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [liked, setLiked] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const addToCart = useCartStore((state) => state.addToCart);

    const productTitle = reel.title || t('reelCard.untitledProduct');
    const artisanName = reel.artisanId?.storeName || t('reelCard.artisan');
    const artisanId = reel.artisanId?._id;
    const videoUrl = reel.marketingVideo?.url || reel.marketingVideo?.videoUrlWithAudio;
    const productDescription = reel.description || '';
    const price = reel.price || 0;
    const stockQuantity = reel.stockQuantity || 0;
    const inStock = stockQuantity > 0;

    const artisanAvatar = reel.artisanId?.userId?.avatar;
    const artisanInitials = `${reel.artisanId?.userId?.firstName?.[0] || 'A'}${reel.artisanId?.userId?.lastName?.[0] || ''}`;

    const descriptionPreview = productDescription.length > 40
        ? productDescription.slice(0, 40) + '...'
        : productDescription;

    // Video control
    useEffect(() => {
        if (!videoRef.current) return;

        if (isActive && autoPlay) {
            videoRef.current.play().catch((err) => {
                console.error('Video play error:', err);
            });
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive, autoPlay]);

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const handleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/products/${reel._id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: productTitle,
                    text: t('reelCard.shareText', { title: productTitle }),
                    url,
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            await navigator.clipboard.writeText(url);
            toast({
                title: t('reelCard.copied'),
                description: t('reelCard.linkCopied'),
            });
        }
    };

    const handleAddToCart = () => {
        if (!token) {
            toast({
                title: t('reelCard.signInRequired'),
                description: t('reelCard.loginToAdd'),
                variant: 'destructive',
            });
            return;
        }

        addToCart({
            _id: reel._id,
            title: productTitle,
            price,
            imageURLs: reel.imageURLs,
            stockQuantity,
        }, quantity);

        toast({
            title: t('reelCard.addedToCart'),
            description: t('reelCard.addedDesc', { qty: quantity, title: productTitle }),
        });
        setQuantity(1);
        setShowCheckoutModal(false);
    };

    const handleBuyNow = () => {
        if (!token) {
            toast({
                title: t('reelCard.signInRequired'),
                description: t('reelCard.loginToCheckout'),
                variant: 'destructive',
            });
            return;
        }

        navigate(`/checkout?productId=${reel._id}&qty=${quantity}`);
    };

    if (!videoUrl) {
        return (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <p className="text-gray-400">{t('reelCard.videoUnavailable')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-black overflow-hidden group">
            {/* Video - Full screen */}
            <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                loop
                muted={isMuted}
                onClick={handlePlayPause}
                crossOrigin="anonymous"
            />

            {/* Play overlay */}
            {!isPlaying && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition cursor-pointer z-5"
                    onClick={handlePlayPause}
                >
                    <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                        <div className="w-0 h-0 border-l-8 border-l-white border-t-5 border-t-transparent border-b-5 border-b-transparent ml-1" />
                    </div>
                </div>
            )}

            {/* Top gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

            {/* Top Left: Product Title and Price */}
            <div className="absolute top-4 left-4 z-30 max-w-xs">
                <Link to={`/products/${reel._id}`} className="block group/link">
                    <h2 className="text-xl font-bold group-hover/link:underline line-clamp-2 text-white">
                        {productTitle}
                    </h2>
                </Link>
                <p className="text-lg font-bold text-white mt-1">
                    ₹{price.toLocaleString('en-IN')}
                </p>
            </div>

            {/* Top Right: Close Button and Stock Info */}
            <div className="absolute top-4 right-4 z-30 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <p className="text-xs font-semibold text-white">
                    {inStock ? t('reelCard.inStock', { count: stockQuantity }) : t('reelCard.outOfStock')}
                </p>
            </div>

            {/* Right side: Action buttons (Like, Comment, Share, Mute) */}
            <div className="absolute right-4 bottom-44 translate-y-0 z-30 flex flex-col gap-2">
                {/* Like button */}
                <button
                    onClick={() => setLiked(!liked)}
                    className="flex flex-col items-center gap-1 text-white hover:opacity-80 transition group/btn"
                >
                    <div
                        className={`p-3 rounded-full backdrop-blur-sm transition transform hover:scale-110 ${liked
                            ? 'bg-red-500 scale-110'
                            : 'bg-white/20 group-hover/btn:bg-white/40'
                            }`}
                    >
                        <Heart className={`w-5 h-5 ${liked ? 'fill-white' : ''}`} />
                    </div>
                    <span className="text-xs font-semibold">{liked ? t('reelCard.likeCount.one') : t('reelCard.likeCount.zero')}</span>
                </button>

                {/* Comment button */}
                <button className="flex flex-col items-center gap-1 text-white hover:opacity-80 transition group/btn">
                    <div className="p-3 rounded-full bg-white/20 group-hover/btn:bg-white/40 backdrop-blur-sm transform hover:scale-110 transition">
                        <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold">{t('reelCard.commentCount')}</span>
                </button>

                {/* Share button */}
                <button
                    onClick={handleShare}
                    className="flex flex-col items-center gap-1 text-white hover:opacity-80 transition group/btn"
                >
                    <div className="p-3 rounded-full bg-white/20 group-hover/btn:bg-white/40 backdrop-blur-sm transform hover:scale-110 transition">
                        <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold">{t('reelCard.share')}</span>
                </button>

                {/* Mute button */}
                <button
                    onClick={handleMute}
                    className="flex flex-col items-center gap-1 text-white hover:opacity-80 transition group/btn"
                >
                    <div
                        className={`p-3 rounded-full backdrop-blur-sm transform hover:scale-110 transition ${isMuted ? "bg-white/20" : "bg-blue-500"
                            }`}
                    >
                        {isMuted ? (
                            <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                            <Volume2 className="w-5 h-5 text-white" />
                        )}
                    </div>

                    <span className="text-xs font-semibold">
                        {isMuted ? t('reelCard.muted') : t('reelCard.audio')}
                    </span>
                </button>

            </div>

            {/* Bottom: Artisan info, Description, and Buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                {/* Artisan info */}
                {artisanId && (
                    <Link
                        to={`/store/${artisanId}`}
                        className="flex items-center gap-2 mb-3 hover:opacity-80 transition group/artisan"
                    >
                        <Avatar className="w-9 h-9 border-2 border-white/30 group-hover/artisan:border-white/60">
                            <AvatarImage src={artisanAvatar} alt={artisanName} />
                            <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                {artisanInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs font-semibold text-white line-clamp-1">{artisanName}</p>
                            <p className="text-xs text-white/60">{t('reelCard.viewStore')}</p>
                        </div>
                    </Link>
                )}

                {/* Description - Instagram style */}
                <div
                    className="mb-3 bg-black/40 rounded p-2 backdrop-blur-sm max-h-24 overflow-y-auto"
                    style={{
                        scrollbarWidth: "thin",             // Firefox
                        scrollbarColor: "rgba(255,255,255,0.4) transparent"
                    }}
                >

                    {!showFullDescription ? (
                        <p className="text-xs text-white/90 leading-tight">
                            {productDescription.length > 40 ? (
                                <>
                                    {productDescription.slice(0, 40)}...
                                    <span
                                        onClick={() => setShowFullDescription(true)}
                                        className="text-white font-semibold ml-1 cursor-pointer"
                                    >
                                        {t('reelCard.more')}
                                    </span>
                                </>
                            ) : (
                                productDescription
                            )}
                        </p>
                    ) : (
                        <div>
                            <p className="text-xs text-white/90 leading-tight whitespace-pre-line">
                                {productDescription}
                            </p>

                            <span
                                onClick={() => setShowFullDescription(false)}
                                className="block text-white/70 text-xs mt-1 cursor-pointer"
                            >
                                {t('reelCard.showLess')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Bottom buttons - Full width */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCheckoutModal(true)}
                        disabled={!inStock}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2.5 rounded-lg transition text-sm"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {t('reelCard.addToCart')}
                    </button>
                    <button
                        onClick={handleBuyNow}
                        disabled={!inStock}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-2.5 rounded-lg transition text-sm"
                    >
                        {t('reelCard.buyNow')}
                    </button>
                </div>
            </div>

            {/* Checkout Modal */}
            {showCheckoutModal && (
                <div className="absolute inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm rounded-3xl">
                    <div className="w-full bg-gray-900 text-white rounded-t-3xl p-6 animate-in slide-in-from-bottom-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">{t('reelCard.selectQuantity')}</h3>
                            <button
                                onClick={() => setShowCheckoutModal(false)}
                                className="p-1 hover:bg-white/10 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <img
                                    src={reel.imageURLs?.[0]}
                                    alt={productTitle}
                                    className="w-16 h-16 rounded object-cover"
                                />
                                <div className="flex-1 mx-4">
                                    <p className="font-semibold text-sm">{productTitle}</p>
                                    <p className="text-green-400 font-bold">₹{price.toLocaleString('en-IN')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 border border-gray-700 rounded-lg p-2 w-fit">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="px-3 py-1 hover:bg-gray-700 rounded"
                                >
                                    −
                                </button>
                                <span className="px-4 font-semibold">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                                    className="px-3 py-1 hover:bg-gray-700 rounded"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowCheckoutModal(false)}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={handleAddToCart}
                            >
                                {t('reelCard.addAmount', {
                                    amount: (price * quantity).toLocaleString('en-IN'),
                                })}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}