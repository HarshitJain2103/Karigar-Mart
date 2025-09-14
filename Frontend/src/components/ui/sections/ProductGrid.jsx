import React from 'react';
import ProductCard from '@/components/ui/products/ProductCard';

export default function ProductGrid({ title, subtitle, link, products }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">{title}</h3>
        {subtitle ? (
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        ) : (
          <a href="#" className="text-sm text-primary hover:underline">{link || "See more"}</a>
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}