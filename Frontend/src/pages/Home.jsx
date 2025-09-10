import React, { useState, useEffect, useMemo } from "react";
import useAutoCarousel from "@/hooks/useAutoCarousel"; 
import HeroSection from "@/components/ui/sections/HeroSection";
import CategoryList from "@/components/ui/sections/CategoryList";
import ProductGrid from "@/components/ui/sections/ProductGrid";
import ArtisanSpotlight from "@/components/ui/sections/ArtisanSpotlight";
import StoryHighlights from "@/components/ui/sections/StoryHighlights";
import Newsletter from "@/components/ui/sections/Newsletter";

// We can define the static hero slides here, or fetch them if they become dynamic later
const HERO_SLIDES = [
  {
    title: "Meet the Masters: Featured Artisans",
    subtitle: "Handcrafted pieces with centuries-old traditions.",
    img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000&auto=format&fit=crop",
  },
  {
    title: "Festive Specials",
    subtitle: "Seasonal discounts across India’s craft clusters.",
    img: "https://images.unsplash.com/photo-1516387938699-a93567ec168e?q=80&w=2000&auto=format&fit=crop",
  },
];


export default function Home({ onAddToCart }) {
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { index, setIndex } = useAutoCarousel(HERO_SLIDES.length, 6000);

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const [categoriesRes, productsRes, artisansRes] = await Promise.all([
          fetch('http://localhost:8000/api/categories'),
          fetch('http://localhost:8000/api/products'),
          fetch('http://localhost:8000/api/artisans')
        ]);

        if (!categoriesRes.ok || !productsRes.ok || !artisansRes.ok) {
          throw new Error('Failed to fetch essential homepage data');
        }

        const categoriesData = await categoriesRes.json();
        const productsData = await productsRes.json();
        const artisansData = await artisansRes.json();

        setCategories(categoriesData);
        setProducts(productsData);
        setArtisans(artisansData);

      } catch (err) {
        console.error("Homepage fetch error:", err);
        setError("Could not load content. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();
  }, []); 

  const stories = useMemo(() => {
    return artisans.slice(0, 3).map(artisanProfile => ({
      _id: artisanProfile._id, // Use the profile ID as a temporary unique key
      title: `A Story from ${artisanProfile.storeName}`,
      imageURL: artisanProfile.media.heroImageURL,
      excerpt: artisanProfile.story.slice(0, 120) + '...',
      // This is the crucial fix: we create the nested object the other component expects
      artisanId: { 
        _id: artisanProfile._id,
        storeName: artisanProfile.storeName,
        // Add other details if needed
      } 
    }));
  }, [artisans]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading amazing crafts...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <>
      <HeroSection slides={HERO_SLIDES} index={index} setIndex={setIndex} />
      <CategoryList categories={categories} />
      <ProductGrid
        title="Featured Products"
        products={products.slice(0, 8)} 
        onAddToCart={onAddToCart}
      />
      <ArtisanSpotlight artisans={artisans.slice(0, 2)} /> 
      <StoryHighlights stories={stories} />
      <Newsletter />
    </>
  );
}