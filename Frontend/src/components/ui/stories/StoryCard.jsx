import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

export default function StoryCard({ story }) {
  return (
    <Link to={`/stories/${story._id}`}>
      <Card className="overflow-hidden group transition-shadow duration-300 shadow-lg hover:shadow-xl h-full flex flex-col">
        <div className="aspect-video overflow-hidden bg-gray-100">
          <img 
            src={story.coverImageURL} 
            alt={story.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          />
        </div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold text-lg line-clamp-2 flex-grow">{story.title}</h3>
          <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
            By {story.artisanId?.storeName || 'Karigar Mart'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}