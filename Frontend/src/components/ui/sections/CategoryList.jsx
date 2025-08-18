// src/components/sections/CategoryList.jsx
import React from 'react';

export default function CategoryList({ categories }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">Categories</h3>
        <a href="#" className="text-sm text-primary hover:underline">View all</a>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
        {categories.map((c) => (
          <a key={c.name} href="#" className="group relative overflow-hidden rounded-2xl border shadow-sm">
            <img src={c.img} alt={c.name} className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium">
              {c.name}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}