// Frontend/src/lib/mockData.js

export const CATEGORIES = [
  { name: "Handloom & Textiles", img: "https://images.unsplash.com/photo-1610395219791-35a0b6f53fab?q=80&w=1200&auto=format&fit=crop" },
  { name: "Jewelry", img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop" },
  { name: "Pottery", img: "https://images.unsplash.com/photo-1473445197799-509c7a0877f6?q=80&w=1200&auto=format&fit=crop" },
  { name: "Woodcraft", img: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop" },
  { name: "Paintings", img: "https://images.unsplash.com/photo-1504198458649-3128b932f49b?q=80&w=1200&auto=format&fit=crop" },
  { name: "Metalwork", img: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop" },
  { name: "Leather Goods", img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop" },
  { name: "Others", img: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1200&auto=format&fit=crop" },
];

export const HERO_SLIDES = [
  {
    title: "Meet the Masters: Featured Artisans",
    subtitle: "Handcrafted pieces with centuries-old traditions.",
    img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000&auto=format&fit=crop",
    cta1: "Shop Now",
    cta2: "Discover Artisans",
  },
  {
    title: "Festive Specials",
    subtitle: "Seasonal discounts across India’s craft clusters.",
    img: "https://images.unsplash.com/photo-1516387938699-a93567ec168e?q=80&w=2000&auto=format&fit=crop",
    cta1: "Shop Now",
    cta2: "Discover Artisans",
  },
  {
    title: "New Arrivals",
    subtitle: "Fresh designs from rising creators.",
    img: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=2000&auto=format&fit=crop",
    cta1: "Shop Now",
    cta2: "Discover Artisans",
  },
];

export const MOCK_PRODUCTS = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  title: `Handcrafted Item ${i + 1}`,
  artisan: i % 2 === 0 ? "Anita Devi" : "Rahul Verma",
  price: (999 + i * 150),
  rating: 4 + (i % 2 ? 0.5 : 0),
  img: `https://images.unsplash.com/photo-1523419409543-01f7fa1fdf2d?q=80&w=1500&auto=format&fit=crop`,
  description:
    "A beautiful handcrafted piece made with love and traditional techniques. Sustainable, locally sourced materials.",
}));

export const RECOMMENDED = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 101,
  title: `Recommended Craft ${i + 1}`,
  artisan: i % 2 ? "Meera N." : "Sanjay K.",
  price: (1299 + i * 120),
  rating: 4.5,
  img: `https://images.unsplash.com/photo-1520975922284-8b456906c813?q=80&w=1500&auto=format&fit=crop`,
}));

export const ARTISANS = [
  {
    id: 1,
    name: "Rukmini Bai",
    location: "Kanchipuram, Tamil Nadu",
    craft: "Silk Weaving",
    img: "https://images.unsplash.com/photo-1556228453-efd1e3f222ef?q=80&w=1500&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Iqbal Hussain",
    location: "Srinagar, J&K",
    craft: "Papier-mâché",
    img: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1500&auto=format&fit=crop",
  },
];

export const STORIES = [
  {
    id: 1,
    title: "Threads of Heritage: The Kancheevaram Saga",
    img: "https://images.unsplash.com/photo-1580041065738-e72023775cdc?q=80&w=1500&auto=format&fit=crop",
    excerpt: "From temple towns to global runways—how silk storytellers spin tradition into modernity.",
  },
  {
    id: 2,
    title: "Clay & Fire: A Potter’s Rhythm",
    img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1500&auto=format&fit=crop",
    excerpt: "At the wheel, time slows. Witness the dance of earth, water, and flame.",
  },
  {
    id: 3,
    title: "Metal Hearts: Bidri’s Black Magic",
    img: "https://images.unsplash.com/photo-1520975922284-8b456906c813?q=80&w=1500&auto=format&fit=crop",
    excerpt: "Inlay traditions that gleam through centuries of craft excellence.",
  },
];