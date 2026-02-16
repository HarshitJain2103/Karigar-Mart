import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export default function HeroSection({ slides, index, setIndex }) {
  const { t } = useTranslation();

  const prevSlide = useCallback(() => {
    const newIndex = (index - 1 + slides.length) % slides.length;
    setIndex(newIndex);
  }, [index, slides.length, setIndex]);

  const nextSlide = useCallback(() => {
    const newIndex = (index + 1) % slides.length;
    setIndex(newIndex);
  }, [index, slides.length, setIndex]);
  
 return (
  <section className="relative min-h-[85vh] overflow-hidden bg-background flex items-center">

    {/* Madhubani Background Patterns */}
    <div className="absolute left-0 top-0 h-full w-1/2 text-primary opacity-20">
      <MadhubaniPattern />
    </div>
    <div className="absolute right-0 top-0 h-full w-1/2 text-secondary opacity-20">
      <MadhubaniPattern />
    </div>

    {/* Decorative circles */}
    <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-secondary/10" />
    <div className="absolute -right-16 bottom-20 h-48 w-48 rounded-full bg-primary/10" />

    <div className="container relative z-10">
      <div className="mx-auto max-w-5xl">

        {/* Slider Container */}
        <div className="relative h-[420px] overflow-hidden rounded-3xl shadow-xl">

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
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={slide.img}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 text-center text-white px-6 md:px-12">

                <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                  🪔 भारत की कला, आपके घर तक
                </p>

                <h1 className="text-3xl font-extrabold md:text-5xl">
                  {slide.title}
                </h1>

                <p className="max-w-xl text-sm opacity-90 md:text-lg">
                  {slide.subtitle}
                </p>

                <div className="flex gap-4">
                  <Link to="/shop">
                    <Button size="lg" className="bg-primary px-8 shadow-lg hover:bg-primary/90">
                      {t('hero.shopNow')}
                    </Button>
                  </Link>

                  <Link to="/artisans">
                    <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10">
                      {t('hero.discoverArtisans')}
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Controls */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between p-4">
            <Button
              variant="secondary"
              size="icon"
              className="pointer-events-auto rounded-full"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="pointer-events-auto rounded-full"
              onClick={nextSlide}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

        </div>

      </div>
    </div>
  </section>
);
}