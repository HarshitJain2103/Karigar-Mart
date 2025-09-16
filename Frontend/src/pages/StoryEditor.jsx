import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; 
import useAuthStore from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ImageUploader from '@/components/ui/ui-elements/ImageUploader';

export default function StoryEditor() {
  const navigate = useNavigate();
  const { storyId } = useParams(); 
  const isEditMode = Boolean(storyId); 

  const { toast } = useToast();
  const token = useAuthStore((state) => state.token);

  // State for the form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageURL, setCoverImageURL] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If in edit mode, fetch the story data when the component loads
  useEffect(() => {
    if (isEditMode && token) {
      const fetchStoryData = async () => {
        setLoading(true);
        try {
          const res = await fetch(`http://localhost:8000/api/stories/my-stories/${storyId}`, {
             headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Failed to fetch story data.');
          const data = await res.json();
          
          setTitle(data.title);
          setContent(data.content);
          setCoverImageURL(data.coverImageURL);
        } catch (err) {
            setError(err.message);
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
      };
      fetchStoryData();
    }
  }, [storyId, isEditMode, token, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !content || !coverImageURL) {
      return;
    }
    
    setLoading(true);
    
    const storyData = { title, content, coverImageURL };
    const endpoint = isEditMode ? `http://localhost:8000/api/stories/${storyId}` : 'http://localhost:8000/api/stories';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(storyData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} story.`);
      }
      
      toast({
        title: `Story ${isEditMode ? 'Updated' : 'Published'}!`,
        description: `Your story has been successfully ${isEditMode ? 'saved' : 'created'}.`,
      });

      navigate('/dashboard/stories');

    } catch (err) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Story' : 'Create a New Story'}</h1>
        <p className="text-muted-foreground">{isEditMode ? 'Make changes to your story and save.' : 'Share a new chapter of your artisan journey.'}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Story Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <ImageUploader
                images={coverImageURL ? [coverImageURL] : []}
                onChange={(newImages) => setCoverImageURL(newImages[0] || null)}
                single={true} max={1} uploadType="stories" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Story Content</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={15} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Publish Story'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}