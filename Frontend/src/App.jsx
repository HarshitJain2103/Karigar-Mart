import React, { useEffect, useMemo, useRef, useState } from "react";
import Footer from "./components/ui/sections/Footer";
import Header from "./components/ui/sections/Header";
import HeroSection from "./components/ui/sections/HeroSection";
import CategoryList from "./components/ui/sections/CategoryList";
import ProductGrid from "./components/ui/sections/ProductGrid";
import ArtisanSpotlight from "./components/ui/sections/ArtisanSpotlight";
import StoryHighlights from "./components/ui/sections/StoryHighlights";
import Newsletter from "./components/ui/sections/NewsLetter";
import useAutoCarousel from "./hooks/useAutoCarousel";
import { CATEGORIES, HERO_SLIDES, MOCK_PRODUCTS, RECOMMENDED, ARTISANS, STORIES } from "./lib/mockData";
import useVoiceSearch from './hooks/useVoiceSearch';

// --- Main Component --- //
export default function App() {
  const [cartCount, setCartCount] = useState(0);
  const { query, setQuery, lang, setLang, startVoiceSearch } = useVoiceSearch();
  const recognitionRef = useRef(null);
  const { index, setIndex } = useAutoCarousel(HERO_SLIDES.length, 6000);
  const recommended = useMemo(() => RECOMMENDED, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        cartCount={cartCount}
        query={query}
        setQuery={setQuery}
        lang={lang} // You might move lang to a store too!
        setLang={setLang}
        startVoiceSearch={startVoiceSearch}
      />
      <HeroSection slides={HERO_SLIDES} index={index} setIndex={setIndex} />
      <CategoryList categories={CATEGORIES} />
      <ProductGrid
        title="Featured Products"
        subtitle="Handpicked for you"
        link="See all products"
        products={MOCK_PRODUCTS}
        onAddToCart={() => setCartCount((c) => c + 1)}
      />
      {/* Recommended for You Section*/}
      <ProductGrid
        title="Recommended for You"
        subtitle="Based on your activity"
        products={recommended}
        onAddToCart={() => setCartCount((c) => c + 1)}
      />
      <ArtisanSpotlight artisans={ARTISANS} />
      <StoryHighlights stories={STORIES} />
      <Newsletter/>
      <Footer/>
    </div>
  );
}