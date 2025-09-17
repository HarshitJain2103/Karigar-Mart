import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection({ slides, index, setIndex }) {
  const prevSlide = useCallback(() => {
    const newIndex = (index - 1 + slides.length) % slides.length;
    setIndex(newIndex);
  }, [index, slides.length, setIndex]);

  const nextSlide = useCallback(() => {
    const newIndex = (index + 1) % slides.length;
    setIndex(newIndex);
  }, [index, slides.length, setIndex]);
  
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative h-[360px] overflow-hidden rounded-3xl bg-muted">
          {slides.map((slide, i) => (
            <motion.div
              key={slide.title}
              className="absolute inset-0 h-full w-full"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ 
                opacity: index === i ? 1 : 0,
                scale: index === i ? 1 : 1.05
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              style={{ pointerEvents: index === i ? "auto" : "none" }}
            >
              <div className="absolute inset-0">
                <img src={slide.img} alt={slide.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/10" />
              </div>
              <div className="relative z-10 flex h-full flex-col items-start justify-center gap-4 p-8 text-white md:p-16">
                <h2 className="text-2xl font-bold md:text-4xl">{slide.title}</h2>
                <p className="max-w-xl text-sm opacity-90 md:text-base">{slide.subtitle}</p>
                <div className="flex gap-3">
                  <Link to="/shop">
                    <Button size="lg" className="rounded-full bg-white text-black hover:bg-white/90">
                      Shop Now
                    </Button>
                  </Link>
                  <Link to="/artisans">
                    <Button size="lg" variant="secondary" className="rounded-full">
                      Discover Artisans
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
          {/* Controls */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between p-3">
            <Button
              variant="secondary"
              size="icon"
              className="pointer-events-auto rounded-full"
              onClick={prevSlide} 
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="pointer-events-auto rounded-full"
              onClick={nextSlide} 
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}