// src/components/ui-elements/Rating.jsx

import React from 'react';
import { Star } from 'lucide-react';

export default function Rating({ value }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const stars = Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      // Added some colors to make the stars appear filled
      className={`h-4 w-4 ${i < full ? "fill-yellow-400 text-yellow-400" : half && i === full ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
    />
  ));

  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${value} out of 5`}>
      {stars}
      <span className="text-xs text-muted-foreground">{value.toFixed(1)}</span>
    </div>
  );
}