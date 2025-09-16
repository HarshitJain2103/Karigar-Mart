import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function ArtisanCard({ artisan }) {
  const artisanName = `${artisan.userId.firstName} ${artisan.userId.lastName}`;

  return (
    <Card className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link to={`/store/${artisan._id}`} className="block">
        <div className="relative h-48 w-full">
          <img 
            src={artisan.media.heroImageURL} 
            alt={artisan.storeName} 
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4 text-white">
            <h3 className="text-xl font-bold drop-shadow-md">{artisan.storeName}</h3>
          </div>
        </div>
      </Link>
      <CardContent className="p-4 bg-white">
        <div className="mb-3">
          <p className="text-sm text-muted-foreground font-medium">{artisan.craft || 'Unique Crafts'}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {artisan.address.city}, {artisan.address.state}
          </p>
        </div>
        <p className="text-sm text-gray-600 line-clamp-3 mb-4 h-16">
          {artisan.about.slice(0, 100)}...
        </p>
        <div className="flex gap-2">
            <Link to={`/store/${artisan._id}`} className="flex-1">
                <Button className="w-full">View Store</Button>
            </Link>
            <Button variant="secondary" className="flex-1">Follow</Button>
        </div>
      </CardContent>
    </Card>
  );
}