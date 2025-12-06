import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Share2, Calendar } from 'lucide-react';
import ProductCard from '../components/ui/products/ProductCard';
import { getApiUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

export default function ArtisanStorePage() {
  const { artisanId } = useParams(); 
  
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl(`/api/artisans/${artisanId}/public`));
        if (!response.ok) throw new Error('Artisan store not found.');
        const data = await response.json();
        setStoreData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (artisanId) {
      fetchStoreData();
    }
  }, [artisanId]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg"/></div>;
  if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;
  if (!storeData) return <div className="text-center py-20">Store not found.</div>;

  const { profile, products } = storeData;

  // Format member since date
  const formatMemberSince = (date) => {
    if (!date) return 'Creator';
    const joinDate = new Date(date);
    return joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative h-64 md:h-80 w-full">
        <img 
          src={profile.media.heroImageURL} 
          alt={`${profile.storeName} banner`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 text-white">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight drop-shadow-lg">{profile.storeName}</h1>
                    <p className="text-md sm:text-lg mt-1 text-white/90 drop-shadow-md">{profile.tagline}</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <Button variant="secondary">Follow</Button>
                    <Button variant="secondary" size="icon"><Share2 className="h-4 w-4"/></Button>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Story */}
            <div id="about" className="lg:col-span-8">
                <h2 className="text-3xl font-bold mb-4 border-b pb-2">About our store</h2>
                <div className="prose max-w-none text-gray-700 leading-relaxed">
                    {profile.about.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">{paragraph}</p>
                    ))}
                </div>
            </div>  

            {/* Right Column: Sidebar */}
            <div className="lg:col-span-4">
                <Card>
                    <CardHeader>
                        <CardTitle>About the Artisan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-16 h-16 border-2 border-slate-200">
                                {profile.userId?.avatar ? (
                                    <AvatarImage 
                                        src={profile.userId.avatar} 
                                        alt={`${profile.userId.firstName} ${profile.userId.lastName}`}
                                    />
                                ) : null}
                                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                                    {profile.userId?.firstName?.[0]}{profile.userId?.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-semibold text-gray-900">
                                    {profile.userId?.firstName} {profile.userId?.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {profile.craft || 'Creator'}
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span>Based in {profile.address.city}, {profile.address.state}</span>
                        </div>
                        {profile.userId?.createdAt && (
                            <>
                                <Separator />
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4 flex-shrink-0" />
                                    <span>Member since {formatMemberSince(profile.userId.createdAt)}</span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
        
        <Separator className="my-12" />

        {/* Products Section */}
        <div>
            <h2 className="text-3xl font-bold mb-6 text-center">Our Collection</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
             {products.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    This artisan hasn't added any products yet.
                </div>
             )}
        </div>
      </div>
    </div>
  );
}