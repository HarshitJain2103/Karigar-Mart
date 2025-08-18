import React, { useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Footer from "./components/ui/sections/Footer";
import Header from "./components/ui/sections/Header";
import useVoiceSearch from "./hooks/useVoiceSearch";
import BuildYourStoreFull from "./pages/BuildYourStore";
import Home from "./pages/Home";

// --- Main Component --- //
export default function App() {
  const [cartCount, setCartCount] = useState(0);
  const { query, setQuery, lang, setLang, startVoiceSearch } = useVoiceSearch();
  const recognitionRef = useRef(null);

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

      <Routes>
        <Route
          path="/"
          element={<Home onAddToCart={() => setCartCount((c) => c + 1)} />}
        />
        <Route path="/build-store" element={<BuildYourStoreFull />} />
      </Routes>

      <Footer />
    </div>
  );
}
