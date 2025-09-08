import React, { useEffect, useRef, useState } from "react";
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
export default function App() {
  const [cartCount, setCartCount] = useState(0);
  const { query, setQuery, lang, setLang, startVoiceSearch } = useVoiceSearch();
  const recognitionRef = useRef(null); 
  const fetchUserProfile = useAuthStore((state) => state.fetchUserProfile);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        cartCount={cartCount}
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
            element={<Home onAddToCart={() => setCartCount((c) => c + 1)} />}
          />
          <Route path="/build-store" element={<BuildYourStoreFull />} />
          <Route element={<PrivateRoute allowedRoles={['ARTISAN']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          <Route path="/store/:artisanId" element={<ArtisanStorePage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
