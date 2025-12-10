import React, { useEffect, useState } from 'react';
import ArtisanCard from '../components/ui/sections/ArtisanCard';
import { getApiUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import { useTranslation } from '@/hooks/useTranslation';

export default function AllArtisansPage() {
  const { t } = useTranslation();
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchArtisans = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl('/api/artisans'));
        if (!response.ok) throw new Error('Failed to fetch artisans.');
        const data = await response.json();
        setArtisans(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArtisans();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  if (error) return <div className="text-center py-20 text-red-500">{t('artisansPage.error')}: {error}</div>;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">{t('artisansPage.title')}</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            {t('artisansPage.subtitle')}
          </p>
        </div>

        {artisans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {artisans.map(artisan => (
              <ArtisanCard key={artisan._id} artisan={artisan} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-20">{t('artisansPage.noArtisans')}</div>
        )}
      </div>
    </div>
  );
}