import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import ProductCard from '../components/ui/products/ProductCard';
import { useVideoSSE } from '../hooks/useVideoSSE';
import { Wifi, WifiOff } from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import { useTranslation } from '@/hooks/useTranslation';

export default function ShopPage() {
  const { t } = useTranslation();
  const [productsData, setProductsData] = useState({ products: [], page: 1, pages: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch(getApiUrl('/api/categories'));
      const data = await response.json();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const params = new URLSearchParams(searchParams);
      try {
        const response = await fetch(getApiUrl(`/api/products?${params.toString()}`));
        const data = await response.json();
        setProductsData(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  const handleVideoStatusUpdate = (productId, statusData) => {
    console.log(`[SHOP] Video update for ${productId}:`, statusData);

    setProductsData(prev => ({
      ...prev,
      products: prev.products.map(product => {
        if (product._id === productId) {
          return {
            ...product,
            videoStatus: statusData.videoStatus,
            marketingVideo: statusData.videoUrl ? {
              ...product.marketingVideo,
              url: statusData.videoUrl,
              generatedAt: statusData.generatedAt
            } : product.marketingVideo
          };
        }
        return product;
      })
    }));
  };

  const { isConnected, generatingCount } = useVideoSSE(
    productsData.products,
    handleVideoStatusUpdate
  );

  const handleFilterChange = (key, value) => {
    setSearchParams(prev => {
      if (value === 'all' || !value) {
        prev.delete(key);
      } else {
        prev.set(key, value);
      }
      prev.set('pageNumber', '1');
      return prev;
    });
  };

  const handlePageChange = (newPage) => {
    setSearchParams(prev => {
      prev.set('pageNumber', newPage.toString());
      return prev;
    });
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">{t('shopPage.title')}</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            {t('shopPage.subtitle')}
          </p>
        </div>

        {generatingCount > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="text-sm text-blue-800">
                  <strong>{t('shopPage.liveUpdates')}</strong> - {generatingCount} {t('shopPage.generatingVideos')}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {t('shopPage.connecting')}
                </span>
              </>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-slate-50 rounded-lg border">
          <Select onValueChange={(value) => handleFilterChange('category', value)} defaultValue={searchParams.get('category') || 'all'}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder={t('shopPage.filterCategory')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('shopPage.allCategories')}</SelectItem>
              {categories.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-top h-screen"><Spinner size="lg" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {productsData.products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            <div className="mt-12">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (productsData.page > 1) handlePageChange(productsData.page - 1); }} />
                  </PaginationItem>
                  {[...Array(productsData.pages).keys()].map(p => (
                    <PaginationItem key={p + 1}>
                      <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(p + 1); }} isActive={productsData.page === p + 1}>
                        {p + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (productsData.page < productsData.pages) handlePageChange(productsData.page + 1); }} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </div>
    </div>
  );
}