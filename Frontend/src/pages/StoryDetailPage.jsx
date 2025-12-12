import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  AlertTriangle,
  Share2,
  Copy,
  Check,
  CalendarDays,
  Clock,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import { useTranslation } from '@/hooks/useTranslation';

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default function StoryDetailPage() {
  const { t } = useTranslation();
  const { storyId } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchStory = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(getApiUrl(`/api/stories/${storyId}`));
        if (!res.ok) throw new Error('Story not found.');
        const data = await res.json();
        setStory(data);
      } catch (err) {
        setError(err.message || 'Failed to load story.');
      } finally {
        setLoading(false);
      }
    };
    if (storyId) fetchStory();
  }, [storyId]);

  const readingStats = useMemo(() => {
    const text = String(story?.content || '');
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    return { wordCount, minutes };
  }, [story?.content]);

  const contentHtml = useMemo(() => {
    const raw = String(story?.content || '');
    // Render newlines nicely while supporting basic HTML that might exist
    if (!raw) return '';
    // If it already contains block HTML tags, skip aggressive transforms
    if (/<(p|h1|h2|h3|ul|ol|li|br|blockquote|img|strong|em)\b/i.test(raw)) {
      return raw;
    }
    return raw
      .split('\n\n')
      .map((para) => `<p>${para.replace(/\n/g, '<br />')}</p>`)
      .join('');
  }, [story?.content]);

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      setSharing(true);
      if (navigator.share) {
        await navigator.share({
          title: story?.title || 'Story',
          text: 'Check out this story',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }
    } catch {
    } finally {
      setSharing(false);
    }
  }

  function handleCopy() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="text-center text-red-600 font-medium">{error}</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t('storyDetails.back')}
        </Button>
      </div>
    );
  }

  if (!story) return null;

  const cover = story.coverImageURL;
  const artisanId = story.artisanId?._id;
  const artisanName = story.artisanId?.storeName || 'Artisan';

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back + breadcrumbs-ish */}
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('storyDetails.back')}
        </Button>
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/stories" className="hover:underline">{t('storyDetails.stories')}</Link>
          <span>/</span>
          <span className="truncate max-w-[40ch]">{story.title}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-[260px] sm:h-[420px] rounded-2xl overflow-hidden border">
        {cover ? (
          <img src={cover} alt={story.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
            <BookOpen className="h-3.5 w-3.5" />
            {t('storyDetails.story')}
          </div>
          <h1 className="mt-3 text-2xl sm:text-4xl font-bold leading-tight">{story.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/85">
            <span>
              {t('storyDetails.by')}{' '}
              {artisanId ? (
                <Link to={`/store/${artisanId}`} className="font-semibold hover:underline">
                  {artisanName}
                </Link>
              ) : (
                <span className="font-semibold">{artisanName}</span>
              )}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {formatDate(story.createdAt)}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {t('storyDetails.minRead', {minutes: readingStats.minutes})}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button variant="secondary" size="sm" className="gap-2" onClick={handleShare} disabled={sharing}>
              <Share2 className="h-4 w-4" />
              {t('storyDetails.share')}
            </Button>
            {!navigator.share && (
              <Button variant="secondary" size="sm" className="gap-2" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t('storyDetails.copied') : t('storyDetails.copyLink')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto mt-10">
        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {formatDate(story.createdAt)}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {t('storyDetails.minRead', {minutes: readingStats.minutes})} • {t('storyDetails.wordsCount', {count: readingStats.wordCount})}
            </span>
          </div>
          <Link to="/stories" className="hidden sm:inline text-primary hover:underline">
            {t('storyDetails.browseMore')}
          </Link>
        </div>

        <Separator className="mb-8" />

        <article className="prose prose-neutral lg:prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>

        <Separator className="my-10" />

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {t('storyDetails.publishedOn', {date: formatDate(story.createdAt)})} by{' '}
            {artisanId ? (
              <Link to={`/store/${artisanId}`} className="text-primary hover:underline">
                {artisanName}
              </Link>
            ) : (
              artisanName
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={handleShare} disabled={sharing}>
              <Share2 className="h-4 w-4" />
              {t("storyDetails.share")}
            </Button>
            {!navigator.share && (
              <Button variant="outline" className="gap-2" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t('storyDetails.copied') : t('storyDetails.copyLink')}
              </Button>
            )}
            <Link to="/stories">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t("storyDetails.backToStories")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}