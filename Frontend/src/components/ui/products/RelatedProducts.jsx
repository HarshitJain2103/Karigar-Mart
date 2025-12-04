import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard'; 
import { getApiUrl } from '@/lib/api';

export default function RelatedProducts({ categoryId, currentProductId }) {
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (categoryId) {
      const fetchRelated = async () => {
        try {
          const response = await fetch(getApiUrl(`/api/products?category=${categoryId}`));
          const data = await response.json();
          
          const filteredProducts = data.products
            .filter(p => p._id !== currentProductId)
            .slice(0, 4);

          setRelatedProducts(filteredProducts);
        } catch (error) {
          console.error("Failed to fetch related products:", error);
        }
      };
      fetchRelated();
    }
  }, [categoryId, currentProductId]);

  if (relatedProducts.length === 0) {
    return null; 
  }

  return (
    <div className="mt-24">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">You Might Also Like</h2>
      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
        {relatedProducts.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}