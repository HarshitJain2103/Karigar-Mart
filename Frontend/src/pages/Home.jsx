import React, { useMemo, useState } from "react";
import HeroSection from "../components/ui/sections/HeroSection";
import CategoryList from "../components/ui/sections/CategoryList";
import ProductGrid from "../components/ui/sections/ProductGrid";
import ArtisanSpotlight from "../components/ui/sections/ArtisanSpotlight";
import StoryHighlights from "../components/ui/sections/StoryHighlights";
import Newsletter from "../components/ui/sections/NewsLetter";
import { CATEGORIES, HERO_SLIDES, MOCK_PRODUCTS, RECOMMENDED, ARTISANS, STORIES } from "../lib/mockData";
import useAutoCarousel from "../hooks/useAutoCarousel";

export default function Home({ onAddToCart }) {
  const { index, setIndex } = useAutoCarousel(HERO_SLIDES.length, 6000);
  const recommended = useMemo(() => RECOMMENDED, []);

  return (
    <>
      <HeroSection slides={HERO_SLIDES} index={index} setIndex={setIndex} />
      <CategoryList categories={CATEGORIES} />

      <ProductGrid
        title="Featured Products"
        subtitle="Handpicked for you"
        link="See all products"
        products={MOCK_PRODUCTS}
        onAddToCart={onAddToCart}
      />

      <ProductGrid
        title="Recommended for You"
        subtitle="Based on your activity"
        products={recommended}
        onAddToCart={onAddToCart}
      />

      <ArtisanSpotlight artisans={ARTISANS} />
      <StoryHighlights stories={STORIES} />
      <Newsletter />
    </>
  );
}
