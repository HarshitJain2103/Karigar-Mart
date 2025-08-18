// Frontend/src/hooks/useAutoCarousel.js

import { useState, useEffect } from 'react';

export default function useAutoCarousel(length, interval = 5000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % length);
    }, interval);
    return () => clearInterval(id);
  }, [length, interval]);

  return { index, setIndex };
}