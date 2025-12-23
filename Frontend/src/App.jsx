import React, { useEffect, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Footer from "./components/ui/sections/Footer";
import Header from "./components/ui/sections/Header";
import useVoiceSearch from "./hooks/useVoiceSearch";
import BuildYourStoreFull from "./pages/BuildYourStore";
import Home from "./pages/Home";
import useAuthStore from "./stores/authStore";
import PrivateRoute from './components/ui/auth/PrivateRoute';
import Dashboard from "@/pages/Dashboard";
import ArtisanStorePage from "./pages/ArtisanStorePage";
import AllArtisansPage from "./pages/AllArtisansPage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from '@/pages/ProductDetailPage';
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import useCartStore from "./stores/cartStore";
import { Toaster } from "@/components/ui/toaster";
import WishlistPage from './pages/WishlistPage';
import CartPage from './pages/CartPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ContactPage from "./pages/ContactPage";
import AuthCallbackPage from './pages/AuthCallbackPage';
import StoriesPage from './pages/StoriesPage';
import StoryDetailPage from './pages/StoryDetailPage';
import ArtisanStoryManager from './pages/ArtisanStoryManager';
import StoryEditor from './pages/StoryEditor';
import CheckoutCartPage from './pages/CheckoutCartPage';
import ProfilePage from "./pages/ProfilePage";
import { getApiUrl } from "@/lib/api";
import ReelsPage from "./pages/ReelsPage";

export default function App() {
  const { query, setQuery, lang, setLang, startVoiceSearch, isListening } = useVoiceSearch();
  const recognitionRef = useRef(null);
  const token = useAuthStore((state) => state.token);
  const fetchUserProfile = useAuthStore((state) => state.fetchUserProfile);
  const setWishlist = useAuthStore((state) => state.setWishlist);
  const setCart = useCartStore((state) => state.setCart);

  useEffect(() => {
    const fetchInitialData = async () => {
      const user = await fetchUserProfile();
      if (!user) return;

      const headers = { Authorization: `Bearer ${token}` };
      const wishlistPromise = fetch(getApiUrl('/api/users/profile/wishlist'), { headers })
        .then(async res => res.ok ? await res.json() : [])
        .catch(() => []);
      const cartPromise = fetch(getApiUrl('/api/users/profile/cart'), { headers })
        .then(async res => res.ok ? await res.json() : [])
        .catch(() => []);

      const [wishlistData, cartData] = await Promise.all([wishlistPromise, cartPromise]);

      setWishlist(wishlistData);
      setCart(cartData);
    };

    if (token) {
      fetchInitialData();
    }
  }, [token, fetchUserProfile, setWishlist, setCart]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        query={query}
        setQuery={setQuery}
        lang={lang}
        setLang={setLang}
        startVoiceSearch={startVoiceSearch}
        isListening={isListening}
      />

      <main>
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/build-store" element={<BuildYourStoreFull />} />
          <Route path="/store/:artisanId" element={<ArtisanStorePage />} />
          <Route path="/artisans" element={<AllArtisansPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/stories/:storyId" element={<StoryDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/reels" element={<ReelsPage />} />

          {/* --- CUSTOMER & ARTISAN PROTECTED ROUTES --- */}
          <Route element={<PrivateRoute allowedRoles={['CUSTOMER', 'ARTISAN']} />}>
            <Route path="/orders" element={<MyOrdersPage />} />
            <Route path="/checkout-cart" element={<CheckoutCartPage />} />
          </Route>

          {/* --- ARTISAN ONLY PROTECTED ROUTES (All in one place) --- */}
          <Route element={<PrivateRoute allowedRoles={['ARTISAN']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/stories" element={<ArtisanStoryManager />} />
            <Route path="/dashboard/stories/new" element={<StoryEditor />} />
            <Route path="/dashboard/stories/edit/:storyId" element={<StoryEditor />} />
          </Route>
        </Routes>
      </main>

      {location.pathname != '/reels' && <Footer />}
      <Toaster />
    </div>
  );
}
