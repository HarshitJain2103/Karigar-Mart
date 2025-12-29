import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ImageUploader from '@/components/ui/ui-elements/ImageUploader';
import { getApiUrl } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';


export default function StoryEditor() {
  const { t } = useTranslation();
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
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refinedData, setRefinedData] = useState({ title: '', content: '' });

  // If in edit mode, fetch the story data when the component loads
  useEffect(() => {
    if (isEditMode && token) {
      const fetchStoryData = async () => {
        setLoading(true);
        try {
          const res = await fetch(getApiUrl(`/api/stories/my-stories/${storyId}`), {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!res.ok) throw new Error(t('storyEditor.fetchFailed'));
          const data = await res.json();

          setTitle(data.title);
          setContent(data.content);
          setCoverImageURL(data.coverImageURL);
        } catch (err) {
          setError(err.message);
          toast({ title: t('storyEditor.error'), description: err.message, variant: "destructive" });
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
    const endpoint = isEditMode ? getApiUrl(`/api/stories/${storyId}`) : getApiUrl('/api/stories');
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
        throw new Error(isEditMode ? t('storyEditor.updateFailed') : t('storyEditor.createFailed'));
      }

      toast({
        title: isEditMode ? t('storyEditor.updatedTitle') : t('storyEditor.publishedTitle'),
        description: isEditMode ? t('storyEditor.updatedDesc') : t('storyEditor.createdDesc'),
      });

      navigate('/dashboard/stories');

    } catch (err) {
      setError(err.message);
      toast({ title: t('storyEditor.error'), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: t('storyEditor.error'), description: t('storyEditor.refineError'), variant: "destructive" });
      return;
    }

    setRefining(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('/api/stories/refine'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine story content');
      }

      const data = await response.json();
      setRefinedData({ title: data.refinedTitle, content: data.refinedContent });
      setDialogOpen(true);

    }
    catch (err) {
      setError(err.message);
      toast({ title: t('storyEditor.error'), description: err.message, variant: "destructive" });
    } finally {
      setRefining(false);
    }
  };

  const handleApplyRefine = () => {
    setTitle(refinedData.title);
    setContent(refinedData.content);
    setDialogOpen(false);
    toast({
      title: t('storyEditor.refinedTitle'),
      description: t('storyEditor.refinedDesc'),
    });
  };

  const handleCancelRefine = () => {
    setDialogOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{isEditMode ? t('storyEditor.editTitle') : t('storyEditor.createTitle')}</h1>
        <p className="text-muted-foreground">{isEditMode ? t('storyEditor.editSubtitle') : t('storyEditor.createSubtitle')}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">{t('storyEditor.titleLabel')}</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('storyEditor.coverImageLabel')}</Label>
              <ImageUploader
                images={coverImageURL ? [coverImageURL] : []}
                onChange={(newImages) => setCoverImageURL(newImages[0] || null)}
                single={true} max={1} uploadType="stories"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">{t('storyEditor.contentLabel')}</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={15} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleRefine} disabled={refining || loading} variant="outline">
              {refining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('storyEditor.refineWithAI')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? t('storyEditor.saveChanges') : t('storyEditor.publishStory')}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('storyEditor.previewTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">{t('storyEditor.originalTitle')}</h3>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
            <div>
              <h3 className="font-semibold">{t('storyEditor.refinedTitleLabel')}</h3>
              <p className="text-sm">{refinedData.title}</p>
            </div>
            <div>
              <h3 className="font-semibold">{t('storyEditor.originalContent')}</h3>
              <Textarea value={content} readOnly rows={5} className="text-sm text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{t('storyEditor.refinedContent')}</h3>
              <Textarea value={refinedData.content} readOnly rows={5} className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelRefine}>{t('storyEditor.cancel')}</Button>
            <Button onClick={handleApplyRefine}>{t('storyEditor.applyChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}