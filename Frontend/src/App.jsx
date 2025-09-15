import React, { useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
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

export default function App() {
  const { query, setQuery, lang, setLang, startVoiceSearch } = useVoiceSearch();
  const recognitionRef = useRef(null); 
  const token = useAuthStore((state) => state.token);
  const fetchUserProfile = useAuthStore((state) => state.fetchUserProfile);
  const setWishlist = useAuthStore((state) => state.setWishlist);
  const setCart = useCartStore((state) => state.setCart);

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchUserProfile();
      const headers = { Authorization: `Bearer ${token}` };
      const wishlistPromise = fetch('http://localhost:8000/api/users/profile/wishlist', { headers }).then(res => res.json());
      const cartPromise = fetch('http://localhost:8000/api/users/profile/cart', { headers }).then(res => res.json());
      
      const [wishlistData, cartData] = await Promise.all([wishlistPromise, cartPromise]);
      
      if (wishlistData) setWishlist(wishlistData);
      if (cartData) setCart(cartData);
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
      />

      <main>
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />
          <Route path="/build-store" element={<BuildYourStoreFull />} />
          <Route element={<PrivateRoute allowedRoles={['ARTISAN']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          <Route path="/store/:artisanId" element={<ArtisanStorePage />} />
          <Route path="/artisans" element={<AllArtisansPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
        </Routes>
      </main>

      <Footer />
      <Toaster />
    </div>
  );
}
