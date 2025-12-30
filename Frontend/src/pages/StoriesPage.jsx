import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import StoryCard from '@/components/ui/stories/StoryCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown,
  Share2,
  Copy,
  Check,
  Tag as TagIcon,
  Globe,
  XCircle
} from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import { useTranslation } from '@/hooks/useTranslation';

export default function StoriesPage() {
  const { t } = useTranslation();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [copied, setCopied] = useState(false);

  // Masonry + infinite scroll
  const pageSize = 9;
  const [visible, setVisible] = useState(pageSize);
  const sentinelRef = useRef(null);
  const [autoPaging, setAutoPaging] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(getApiUrl('/api/stories'));
        if (!res.ok) throw new Error('Failed to fetch stories.');
        const data = await res.json();
        setStories(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to fetch stories.');
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  // Build filters from data with counts
  const { categories, categoryCounts, tags, tagCounts } = useMemo(() => {
    const catCounts = new Map();
    const tagCountsMap = new Map();
    for (const s of stories) {
      const c = s?.category?.name || s?.category;
      if (c) catCounts.set(c, (catCounts.get(c) || 0) + 1);
      if (Array.isArray(s?.tags)) {
        for (const t of s.tags) {
          if (t) tagCountsMap.set(t, (tagCountsMap.get(t) || 0) + 1);
        }
      }
    }
    return {
      categories: Array.from(catCounts.keys()),
      categoryCounts: Object.fromEntries(catCounts),
      tags: Array.from(tagCountsMap.keys()),
      tagCounts: Object.fromEntries(tagCountsMap),
    };
  }, [stories]);

  // Processed list
  const processed = useMemo(() => {
    let list = [...stories];

    // Text search
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const title = String(s?.title || '').toLowerCase();
        const region = String(s?.region || '').toLowerCase();
        const excerpt = String(s?.excerpt || s?.summary || '').toLowerCase();
        const author =
          String(s?.author?.name || s?.artisan?.storeName || s?.createdBy?.name || '').toLowerCase();
        return (
          title.includes(q) ||
          region.includes(q) ||
          excerpt.includes(q) ||
          author.includes(q) ||
          String(s?._id || '').toLowerCase().includes(q)
        );
      });
    }

    // Category filter
    if (category !== 'all') {
      list = list.filter((s) => {
        const c = s?.category?.name || s?.category;
        return String(c || '').toLowerCase() === String(category).toLowerCase();
      });
    }

    // Tag filter (multi)
    if (selectedTags.length) {
      list = list.filter(
        (s) => Array.isArray(s?.tags) && selectedTags.every((t) => s.tags.includes(t))
      );
    }

    // Sort
    list.sort((a, b) => {
      const aDate = new Date(a?.createdAt || 0).getTime();
      const bDate = new Date(b?.createdAt || 0).getTime();
      const aViews = Number(a?.views || a?.viewCount || 0);
      const bViews = Number(b?.views || b?.viewCount || 0);
      const aFeatured = a?.isFeatured ? 1 : 0;
      const bFeatured = b?.isFeatured ? 1 : 0;

      switch (sortBy) {
        case 'featured':
          return bFeatured - aFeatured || bDate - aDate;
        case 'popular':
          return bViews - aViews || bDate - aDate;
        case 'oldest':
          return aDate - bDate;
        case 'newest':
        default:
          return bDate - aDate;
      }
    });

    return list;
  }, [stories, query, category, selectedTags, sortBy]);

  const heroStory = useMemo(() => {
    const featured = processed.find((s) => s?.isFeatured);
    return featured || processed[0];
  }, [processed]);

  const gridStories = useMemo(() => {
    const rest = heroStory ? processed.filter((s) => s !== heroStory) : processed;
    return rest.slice(0, visible);
  }, [processed, heroStory, visible]);

  // Infinite scroll
  useEffect(() => {
    if (!autoPaging) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisible((v) => {
            if (v >= (heroStory ? processed.length - 1 : processed.length)) return v;
            return v + pageSize;
          });
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [processed.length, heroStory, autoPaging]);

  // Reset pagination on filter changes
  useEffect(() => {
    setVisible(pageSize);
  }, [query, category, selectedTags, sortBy]);

  async function handleShare() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/stories` : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: t('storiesPage.title'), text: t('storiesPage.subtitle'), url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }
    } catch {
      // ignore
    }
  }

  function toggleTag(t) {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
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
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="text-center text-red-600 font-medium">{t('storiesPage.error')}: {error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>{t('storiesPage.retry')}</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t('storiesPage.title')}</h1>
        <p className="text-lg text-muted-foreground mt-2">{t('storiesPage.subtitle')}</p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-md border px-3 py-2 bg-background">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('storiesPage.searchPlaceholder')}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="bg-transparent text-sm outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">{t('storiesPage.allCategories')}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c} {categoryCounts[c] ? `(${categoryCounts[c]})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              className="bg-transparent text-sm outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort stories"
            >
              <option value="newest">{t('storiesPage.sortNewest')}</option>
              <option value="oldest">{t('storiesPage.sortOldest')}</option>
              <option value="popular">{t('storiesPage.sortPopular')}</option>
              <option value="featured">{t('storiesPage.sortFeatured')}</option>
            </select>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleShare}>
            {navigator.share ? <Share2 className="h-4 w-4" /> : copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {navigator.share ? t('storiesPage.share') : copied ? t('storiesPage.copied') : t('storiesPage.copyLink')}
          </Button>
        </div>
      </div>

      {/* Tag chips */}
      {tags.length > 0 && (
        <div className="mb-6 flex items-center gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
            <TagIcon className="h-4 w-4" /> {t('storiesPage.tags')}
          </div>
          <div className="flex items-center gap-2">
            {tags.map((t) => {
              const active = selectedTags.includes(t);
              return (
                <button
                  key={t}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${active ? 'bg-primary text-white border-primary' : 'bg-background hover:bg-muted'
                    }`}
                  onClick={() => toggleTag(t)}
                >
                  <span>{t}</span>
                  {typeof tagCounts[t] === 'number' && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20' : 'bg-muted'}`}>
                      {tagCounts[t]}
                    </span>
                  )}
                </button>
              );
            })}
            {selectedTags.length > 0 && (
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => setSelectedTags([])}>
                <XCircle className="h-4 w-4" /> {t('storiesPage.clear')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Hero */}
      {processed.length > 0 ? (
        <>
          {heroStory && (
            <div className="mb-10 rounded-2xl overflow-hidden relative border">
              <Link to={`/stories/${heroStory._id}`} className="block rounded-2xl overflow-hidden relative group">
                <div className="relative h-[320px] sm:h-[420px]">
                  {heroStory?.coverImageURL || heroStory?.image ? (
                    <img
                      src={heroStory.coverImageURL}
                      alt={heroStory.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
                      <Globe className="h-3.5 w-3.5" />
                      {heroStory?.region || heroStory?.category?.name || 'Story'}
                    </div>
                    <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-snug line-clamp-2">{heroStory?.title}</h2>
                    <p className="mt-2 text-sm text-white/90 line-clamp-2">
                      {heroStory?.excerpt || heroStory?.summary || t('storiesPage.fallbackExcerpt')}
                    </p>
                    <div className="mt-4">
                      <Button size="sm" variant="secondary">{t('storiesPage.readStory')}</Button>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
          {/* Masonry grid (CSS columns) */}
          <div className="mb-4">
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
              {gridStories.map((story) => (
                <div key={story._id} className="mb-6 break-inside-avoid">
                  <StoryCard story={story} />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('storiesPage.noStories')}</h1>
          <p className="text-muted-foreground mt-2">{t('storiesPage.refineFilters')}</p>
        </div>
      )}

      {/* Load more / sentinel */}
      {processed.length > (heroStory ? 1 : 0) + gridStories.length && (
        <div className="flex items-center justify-center gap-3 mt-2">
          <div ref={sentinelRef} />
          <Button variant="outline" onClick={() => setVisible((v) => v + pageSize)}>
            {t('storiesPage.loadMore')}
          </Button>
          <Button variant="ghost" onClick={() => setAutoPaging((v) => !v)}>
            {autoPaging ? t('storiesPage.pauseAuto') : t('storiesPage.autoLoad')}
          </Button>
        </div>
      )}

      <Separator className="my-12" />

      {/* Footer note */}
      <div className="text-center text-sm text-muted-foreground">
        {t('storiesPage.footerNote')}
      </div>
    </div>
  );
}