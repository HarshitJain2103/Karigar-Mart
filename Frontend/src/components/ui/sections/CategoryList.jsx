import React from 'react';
import { Link } from 'react-router-dom';

export default function CategoryList({ categories }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold tracking-tight">Categories</h3>
        <Link to="/shop" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
        {categories.map((c) => (
          <Link 
            key={c._id}
            to={`/shop?category=${c._id}`}
            className="group relative flex flex-col h-full overflow-hidden rounded-lg border shadow-sm text-center transition-shadow hover:shadow-md"
          >
            <div className="aspect-square w-full overflow-hidden">
              <img 
                src={c.imageURL} 
                alt={c.name} 
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
              />
            </div>
            
            <div className="mt-auto w-full p-0">
              <div className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800">
                {c.name}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}